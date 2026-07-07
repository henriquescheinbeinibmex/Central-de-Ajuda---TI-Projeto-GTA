import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmailValidacao, enviarEmailSlaAprovacaoVencido } from "@/lib/email";

// Executada diariamente pelo Vercel Cron (vercel.json)
// Protegida por CRON_SECRET para evitar chamadas externas
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();

  // Busca chamados cujo prazo de validação venceu hoje
  const inicio = new Date(agora);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);

  const chamados = await prisma.chamado.findMany({
    where: {
      status: "SOLUCAO_PROPOSTA",
      dataValidacao: { gte: inicio, lte: fim },
    },
    include: {
      consultor: { select: { email: true, nome: true } },
    },
  });

  const resultados = await Promise.allSettled(
    chamados.map((c) =>
      enviarEmailValidacao({
        consultorEmail: c.consultor?.email ?? undefined,
        consultorNome: c.consultor?.nome ?? "TI",
        chamadoId: c.id,
        chamadoTitulo: c.titulo,
      })
    )
  );

  const enviados = resultados.filter((r) => r.status === "fulfilled").length;
  const erros = resultados.filter((r) => r.status === "rejected").length;

  // SLA de aprovação do gestor: notifica o TI sobre chamados cujo prazo de
  // aprovação já venceu e ainda não foram aprovados/reprovados nem notificados.
  const aprovacoesVencidas = await prisma.chamado.findMany({
    where: {
      status: "AGUARDANDO_APROVACAO",
      prazoAprovacao: { lt: agora },
      slaAprovacaoNotificado: false,
    },
    include: { setor: { select: { nome: true } } },
  });

  const resultadosSla = await Promise.allSettled(
    aprovacoesVencidas.map((c) =>
      enviarEmailSlaAprovacaoVencido({
        chamadoId: c.id,
        chamadoTitulo: c.titulo,
        setor: c.setor?.nome ?? "—",
      })
    )
  );

  // Marca como notificado para não reenviar todo dia
  await prisma.chamado.updateMany({
    where: { id: { in: aprovacoesVencidas.map((c) => c.id) } },
    data: { slaAprovacaoNotificado: true },
  });

  const slaEnviados = resultadosSla.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({
    validacao: { enviados, erros, total: chamados.length },
    slaAprovacao: { enviados: slaEnviados, total: aprovacoesVencidas.length },
  });
}
