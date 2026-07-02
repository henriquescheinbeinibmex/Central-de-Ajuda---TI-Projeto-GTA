"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  chamado: {
    id: string;
    status: string;
    autorId: string;
    consultorId: string | null;
    feedbackColaborador: string | null;
    feedbackComentario: string | null;
    solucaoProposta: string | null;
    artigo: { slug: string; titulo: string } | null;
  };
  sessaoId: string;
  sessaoRole: string;
  consultores: { id: string; nome: string }[];
}

export default function AcoesChamado({ chamado, sessaoId, sessaoRole, consultores }: Props) {
  const router = useRouter();
  const ehTI = sessaoRole === "CONSULTOR_TI";
  const ehAutor = sessaoId === chamado.autorId;

  const [solucao, setSolucao] = useState(chamado.solucaoProposta ?? "");
  const [feedbackComentario, setFeedbackComentario] = useState("");
  const [mostrarFeedback, setMostrarFeedback] = useState(false);
  const [mostrarSolucao, setMostrarSolucao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function post(url: string, body: Record<string, unknown>) {
    setSalvando(true);
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSalvando(false);
    router.refresh();
  }

  return (
    <div className="border-t border-slate-100 pt-5 space-y-3">
      {/* TI: assumir chamado */}
      {ehTI && chamado.status === "ABERTO" && (
        <button
          onClick={() => post(`/api/chamados/${chamado.id}/status`, { status: "EM_ANDAMENTO", consultorId: sessaoId })}
          disabled={salvando}
          className="w-full sm:w-auto px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          Assumir chamado
        </button>
      )}

      {/* TI: propor solução */}
      {ehTI && (chamado.status === "EM_ANDAMENTO" || chamado.status === "REABERTO") && (
        <div>
          {!mostrarSolucao ? (
            <button
              onClick={() => setMostrarSolucao(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Registrar solução
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={solucao}
                onChange={(e) => setSolucao(e.target.value)}
                rows={4}
                placeholder="Descreva a solução aplicada…"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-y text-slate-800"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => post(`/api/chamados/${chamado.id}/solucao`, { solucao })}
                  disabled={salvando || !solucao.trim()}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  {salvando ? "Salvando…" : "Confirmar solução"}
                </button>
                <button onClick={() => setMostrarSolucao(false)} className="px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TI: reabrir manualmente (ex.: TI percebe que a solução estava incompleta) */}
      {ehTI && chamado.status === "SOLUCAO_PROPOSTA" && (
        <button
          onClick={() => post(`/api/chamados/${chamado.id}/status`, { status: "REABERTO" })}
          disabled={salvando}
          className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
        >
          Reabrir chamado
        </button>
      )}

      {/* TI: converter em artigo */}
      {ehTI && chamado.status === "VALIDADO" && !chamado.artigo && (
        <button
          onClick={() => router.push(`/base-conhecimento/novo?chamado=${chamado.id}`)}
          className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          📚 Converter em artigo da base
        </button>
      )}

      {/* Colaborador: feedback */}
      {ehAutor && chamado.status === "SOLUCAO_PROPOSTA" && !chamado.feedbackColaborador && (
        <div>
          {!mostrarFeedback ? (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => post(`/api/chamados/${chamado.id}/feedback`, { feedback: "resolveu", comentario: "" })}
                disabled={salvando}
                className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                ✅ Resolveu meu problema
              </button>
              <button
                onClick={() => setMostrarFeedback(true)}
                className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                ❌ Não resolveu
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">Explique o que ainda está acontecendo:</p>
              <textarea
                value={feedbackComentario}
                onChange={(e) => setFeedbackComentario(e.target.value)}
                rows={3}
                placeholder="O problema continua porque…"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm resize-y text-slate-800"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => post(`/api/chamados/${chamado.id}/feedback`, { feedback: "nao_resolveu", comentario: feedbackComentario })}
                  disabled={salvando}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  Enviar feedback
                </button>
                <button onClick={() => setMostrarFeedback(false)} className="px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
