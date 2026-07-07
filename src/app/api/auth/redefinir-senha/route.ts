import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// Redefine a senha usando um token válido enviado por email.
export async function POST(req: NextRequest) {
  const { token, novaSenha } = await req.json();

  if (!token || !novaSenha) {
    return NextResponse.json({ erro: "Token e nova senha são obrigatórios" }, { status: 400 });
  }

  if (!/^\d{4}$/.test(novaSenha)) {
    return NextResponse.json({ erro: "A senha deve ter exatamente 4 dígitos numéricos" }, { status: 400 });
  }

  const registro = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!registro || registro.usadoEm || registro.expiraEm < new Date()) {
    return NextResponse.json({ erro: "Link inválido ou expirado. Solicite um novo." }, { status: 400 });
  }

  const senhaHash = await hash(novaSenha, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: registro.userId }, data: { senha: senhaHash } }),
    prisma.passwordResetToken.update({ where: { id: registro.id }, data: { usadoEm: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
