import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const usuarios = await prisma.user.findMany({
    select: { id: true, nome: true, username: true, email: true, role: true, setor: { select: { nome: true } }, criadoEm: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { nome, email: emailRaw, senha, role, setorId } = await req.json();
  if (!nome || !emailRaw || !senha) return NextResponse.json({ erro: "Campos obrigatórios ausentes" }, { status: 400 });

  const email = emailRaw.trim().toLowerCase();
  // O login é feito pelo email; mantemos username = email para compatibilidade.
  const username = email;

  if (!/^\d{4}$/.test(senha)) {
    return NextResponse.json({ erro: "A senha deve ter exatamente 4 dígitos numéricos" }, { status: 400 });
  }

  const existe = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existe) return NextResponse.json({ erro: "Email já cadastrado" }, { status: 409 });

  const senhaHash = await hash(senha, 12);
  try {
    const usuario = await prisma.user.create({
      data: { nome, username, email, senha: senhaHash, role: role ?? "COLABORADOR", setorId: setorId ?? null },
      select: { id: true, nome: true, username: true, email: true, role: true },
    });
    return NextResponse.json(usuario, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Não foi possível criar o usuário. Verifique o setor informado." }, { status: 400 });
  }
}
