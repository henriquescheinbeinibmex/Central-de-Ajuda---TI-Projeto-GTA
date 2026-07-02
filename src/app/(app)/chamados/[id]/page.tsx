import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatarDataHora, formatarData, statusLabel, statusColor, urgenciaLabel, urgenciaColor } from "@/lib/utils";
import AcoesChamado from "@/components/AcoesChamado";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalheChamadoPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const chamado = await prisma.chamado.findUnique({
    where: { id },
    include: {
      categoria: true,
      setor: true,
      autor: { select: { id: true, nome: true, email: true } },
      consultor: { select: { id: true, nome: true } },
      historico: { orderBy: { criadoEm: "asc" } },
      artigo: { select: { slug: true, titulo: true } },
    },
  });

  if (!chamado) notFound();

  const ehTI = session?.user.role === "CONSULTOR_TI";
  const ehAutor = session?.user.id === chamado.autorId;
  const ehGestor = session?.user.role === "GESTOR";

  if (!ehTI && !ehAutor && !ehGestor) notFound();

  const consultores = ehTI
    ? await prisma.user.findMany({
        where: { role: "CONSULTOR_TI" },
        select: { id: true, nome: true },
      })
    : [];

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/chamados" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar aos chamados
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-4">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[chamado.status]}`}>
                {statusLabel[chamado.status]}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${urgenciaColor[chamado.urgencia]}`}>
                Urgência {urgenciaLabel[chamado.urgencia]}
              </span>
              {chamado.registradoAposLig && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                  📞 Registrado após ligação
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-800">{chamado.titulo}</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-5">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Categoria</p>
            <p className="text-slate-700">{chamado.categoria.icone} {chamado.categoria.nome}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Setor</p>
            <p className="text-slate-700">{chamado.setor.nome}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">
              {chamado.solicitanteNome ? "Relatado por" : "Aberto por"}
            </p>
            <p className="text-slate-700">{chamado.solicitanteNome ?? chamado.autor.nome}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Consultor</p>
            <p className="text-slate-700">{chamado.consultor?.nome ?? "Não atribuído"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Aberto em</p>
            <p className="text-slate-700">{formatarDataHora(chamado.criadoEm)}</p>
          </div>
          {chamado.dataValidacao && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Prazo de validação</p>
              <p className={`font-medium ${new Date(chamado.dataValidacao) < new Date() && chamado.status === "SOLUCAO_PROPOSTA" ? "text-red-600" : "text-slate-700"}`}>
                {formatarData(chamado.dataValidacao)}
              </p>
            </div>
          )}
        </div>

        <div className="mb-5">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Descrição</p>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">{chamado.descricao}</div>
        </div>

        {chamado.solucaoProposta && (
          <div className="mb-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Solução proposta</p>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap">{chamado.solucaoProposta}</div>
            {chamado.dataSolucao && (
              <p className="text-xs text-slate-400 mt-1.5">Aplicada em {formatarDataHora(chamado.dataSolucao)}</p>
            )}
          </div>
        )}

        {/* Feedback do colaborador */}
        {chamado.feedbackColaborador && (
          <div className="mb-5">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1.5">Feedback do colaborador</p>
            <div className={`rounded-xl p-4 text-sm ${chamado.feedbackColaborador === "resolveu" ? "bg-green-50 border border-green-100 text-green-800" : "bg-red-50 border border-red-100 text-red-800"}`}>
              <p className="font-medium">{chamado.feedbackColaborador === "resolveu" ? "✅ Resolveu o problema" : "❌ Não resolveu o problema"}</p>
              {chamado.feedbackComentario && <p className="mt-1 text-slate-600">{chamado.feedbackComentario}</p>}
            </div>
          </div>
        )}

        {/* Artigo gerado */}
        {chamado.artigo && (
          <div className="mb-5 bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm">
            <p className="text-primary-700 font-medium">📚 Artigo gerado a partir deste chamado:</p>
            <Link href={`/base-conhecimento/${chamado.artigo.slug}`} className="text-primary-600 hover:underline">
              {chamado.artigo.titulo}
            </Link>
          </div>
        )}

        {/* Ações */}
        <AcoesChamado
          chamado={{
            id: chamado.id,
            status: chamado.status,
            autorId: chamado.autorId,
            consultorId: chamado.consultorId,
            feedbackColaborador: chamado.feedbackColaborador,
            feedbackComentario: chamado.feedbackComentario,
            solucaoProposta: chamado.solucaoProposta,
            artigo: chamado.artigo,
          }}
          sessaoId={session!.user.id}
          sessaoRole={session!.user.role}
          consultores={consultores}
        />
      </div>

      {/* Histórico de status */}
      {chamado.historico.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-700 mb-4">Histórico</h2>
          <div className="space-y-3">
            {chamado.historico.map((h, i) => (
              <div key={h.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 bg-primary-500 rounded-full mt-1 flex-shrink-0" />
                  {i < chamado.historico.length - 1 && <div className="w-0.5 bg-slate-200 flex-1 mt-1" style={{ minHeight: 20 }} />}
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[h.status]}`}>
                    {statusLabel[h.status]}
                  </span>
                  {h.observacao && <p className="text-sm text-slate-600 mt-0.5">{h.observacao}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{formatarDataHora(h.criadoEm)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
