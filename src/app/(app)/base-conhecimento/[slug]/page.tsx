import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatarData } from "@/lib/utils";
import BotaoUtilidade from "@/components/BotaoUtilidade";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ArtigoPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  const artigo = await prisma.artigo.findUnique({
    where: { slug },
    include: {
      categoria: true,
      autor: { select: { nome: true } },
      chamadoOrigem: { select: { id: true, titulo: true } },
    },
  });

  if (!artigo || !artigo.publicado) notFound();

  // Incrementa visualizações apenas para usuários não-TI (evita inflar com acessos de edição)
  if (session?.user.role !== "CONSULTOR_TI") {
    prisma.artigo.update({
      where: { id: artigo.id },
      data: { visualizacoes: { increment: 1 } },
    }).catch(() => {});
  }

  // Formata markdown simples (negrito e itens de lista)
  function renderSolucao(texto: string) {
    return texto.split("\n").map((linha, i) => {
      const negrito = linha.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      const codeInline = negrito.replace(/`(.*?)`/g, "<code class=\"bg-slate-100 px-1 rounded text-sm font-mono\">$1</code>");

      if (linha.match(/^\d+\./)) {
        return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: codeInline.replace(/^\d+\.\s*/, "") }} />;
      }
      if (linha.startsWith("   - ") || linha.startsWith("- ")) {
        return <li key={i} className="ml-6 list-disc text-sm" dangerouslySetInnerHTML={{ __html: codeInline.replace(/^[\s-]+/, "") }} />;
      }
      if (linha.startsWith("**") && linha.endsWith("**")) {
        return <p key={i} className="font-semibold text-slate-800 mt-4" dangerouslySetInnerHTML={{ __html: codeInline }} />;
      }
      if (linha.trim() === "") return <div key={i} className="h-2" />;
      return <p key={i} className="text-slate-700" dangerouslySetInnerHTML={{ __html: codeInline }} />;
    });
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/base-conhecimento" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar à base de conhecimento
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-8">
        {/* Cabeçalho */}
        <div className="mb-6">
          <span className="inline-block text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium mb-3">
            {artigo.categoria.icone} {artigo.categoria.nome}
          </span>
          <h1 className="text-2xl font-bold text-slate-800">{artigo.titulo}</h1>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 flex-wrap">
            <span>Por {artigo.autor.nome}</span>
            <span>Criado em {formatarData(artigo.criadoEm)}</span>
            <span>Atualizado em {formatarData(artigo.atualizadoEm)}</span>
            <span>{artigo.visualizacoes} visualizações</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {artigo.tags.map((tag: string) => (
              <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>

        <hr className="border-slate-100 mb-6" />

        {/* Problema */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Descrição do problema</h2>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-slate-700 text-sm">
            {artigo.descricaoProb}
          </div>
        </div>

        {/* Solução */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Solução passo a passo</h2>
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-1 text-sm leading-relaxed">
            {renderSolucao(artigo.solucao)}
          </div>
        </div>

        <hr className="border-slate-100 mb-6" />

        {/* Feedback de utilidade */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <BotaoUtilidade artigoId={artigo.id} utilidade={artigo.utilidade} />
          <Link
            href={`/chamados/novo?artigo=${artigo.slug}`}
            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Não resolveu — abrir chamado
          </Link>
        </div>

        {/* Link para chamado de origem (só TI) */}
        {session?.user.role === "CONSULTOR_TI" && artigo.chamadoOrigem && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Gerado a partir do chamado:{" "}
              <Link href={`/chamados/${artigo.chamadoOrigem.id}`} className="text-primary-600 hover:underline">
                {artigo.chamadoOrigem.titulo}
              </Link>
            </p>
          </div>
        )}

        {/* Editar (só TI) */}
        {session?.user.role === "CONSULTOR_TI" && (
          <div className="mt-4 flex justify-end">
            <Link
              href={`/base-conhecimento/novo?editar=${artigo.id}`}
              className="text-sm text-primary-600 hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar artigo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
