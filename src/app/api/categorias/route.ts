import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const categorias = await prisma.categoria.findMany({ orderBy: { nome: "asc" } });
  return NextResponse.json(categorias);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { nome, icone } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 });

  try {
    const cat = await prisma.categoria.create({ data: { nome: nome.trim(), icone: icone ?? null } });
    return NextResponse.json(cat, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Já existe uma categoria com esse nome" }, { status: 409 });
  }
}
