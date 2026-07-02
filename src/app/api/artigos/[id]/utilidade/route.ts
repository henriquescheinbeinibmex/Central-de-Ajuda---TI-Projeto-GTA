import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  if (session.user.role === "CONSULTOR_TI") {
    return NextResponse.json({ erro: "Consultores TI não votam em artigos" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.artigo.update({
      where: { id },
      data: { utilidade: { increment: 1 } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ erro: "Artigo não encontrado" }, { status: 404 });
  }
}
