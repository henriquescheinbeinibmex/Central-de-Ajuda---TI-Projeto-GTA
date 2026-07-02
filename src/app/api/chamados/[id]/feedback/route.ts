import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarEmailChamadoReaberto } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const { feedback, comentario } = await req.json();

  if (feedback !== "resolveu" && feedback !== "nao_resolveu") {
    return NextResponse.json({ erro: "Feedback inválido" }, { status: 400 });
  }

  const chamado = await prisma.chamado.findUnique({ where: { id } });
  if (!chamado) return NextResponse.json({ erro: "Não encontrado" }, { status: 404 });
  if (chamado.autorId !== session.user.id) return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  if (chamado.status !== "SOLUCAO_PROPOSTA") {
    return NextResponse.json({ erro: "Este chamado não está aguardando feedback no momento" }, { status: 409 });
  }

  if (feedback === "nao_resolveu") {
    // Reabre o chamado imediatamente e reinicia o prazo de validação
    await prisma.chamado.update({
      where: { id },
      data: {
        feedbackColaborador: feedback,
        feedbackComentario: comentario ?? null,
        status: "REABERTO",
        dataValidacao: null,
        historico: {
          create: {
            status: "REABERTO",
            observacao: `Colaborador indicou que o problema não foi resolvido${comentario ? `: ${comentario}` : ""}`,
            usuarioId: session.user.id,
          },
        },
      },
    });

    enviarEmailChamadoReaberto({
      chamadoId: id,
      chamadoTitulo: chamado.titulo,
      comentario: comentario ?? null,
    }).catch(() => {});
  } else {
    await prisma.chamado.update({
      where: { id },
      data: {
        feedbackColaborador: feedback,
        feedbackComentario: comentario ?? null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
