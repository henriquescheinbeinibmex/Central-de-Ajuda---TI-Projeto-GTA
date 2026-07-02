import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const setores = await prisma.setor.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(setores);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { nome } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 });

  try {
    const setor = await prisma.setor.create({ data: { nome: nome.trim() } });
    return NextResponse.json(setor, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Já existe um setor com esse nome" }, { status: 409 });
  }
}
