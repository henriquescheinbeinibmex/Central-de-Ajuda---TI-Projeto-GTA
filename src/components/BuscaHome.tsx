"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BuscaHome() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/base-conhecimento?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center bg-white border-2 border-primary-200 focus-within:border-primary-500 rounded-2xl shadow-sm transition-colors overflow-hidden">
        <svg className="w-5 h-5 text-slate-400 ml-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquise na base de conhecimento… ex: impressora não imprime, VPN, senha"
          className="flex-1 px-4 py-4 text-slate-800 placeholder-slate-400 focus:outline-none text-base"
        />
        <button
          type="submit"
          className="m-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex-shrink-0"
        >
          Buscar
        </button>
      </div>
      <p className="text-xs text-slate-400 mt-2 ml-1">
        Tente resolver seu problema na base de conhecimento antes de abrir um chamado.
      </p>
    </form>
  );
}
