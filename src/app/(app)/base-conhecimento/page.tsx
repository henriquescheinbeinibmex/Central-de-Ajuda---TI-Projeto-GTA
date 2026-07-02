import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarData } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}

export default async function BaseConhecimentoPage({ searchParams }: Props) {
  const { q, categoria } = await searchParams;

  const categorias = await prisma.categoria.findMany({ orderBy: { nome: "asc" } });

  const artigos = await prisma.artigo.findMany({
    where: {
      publicado: true,
      ...(categoria ? { categoriaId: categoria } : {}),
      ...(q
        ? {
            OR: [
              { titulo: { contains: q, mode: "insensitive" } },
              { descricaoProb: { contains: q, mode: "insensitive" } },
              { tags: { has: q.toLowerCase() } },
            ],
          }
        : {}),
    },
    include: { categoria: true, autor: { select: { nome: true } } },
    orderBy: { visualizacoes: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Base de Conhecimento</h1>
          <p className="text-slate-500 text-sm mt-1">
            {artigos.length} artigo{artigos.length !== 1 ? "s" : ""} encontrado{artigos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Busca e filtros */}
      <form className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar artigos…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800"
          />
        </div>
        <select
          name="categoria"
          defaultValue={categoria ?? ""}
          className="px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-700 bg-white"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Filtrar
        </button>
        {(q || categoria) && (
          <Link
            href="/base-conhecimento"
            className="px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Limpar
          </Link>
        )}
      </form>

      {/* Lista de artigos */}
      {artigos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-500 font-medium">Nenhum artigo encontrado</p>
          {q && <p className="text-slate-400 text-sm mt-1">Tente outros termos ou abra um chamado</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {artigos.map((artigo) => (
            <Link
              key={artigo.id}
              href={`/base-conhecimento/${artigo.slug}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                      {artigo.categoria.icone} {artigo.categoria.nome}
                    </span>
                    {artigo.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">
                    {artigo.titulo}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{artigo.descricaoProb}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span>Por {artigo.autor.nome}</span>
                    <span>Atualizado em {formatarData(artigo.atualizadoEm)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {artigo.visualizacoes}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 1.957L7 20m7-10h-2M7 20H4a1 1 0 01-1-1v-2a1 1 0 011-1h2.5" />
                    </svg>
                    {artigo.utilidade} útil
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
