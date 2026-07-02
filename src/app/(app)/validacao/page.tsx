import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatarData, statusColor, statusLabel, urgenciaColor, urgenciaLabel } from "@/lib/utils";
import Link from "next/link";
import BotaoValidar from "@/components/BotaoValidar";

export default async function ValidacaoPage() {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") redirect("/");

  const agora = new Date();

  const [vencidos, proximos] = await Promise.all([
    // Prazo já venceu — aguardando validação manual
    prisma.chamado.findMany({
      where: {
        status: "SOLUCAO_PROPOSTA",
        dataValidacao: { lte: agora },
      },
      include: {
        categoria: true,
        setor: true,
        autor: { select: { nome: true } },
        consultor: { select: { nome: true } },
      },
      orderBy: { dataValidacao: "asc" },
    }),
    // Prazo nos próximos 3 dias
    prisma.chamado.findMany({
      where: {
        status: "SOLUCAO_PROPOSTA",
        dataValidacao: {
          gt: agora,
          lte: new Date(agora.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        categoria: true,
        setor: true,
        autor: { select: { nome: true } },
      },
      orderBy: { dataValidacao: "asc" },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Painel de Validação</h1>
        <p className="text-slate-500 text-sm mt-1">
          Chamados que atingiram 14 dias sem reincidência e aguardam confirmação
        </p>
      </div>

      {/* Vencidos */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          <h2 className="font-semibold text-slate-700">
            Prazo vencido — aguardando validação
            <span className="ml-2 text-sm font-normal text-red-600">({vencidos.length})</span>
          </h2>
        </div>

        {vencidos.length === 0 ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-center">
            <p className="text-green-700 font-medium">✅ Nenhum chamado com prazo vencido</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vencidos.map((c) => (
              <div key={c.id} className="bg-white border border-red-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgenciaColor[c.urgencia]}`}>
                        {urgenciaLabel[c.urgencia]}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        Prazo: {formatarData(c.dataValidacao!)} (vencido)
                      </span>
                    </div>
                    <Link href={`/chamados/${c.id}`} className="font-semibold text-slate-800 hover:text-primary-600 transition-colors">
                      {c.titulo}
                    </Link>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                      <span>{c.categoria.icone} {c.categoria.nome}</span>
                      <span>• {c.setor.nome}</span>
                      <span>• {c.autor.nome}</span>
                      {c.consultor && <span>• Consultor: {c.consultor.nome}</span>}
                    </div>
                  </div>
                  <BotaoValidar chamadoId={c.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Próximos a vencer */}
      {proximos.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
            <h2 className="font-semibold text-slate-700">
              Vencem nos próximos 3 dias
              <span className="ml-2 text-sm font-normal text-amber-600">({proximos.length})</span>
            </h2>
          </div>
          <div className="space-y-3">
            {proximos.map((c) => (
              <Link
                key={c.id}
                href={`/chamados/${c.id}`}
                className="block bg-white border border-amber-100 rounded-xl p-5 hover:border-amber-300 transition-all"
              >
                <div className="flex flex-wrap gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    Prazo: {formatarData(c.dataValidacao!)}
                  </span>
                </div>
                <p className="font-semibold text-slate-800">{c.titulo}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                  <span>{c.categoria.icone} {c.categoria.nome}</span>
                  <span>• {c.setor.nome}</span>
                  <span>• {c.autor.nome}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
