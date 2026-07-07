import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  enviarEmailNovoChamado,
  enviarEmailChamadoAprovado,
  enviarEmailChamadoReprovado,
} from "@/lib/email";

// Gestor (ou TI) aprova ou reprova um chamado que aguarda aprovação.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const ehGestor = session.user.role === "GESTOR";
  const ehTI = session.user.role === "CONSULTOR_TI";
  if (!ehGestor && !ehTI) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const { acao, motivo } = await req.json();

  if (acao !== "aprovar" && acao !== "reprovar") {
    return NextResponse.json({ erro: "Ação inválida" }, { status: 400 });
  }
  if (acao === "reprovar" && !motivo?.trim()) {
    return NextResponse.json({ erro: "Informe o motivo da reprovação" }, { status: 400 });
  }

  const chamado = await prisma.chamado.findUnique({
    where: { id },
    include: {
      autor: { select: { nome: true, email: true } },
      setor: { select: { nome: true } },
    },
  });

  if (!chamado) return NextResponse.json({ erro: "Chamado não encontrado" }, { status: 404 });

  // Gestor só aprova chamados do seu próprio setor. TI pode aprovar qualquer um.
  if (ehGestor && chamado.setorId !== session.user.setorId) {
    return NextResponse.json({ erro: "Você só pode aprovar chamados do seu setor" }, { status: 403 });
  }
  if (chamado.status !== "AGUARDANDO_APROVACAO") {
    return NextResponse.json({ erro: "Este chamado não está aguardando aprovação" }, { status: 409 });
  }

  const gestorNome = session.user.name ?? "Gestor";

  if (acao === "aprovar") {
    await prisma.chamado.update({
      where: { id },
      data: {
        status: "ABERTO",
        aprovadoPorId: session.user.id,
        aprovadoEm: new Date(),
        prazoAprovacao: null,
        historico: {
          create: {
            status: "ABERTO",
            observacao: `Chamado aprovado por ${gestorNome} e encaminhado ao TI`,
            usuarioId: session.user.id,
          },
        },
      },
    });

    // Notifica TI (novo chamado) e o colaborador (aprovado)
    try {
      await enviarEmailNovoChamado({
        chamadoId: chamado.id,
        chamadoTitulo: chamado.titulo,
        setor: chamado.setor?.nome ?? "—",
        urgencia: chamado.urgencia,
      });
    } catch (err) {
      console.error("[email:novoChamado]", err instanceof Error ? err.message : err);
    }
    if (chamado.autor?.email) {
      try {
        await enviarEmailChamadoAprovado({
          colaboradorEmail: chamado.autor.email,
          colaboradorNome: chamado.autor.nome,
          chamadoId: chamado.id,
          chamadoTitulo: chamado.titulo,
          gestorNome,
        });
      } catch (err) {
        console.error("[email:chamadoAprovado]", err instanceof Error ? err.message : err);
      }
    }
  } else {
    await prisma.chamado.update({
      where: { id },
      data: {
        status: "REPROVADO",
        aprovadoPorId: session.user.id,
        aprovadoEm: new Date(),
        motivoReprovacao: motivo.trim(),
        prazoAprovacao: null,
        historico: {
          create: {
            status: "REPROVADO",
            observacao: `Chamado reprovado por ${gestorNome}: ${motivo.trim()}`,
            usuarioId: session.user.id,
          },
        },
      },
    });

    if (chamado.autor?.email) {
      try {
        await enviarEmailChamadoReprovado({
          colaboradorEmail: chamado.autor.email,
          colaboradorNome: chamado.autor.nome,
          chamadoId: chamado.id,
          chamadoTitulo: chamado.titulo,
          gestorNome,
          motivo: motivo.trim(),
        });
      } catch (err) {
        console.error("[email:chamadoReprovado]", err instanceof Error ? err.message : err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
