import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const session = await auth();
  if (session?.user.role === "COLABORADOR") redirect("/");

  const ehGestor = session?.user.role === "GESTOR";
  const setorFiltro = ehGestor ? { setorId: session?.user.setorId ?? undefined } : {};
  const agora = new Date();

  const [
    pendentesAtendimento, emAberto, validados, reabertos,
    porCategoria, porSetor, utilidade, tempoMedioRaw,
  ] = await Promise.all([
    prisma.chamado.count({ where: { ...setorFiltro, status: "ABERTO" } }),
    prisma.chamado.count({ where: { ...setorFiltro, status: "SOLUCAO_PROPOSTA" } }),
    prisma.chamado.count({ where: { ...setorFiltro, status: "VALIDADO" } }),
    prisma.chamado.count({ where: { ...setorFiltro, status: "REABERTO" } }),
    prisma.chamado.groupBy({ by: ["categoriaId"], where: setorFiltro, _count: true }),
    !ehGestor ? prisma.chamado.groupBy({ by: ["setorId"], _count: true }) : Promise.resolve([]),
    prisma.artigo.aggregate({ _sum: { utilidade: true } }),
    prisma.chamado.findMany({
      where: { ...setorFiltro, status: "VALIDADO", dataSolucao: { not: null } },
      select: { criadoEm: true, dataSolucao: true },
      take: 100,
    }),
  ]);

  const tempoMedio = tempoMedioRaw.length > 0
    ? tempoMedioRaw.reduce((acc, c) => acc + (c.dataSolucao!.getTime() - c.criadoEm.getTime()) / 86400000, 0) / tempoMedioRaw.length
    : 0;

  const categorias = await prisma.categoria.findMany({ select: { id: true, nome: true, icone: true } });
  const setores = await prisma.setor.findMany({ select: { id: true, nome: true } });

  const catData = porCategoria
    .map((p) => ({ nome: categorias.find((c) => c.id === p.categoriaId)?.nome ?? "—", icone: categorias.find((c) => c.id === p.categoriaId)?.icone ?? "", total: p._count }))
    .sort((a, b) => b.total - a.total);

  const setorData = (Array.isArray(porSetor) ? porSetor : [])
    .map((p: { setorId: string; _count: number }) => ({ nome: setores.find((s) => s.id === p.setorId)?.nome ?? "—", total: p._count }))
    .sort((a, b) => b.total - a.total);

  const cartoes = [
    { label: "Chamados pendentes de atendimento", valor: pendentesAtendimento, cor: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
    { label: "Em aberto", valor: emAberto, cor: "text-primary-600", bg: "bg-primary-50 border-primary-200" },
    { label: "Resolvido / Validado", valor: validados, cor: "text-green-600", bg: "bg-green-50 border-green-200" },
    { label: "Reaberto", valor: reabertos, cor: "text-red-600", bg: "bg-red-50 border-red-200" },
    { label: "Chamados evitados (KB)", valor: utilidade._sum.utilidade ?? 0, cor: "text-teal-600", bg: "bg-teal-50 border-teal-200" },
  ];

  const maxCat = catData[0]?.total ?? 1;
  const maxSet = setorData[0]?.total ?? 1;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          {ehGestor
            ? session?.user.setorNome
              ? `Métricas do setor ${session.user.setorNome}`
              : "Visão geral de todos os setores"
            : "Visão geral do sistema de chamados"}
          {tempoMedio > 0 && (
            <span className="ml-3 text-primary-600 font-medium">
              • Tempo médio de resolução: {Math.round(tempoMedio * 10) / 10} dias
            </span>
          )}
        </p>
      </div>

      {/* Cartões de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {cartoes.map((c) => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.bg}`}>
            <p className={`text-3xl font-bold ${c.cor}`}>{c.valor}</p>
            <p className="text-slate-600 text-sm mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className={`grid gap-6 ${!ehGestor ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Por categoria */}
        {catData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-semibold text-slate-700 mb-4">Chamados por categoria</h2>
            <div className="space-y-3">
              {catData.map((c) => (
                <div key={c.nome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{c.icone} {c.nome}</span>
                    <span className="font-medium text-slate-800">{c.total}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${(c.total / maxCat) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Por setor (só TI) */}
        {!ehGestor && setorData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-semibold text-slate-700 mb-4">Chamados por setor</h2>
            <div className="space-y-3">
              {setorData.map((s) => (
                <div key={s.nome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{s.nome}</span>
                    <span className="font-medium text-slate-800">{s.total}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(s.total / maxSet) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
