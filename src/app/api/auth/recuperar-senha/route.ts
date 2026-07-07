import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmailRecuperacaoSenha } from "@/lib/email";
import { randomBytes } from "crypto";

// Solicita recuperação de senha: gera token e envia email com link.
export async function POST(req: NextRequest) {
  const { email: emailRaw } = await req.json();
  if (!emailRaw) return NextResponse.json({ erro: "Informe o email" }, { status: 400 });

  const email = (emailRaw as string).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Resposta sempre igual, mesmo que o email não exista — evita revelar
  // quais emails estão cadastrados (segurança).
  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Invalida tokens anteriores ainda válidos deste usuário
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usadoEm: null },
      data: { usadoEm: new Date() },
    });

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiraEm },
    });

    try {
      await enviarEmailRecuperacaoSenha({ email: user.email, nome: user.nome, token });
    } catch (err) {
      console.error("[email:recuperacao]", err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({
    ok: true,
    mensagem: "Se o email estiver cadastrado, você receberá um link de recuperação.",
  });
}
