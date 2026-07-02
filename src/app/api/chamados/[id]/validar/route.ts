import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;

  const chamado = await prisma.chamado.findUnique({ where: { id } });
  if (!chamado) return NextResponse.json({ erro: "Chamado não encontrado" }, { status: 404 });
  if (chamado.status !== "SOLUCAO_PROPOSTA") {
    return NextResponse.json({ erro: "Apenas chamados com solução proposta podem ser validados" }, { status: 409 });
  }

  await prisma.chamado.update({
    where: { id },
    data: {
      status: "VALIDADO",
      validadoEm: new Date(),
      historico: {
        create: {
          status: "VALIDADO",
          observacao: "Chamado validado pelo consultor de TI após prazo sem reincidência.",
          usuarioId: session.user.id,
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
