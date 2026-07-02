import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const { nome } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 });

  try {
    const setor = await prisma.setor.update({ where: { id }, data: { nome: nome.trim() } });
    return NextResponse.json(setor);
  } catch {
    return NextResponse.json({ erro: "Já existe um setor com esse nome" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const [emUsoChamados, emUsoUsuarios] = await Promise.all([
    prisma.chamado.count({ where: { setorId: id } }),
    prisma.user.count({ where: { setorId: id } }),
  ]);
  if (emUsoChamados > 0) return NextResponse.json({ erro: "Setor em uso por chamados existentes" }, { status: 409 });
  if (emUsoUsuarios > 0) return NextResponse.json({ erro: "Setor em uso por usuários existentes" }, { status: 409 });

  await prisma.setor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
