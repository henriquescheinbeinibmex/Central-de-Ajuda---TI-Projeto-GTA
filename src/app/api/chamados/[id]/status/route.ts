import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const { status, observacao } = await req.json();

  const chamado = await prisma.chamado.findUnique({ where: { id } });
  if (!chamado) return NextResponse.json({ erro: "Chamado não encontrado" }, { status: 404 });

  const ehTI = session.user.role === "CONSULTOR_TI";
  const ehAutor = session.user.id === chamado.autorId;

  // Apenas duas transições são permitidas por esta rota; as demais têm endpoints dedicados
  // (propor solução: /solucao, validar: /validar, dar feedback: /feedback)
  if (status === "EM_ANDAMENTO") {
    if (!ehTI) {
      return NextResponse.json({ erro: "Apenas o consultor de TI pode assumir um chamado" }, { status: 403 });
    }
    if (chamado.status !== "ABERTO") {
      return NextResponse.json({ erro: "Este chamado não está mais aberto para ser assumido" }, { status: 409 });
    }
    await prisma.chamado.update({
      where: { id },
      data: {
        status: "EM_ANDAMENTO",
        consultorId: session.user.id,
        historico: {
          create: { status: "EM_ANDAMENTO", observacao: observacao ?? "Chamado assumido pelo consultor de TI", usuarioId: session.user.id },
        },
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (status === "REABERTO") {
    if (!ehTI) {
      return NextResponse.json({ erro: "Apenas o consultor de TI pode reabrir um chamado" }, { status: 403 });
    }
    if (chamado.status !== "SOLUCAO_PROPOSTA") {
      return NextResponse.json({ erro: "Este chamado não está com solução proposta no momento" }, { status: 409 });
    }
    await prisma.chamado.update({
      where: { id },
      data: {
        status: "REABERTO",
        dataValidacao: null,
        historico: {
          create: { status: "REABERTO", observacao: observacao ?? "Chamado reaberto pelo consultor de TI", usuarioId: session.user.id },
        },
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ erro: "Transição de status não permitida por esta rota" }, { status: 400 });
}
