"use client";

import { useState, useEffect } from "react";

interface Props {
  artigoId: string;
  utilidade: number;
}

export default function BotaoUtilidade({ artigoId, utilidade }: Props) {
  const [marcado, setMarcado] = useState(false);
  const [contador, setContador] = useState(utilidade);

  // Restore vote state from localStorage (persists across page refreshes)
  useEffect(() => {
    if (localStorage.getItem(`util-${artigoId}`) === "1") {
      setMarcado(true);
    }
  }, [artigoId]);

  async function marcar() {
    if (marcado) return;
    setMarcado(true);
    setContador((n) => n + 1);
    localStorage.setItem(`util-${artigoId}`, "1");
    await fetch(`/api/artigos/${artigoId}/utilidade`, { method: "POST" });
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div>
        <p className="font-medium text-slate-700 text-sm">Este artigo resolveu seu problema?</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {contador} pessoa{contador !== 1 ? "s" : ""} marcou como útil
        </p>
      </div>
      <button
        onClick={marcar}
        disabled={marcado}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          marcado
            ? "bg-green-100 text-green-700 cursor-default"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        <svg className="w-4 h-4" fill={marcado ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.020-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 1.957L7 20m7-10h-2M7 20H4a1 1 0 01-1-1v-2a1 1 0 011-1h2.5" />
        </svg>
        {marcado ? "Marcado como útil!" : "Sim, resolveu!"}
      </button>
    </div>
  );
}
