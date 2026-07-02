import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const { nome, username: usernameRaw, email: emailRaw, role, setorId, novaSenha } = await req.json();

  if (!nome?.trim() || !usernameRaw?.trim() || !emailRaw?.trim()) {
    return NextResponse.json({ erro: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const username = usernameRaw.trim().toLowerCase();
  const email = emailRaw.trim().toLowerCase();

  const conflito = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }], NOT: { id } },
  });
  if (conflito) {
    return NextResponse.json({ erro: "Usuário ou email já cadastrado para outra conta" }, { status: 409 });
  }

  const data: Record<string, unknown> = { nome, username, email, role, setorId: setorId ?? null };
  if (novaSenha?.trim()) data.senha = await hash(novaSenha, 12);

  try {
    const usuario = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nome: true, username: true, email: true, role: true },
    });
    return NextResponse.json(usuario);
  } catch {
    return NextResponse.json({ erro: "Não foi possível atualizar o usuário. Verifique o setor informado." }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  if (id === session.user.id) return NextResponse.json({ erro: "Não é possível excluir a própria conta" }, { status: 400 });

  const [chamadosAbertos, chamadosAtendidos, artigosAutor] = await Promise.all([
    prisma.chamado.count({ where: { autorId: id } }),
    prisma.chamado.count({ where: { consultorId: id } }),
    prisma.artigo.count({ where: { autorId: id } }),
  ]);
  if (chamadosAbertos > 0 || chamadosAtendidos > 0) {
    return NextResponse.json({ erro: "Não é possível excluir: este usuário possui chamados vinculados (como autor ou consultor)" }, { status: 409 });
  }
  if (artigosAutor > 0) {
    return NextResponse.json({ erro: "Não é possível excluir: este usuário é autor de artigos da base de conhecimento" }, { status: 409 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
