import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatarData, urgenciaColor, urgenciaLabel } from "@/lib/utils";
import Link from "next/link";

export default async function ValidacaoPage() {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") redirect("/");

  const validados = await prisma.chamado.findMany({
    where: { status: "VALIDADO" },
    include: {
      categoria: true,
      setor: true,
      autor: { select: { nome: true } },
      consultor: { select: { nome: true } },
    },
    orderBy: { dataValidacao: "desc" },
  });

  const confirmados = validados.filter((c) => c.feedbackColaborador === "resolveu");
  const semConfirmacao = validados.filter((c) => c.feedbackColaborador !== "resolveu");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Painel de Validação</h1>
        <p className="text-slate-500 text-sm mt-1">
          Chamados encerrados — candidatos a artigos na base de conhecimento
        </p>
      </div>

      {/* Prontos para virar artigo */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <h2 className="font-semibold text-slate-800 text-lg">
            Prontos para virar artigo
            <span className="ml-2 text-sm font-normal text-green-600">({confirmados.length})</span>
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4 ml-5">
          O colaborador confirmou que o problema foi resolvido — alta confiança na solução.
        </p>

        {confirmados.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm">Nenhum chamado confirmado pelo colaborador ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {confirmados.map((c) => (
              <Link
                key={c.id}
                href={`/chamados/${c.id}`}
                className="block bg-white border border-green-100 rounded-xl p-5 hover:border-green-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgenciaColor[c.urgencia]}`}>
                        {urgenciaLabel[c.urgencia]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        ✅ Confirmado em {formatarData(c.dataValidacao!)}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{c.titulo}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                      <span>{c.categoria.icone} {c.categoria.nome}</span>
                      <span>• {c.setor.nome}</span>
                      <span>• {c.autor.nome}</span>
                      {c.consultor && <span>• Atendido por {c.consultor.nome}</span>}
                    </div>
                    {c.feedbackComentario && (
                      <p className="mt-2 text-xs text-slate-500 italic">"{c.feedbackComentario}"</p>
                    )}
                  </div>
                  <span className="text-xs text-primary-600 font-medium whitespace-nowrap">Ver chamado →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Encerrados sem confirmação */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 bg-slate-400 rounded-full" />
          <h2 className="font-semibold text-slate-800 text-lg">
            Encerrados sem confirmação
            <span className="ml-2 text-sm font-normal text-slate-500">({semConfirmacao.length})</span>
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-4 ml-5">
          Encerrados automaticamente após 14 dias sem retorno. Verifique com o colaborador antes de criar um artigo.
        </p>

        {semConfirmacao.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm">Nenhum chamado encerrado sem confirmação</p>
          </div>
        ) : (
          <div className="space-y-3">
            {semConfirmacao.map((c) => (
              <Link
                key={c.id}
                href={`/chamados/${c.id}`}
                className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgenciaColor[c.urgencia]}`}>
                        {urgenciaLabel[c.urgencia]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                        Encerrado em {formatarData(c.dataValidacao!)}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{c.titulo}</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                      <span>{c.categoria.icone} {c.categoria.nome}</span>
                      <span>• {c.setor.nome}</span>
                      <span>• {c.autor.nome}</span>
                      {c.consultor && <span>• Atendido por {c.consultor.nome}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-primary-600 font-medium whitespace-nowrap">Ver chamado →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
