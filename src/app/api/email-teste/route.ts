import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarEmailNovoChamado, enviarEmailChamadoReaberto, enviarEmailValidacao } from "@/lib/email";

// Disponível apenas em desenvolvimento — envia os três tipos de email usando um chamado real do banco
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ erro: "Disponível apenas em desenvolvimento" }, { status: 403 });
  }

  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const tipo = req.nextUrl.searchParams.get("tipo") ?? "novo";
  const destinatarios = process.env.TI_NOTIFICATION_EMAILS ?? "(não configurado)";

  // Busca um chamado real para o link do email funcionar
  const chamado = await prisma.chamado.findFirst({
    orderBy: { criadoEm: "desc" },
    include: { setor: { select: { nome: true } } },
  });

  if (!chamado) {
    return NextResponse.json({ erro: "Nenhum chamado encontrado no banco para usar no teste" }, { status: 404 });
  }

  try {
    if (tipo === "reaberto") {
      await enviarEmailChamadoReaberto({
        chamadoId: chamado.id,
        chamadoTitulo: chamado.titulo,
        comentario: "Este é um email de teste — link leva ao chamado real.",
      });
    } else if (tipo === "validacao") {
      await enviarEmailValidacao({
        consultorNome: "Consultor de TI",
        chamadoId: chamado.id,
        chamadoTitulo: chamado.titulo,
      });
    } else {
      await enviarEmailNovoChamado({
        chamadoId: chamado.id,
        chamadoTitulo: chamado.titulo,
        setor: chamado.setor?.nome ?? "—",
        urgencia: chamado.urgencia,
      });
    }

    return NextResponse.json({
      ok: true,
      tipo,
      destinatarios,
      chamadoId: chamado.id,
      dica: "Use ?tipo=novo | ?tipo=reaberto | ?tipo=validacao",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, erro: msg, destinatarios }, { status: 500 });
  }
}
