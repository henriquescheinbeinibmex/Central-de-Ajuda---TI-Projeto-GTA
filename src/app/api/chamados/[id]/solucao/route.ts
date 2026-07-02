import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const { solucao } = await req.json();

  if (!solucao?.trim()) {
    return NextResponse.json({ erro: "Solução não pode ser vazia" }, { status: 400 });
  }

  const chamado = await prisma.chamado.findUnique({ where: { id } });
  if (!chamado) return NextResponse.json({ erro: "Chamado não encontrado" }, { status: 404 });
  if (!["ABERTO", "EM_ANDAMENTO", "REABERTO"].includes(chamado.status)) {
    return NextResponse.json({ erro: "Este chamado não está em um status que permita registrar solução" }, { status: 409 });
  }

  const agora = new Date();
  const dataValidacao = new Date(agora);
  dataValidacao.setDate(dataValidacao.getDate() + 14);

  await prisma.chamado.update({
    where: { id },
    data: {
      status: "SOLUCAO_PROPOSTA",
      solucaoProposta: solucao,
      dataSolucao: agora,
      dataValidacao,
      consultorId: session.user.id,
      // Limpa feedback de uma rodada anterior, caso esta seja uma nova tentativa após reabertura
      feedbackColaborador: null,
      feedbackComentario: null,
      historico: {
        create: {
          status: "SOLUCAO_PROPOSTA",
          observacao: "Solução registrada. Prazo de validação: 14 dias.",
          usuarioId: session.user.id,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
