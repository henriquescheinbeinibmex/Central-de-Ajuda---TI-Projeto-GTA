import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role === "COLABORADOR") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const ehGestor = session.user.role === "GESTOR";
  const setorFiltro = ehGestor ? { setorId: session.user.setorId ?? undefined } : {};

  const agora = new Date();

  const [
    totalAbertos,
    totalEmAndamento,
    totalValidados,
    pendentesValidacao,
    vencidosSemValidacao,
    porCategoria,
    porSetor,
    utilidadeArtigos,
    tempoMedioRaw,
  ] = await Promise.all([
    prisma.chamado.count({ where: { ...setorFiltro, status: "ABERTO" } }),
    prisma.chamado.count({ where: { ...setorFiltro, status: "EM_ANDAMENTO" } }),
    prisma.chamado.count({ where: { ...setorFiltro, status: "VALIDADO" } }),
    prisma.chamado.count({ where: { ...setorFiltro, status: "SOLUCAO_PROPOSTA" } }),
    prisma.chamado.count({
      where: { ...setorFiltro, status: "SOLUCAO_PROPOSTA", dataValidacao: { lte: agora } },
    }),
    prisma.chamado.groupBy({
      by: ["categoriaId"],
      where: setorFiltro,
      _count: true,
    }),
    !ehGestor
      ? prisma.chamado.groupBy({ by: ["setorId"], _count: true })
      : Promise.resolve([]),
    prisma.artigo.aggregate({ _sum: { utilidade: true }, _count: true }),
    prisma.chamado.findMany({
      where: { ...setorFiltro, status: "VALIDADO", dataSolucao: { not: null } },
      select: { criadoEm: true, dataSolucao: true },
      take: 100,
    }),
  ]);

  // Tempo médio de resolução em dias
  const tempoMedio =
    tempoMedioRaw.length > 0
      ? tempoMedioRaw.reduce((acc, c) => {
          const diff = (c.dataSolucao!.getTime() - c.criadoEm.getTime()) / (1000 * 60 * 60 * 24);
          return acc + diff;
        }, 0) / tempoMedioRaw.length
      : 0;

  // Enriquece por categoria com nome
  const categorias = await prisma.categoria.findMany({ select: { id: true, nome: true, icone: true } });
  const setores = await prisma.setor.findMany({ select: { id: true, nome: true } });

  const porCategoriaEnriquecido = porCategoria.map((p) => ({
    nome: categorias.find((c) => c.id === p.categoriaId)?.nome ?? "—",
    icone: categorias.find((c) => c.id === p.categoriaId)?.icone ?? "",
    total: p._count,
  }));

  const porSetorEnriquecido = (Array.isArray(porSetor) ? porSetor : []).map((p: { setorId: string; _count: number }) => ({
    nome: setores.find((s) => s.id === p.setorId)?.nome ?? "—",
    total: p._count,
  }));

  return NextResponse.json({
    resumo: {
      abertos: totalAbertos,
      emAndamento: totalEmAndamento,
      validados: totalValidados,
      pendentesValidacao,
      vencidosSemValidacao,
      tempoMedioDias: Math.round(tempoMedio * 10) / 10,
    },
    chamadosEvitados: utilidadeArtigos._sum.utilidade ?? 0,
    porCategoria: porCategoriaEnriquecido.sort((a, b) => b.total - a.total),
    porSetor: porSetorEnriquecido.sort((a, b) => b.total - a.total),
  });
}
