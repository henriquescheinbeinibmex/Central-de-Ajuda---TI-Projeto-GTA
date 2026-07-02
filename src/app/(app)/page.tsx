import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BuscaHome from "@/components/BuscaHome";
import { formatarDataHora } from "@/lib/utils";

const ICONE_STATUS: Record<string, string> = {
  ABERTO: "📋",
  EM_ANDAMENTO: "👨‍💻",
  SOLUCAO_PROPOSTA: "✅",
  REABERTO: "🔄",
  VALIDADO: "🎉",
};
const COR_STATUS: Record<string, string> = {
  ABERTO: "border-yellow-200 bg-yellow-50 text-yellow-800",
  EM_ANDAMENTO: "border-primary-200 bg-primary-50 text-primary-800",
  SOLUCAO_PROPOSTA: "border-green-200 bg-green-50 text-green-800",
  REABERTO: "border-red-200 bg-red-50 text-red-800",
  VALIDADO: "border-teal-200 bg-teal-50 text-teal-800",
};
const LABEL_STATUS: Record<string, string> = {
  ABERTO: "Novo chamado aberto",
  EM_ANDAMENTO: "Chamado assumido pelo TI",
  SOLUCAO_PROPOSTA: "Solução proposta",
  REABERTO: "Chamado reaberto",
  VALIDADO: "Chamado validado",
};

export default async function HomePage() {
  const session = await auth();
  const ehTI = session?.user.role === "CONSULTOR_TI";

  const [totalChamados, totalArtigos, chamadosPendentes] = await Promise.all([
    session?.user.role !== "COLABORADOR"
      ? prisma.chamado.count({
          where:
            session?.user.role === "GESTOR"
              ? { setor: { id: session?.user.setorId ?? undefined } }
              : {},
        })
      : Promise.resolve(0),
    prisma.artigo.count({ where: { publicado: true } }),
    ehTI
      ? prisma.chamado.count({
          where: {
            status: "SOLUCAO_PROPOSTA",
            dataValidacao: { lte: new Date() },
          },
        })
      : Promise.resolve(0),
  ]);

  // Notificações de movimentação para o TI (últimos 7 dias)
  const movimentacoes = ehTI
    ? await prisma.historicoStatus.findMany({
        where: { criadoEm: { gte: new Date(Date.now() - 7 * 86400000) } },
        orderBy: { criadoEm: "desc" },
        take: 12,
        include: { chamado: { select: { id: true, titulo: true } } },
      })
    : [];

  const artigosRecentes = await prisma.artigo.findMany({
    where: { publicado: true },
    orderBy: { visualizacoes: "desc" },
    take: 4,
    include: { categoria: true },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Central de Ajuda de TI</h1>
        <p className="text-slate-500 mt-1">Busque na base de conhecimento ou abra um chamado</p>
      </div>

      {/* Busca em destaque */}
      <BuscaHome />

      {/* Cards de ação rápida */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-3xl font-bold text-primary-600">{totalArtigos}</p>
          <p className="text-slate-600 text-sm mt-1">Artigos na base de conhecimento</p>
          <Link href="/base-conhecimento" className="text-primary-600 text-sm hover:underline mt-2 inline-block">
            Ver todos →
          </Link>
        </div>
        {session?.user.role !== "COLABORADOR" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-3xl font-bold text-slate-700">{totalChamados}</p>
            <p className="text-slate-600 text-sm mt-1">Chamados no sistema</p>
            <Link href="/chamados" className="text-primary-600 text-sm hover:underline mt-2 inline-block">
              Ver chamados →
            </Link>
          </div>
        )}
        {session?.user.role === "CONSULTOR_TI" && (
          <div className={`rounded-xl border p-5 ${chamadosPendentes > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
            <p className={`text-3xl font-bold ${chamadosPendentes > 0 ? "text-amber-600" : "text-slate-700"}`}>
              {chamadosPendentes}
            </p>
            <p className="text-slate-600 text-sm mt-1">Pendentes de validação</p>
            <Link href="/validacao" className="text-primary-600 text-sm hover:underline mt-2 inline-block">
              Ver painel →
            </Link>
          </div>
        )}
        {session?.user.role !== "CONSULTOR_TI" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between">
            <p className="text-slate-600 text-sm font-medium">Precisa de ajuda?</p>
            <Link
              href="/chamados/novo"
              className="mt-3 inline-flex items-center justify-center gap-2 bg-primary-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Abrir chamado
            </Link>
          </div>
        )}
      </div>

      {/* Painel de movimentações recentes — apenas TI */}
      {ehTI && movimentacoes.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Movimentações recentes (últimos 7 dias)</h2>
          <div className="space-y-2">
            {movimentacoes.map((m) => (
              <Link
                key={m.id}
                href={`/chamados/${m.chamadoId}`}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-all hover:shadow-sm ${COR_STATUS[m.status] ?? "border-slate-200 bg-white text-slate-700"}`}
              >
                <span className="text-lg leading-none mt-0.5">{ICONE_STATUS[m.status] ?? "•"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{LABEL_STATUS[m.status] ?? m.status} — {m.chamado.titulo}</p>
                  {m.observacao && (
                    <p className="text-xs opacity-75 mt-0.5 line-clamp-1">{m.observacao}</p>
                  )}
                </div>
                <span className="text-xs opacity-60 whitespace-nowrap mt-0.5">{formatarDataHora(m.criadoEm)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Artigos mais acessados */}
      {artigosRecentes.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700">Artigos mais acessados</h2>
            <Link href="/base-conhecimento" className="text-primary-600 text-sm hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {artigosRecentes.map((artigo) => (
              <Link
                key={artigo.id}
                href={`/base-conhecimento/${artigo.slug}`}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-sm transition-all group"
              >
                <span className="inline-block text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full mb-2">
                  {artigo.categoria.nome}
                </span>
                <p className="font-medium text-slate-800 group-hover:text-primary-600 transition-colors text-sm line-clamp-2">
                  {artigo.titulo}
                </p>
                <p className="text-xs text-slate-400 mt-2">{artigo.visualizacoes} visualizações</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
