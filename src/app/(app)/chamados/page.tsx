import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatarDataHora, statusLabel, statusColor, urgenciaLabel, urgenciaColor } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ status?: string; categoria?: string }>;
}

export default async function ChamadosPage({ searchParams }: Props) {
  const session = await auth();
  const { status, categoria } = await searchParams;

  const ehTI = session?.user.role === "CONSULTOR_TI";

  // Colaboradores e gestores veem todos os chamados do seu setor
  const where: Record<string, unknown> = {
    ...(status ? { status } : {}),
    ...(categoria ? { categoriaId: categoria } : {}),
    ...(!ehTI ? { setorId: session?.user.setorId ?? undefined } : {}),
  };

  const [chamados, categorias] = await Promise.all([
    prisma.chamado.findMany({
      where,
      include: {
        categoria: true,
        autor: { select: { nome: true } },
        setor: { select: { nome: true } },
        consultor: { select: { nome: true } },
      },
      orderBy: [{ urgencia: "desc" }, { criadoEm: "desc" }],
    }),
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {ehTI ? "Todos os chamados" : "Chamados do meu setor"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{chamados.length} chamado{chamados.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/chamados/novo"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo chamado
        </Link>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap gap-3 mb-6">
        <select name="status" defaultValue={status ?? ""} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todos os status</option>
          {Object.entries(statusLabel)
            .filter(([val]) => val !== "EM_ANDAMENTO")
            .map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
        </select>
        <select name="categoria" defaultValue={categoria ?? ""} className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.nome}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
          Filtrar
        </button>
        {(status || categoria) && (
          <Link href="/chamados" className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
            Limpar
          </Link>
        )}
      </form>

      {chamados.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-500 font-medium">Nenhum chamado encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chamados.map((chamado) => (
            <Link
              key={chamado.id}
              href={`/chamados/${chamado.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[chamado.status]}`}>
                      {statusLabel[chamado.status]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${urgenciaColor[chamado.urgencia]}`}>
                      {urgenciaLabel[chamado.urgencia]}
                    </span>
                    {chamado.registradoAposLig && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                        📞 Registrado após ligação
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-slate-800">{chamado.titulo}</h2>
                  <p className="text-slate-500 text-sm mt-0.5 line-clamp-1">{chamado.descricao}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 flex-wrap">
                    <span>{chamado.categoria.icone} {chamado.categoria.nome}</span>
                    <span>• {chamado.setor.nome}</span>
                    <span>• {chamado.solicitanteNome ?? chamado.autor.nome}</span>
                    {chamado.consultor && <span>• Atendido por {chamado.consultor.nome}</span>}
                    <span>• {formatarDataHora(chamado.criadoEm)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
