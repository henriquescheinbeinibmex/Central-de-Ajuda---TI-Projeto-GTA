"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Categoria { id: string; nome: string; icone: string | null }
interface Setor { id: string; nome: string }

interface Props {
  categorias: Categoria[];
  setores: Setor[];
  autorId: string;
  consultorId: string;
}

export default function FormLigacao({ categorias, setores, autorId, consultorId }: Props) {
  const router = useRouter();

  const [solicitanteNome, setSolicitanteNome] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [setorId, setSetorId] = useState("");
  const [urgencia, setUrgencia] = useState("ALTA");
  const [jaResolvido, setJaResolvido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!autorId) {
      setErro("Nenhum usuário colaborador encontrado no sistema. Verifique o painel de usuários.");
      return;
    }

    setEnviando(true);

    const res = await fetch("/api/chamados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descricao,
        categoriaId,
        setorId,
        urgencia,
        canal: "LIGACAO_URGENTE",
        registradoAposLig: true,
        autorId,
        solicitanteNome,
        consultorId,
        status: jaResolvido ? "SOLUCAO_PROPOSTA" : "EM_ANDAMENTO",
        jaResolvido,
      }),
    });

    setEnviando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.erro ?? "Erro ao registrar ocorrência.");
      return;
    }

    const data = await res.json();
    router.push(`/chamados/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-800">
        📞 Este chamado será marcado como "registrado após atendimento por telefone".
      </div>

      {/* Checkbox: problema já resolvido na ligação */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={jaResolvido}
          onChange={(e) => setJaResolvido(e.target.checked)}
          className="w-4 h-4 accent-green-600"
        />
        <span className="text-sm font-medium text-slate-700">
          Problema já resolvido durante a ligação
          <span className="ml-1 text-xs text-slate-400">(registra direto como solução proposta)</span>
        </span>
      </label>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome de quem ligou *</label>
        <input
          type="text"
          value={solicitanteNome}
          onChange={(e) => setSolicitanteNome(e.target.value)}
          required
          placeholder="Nome do colaborador que relatou o problema"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Título do problema *</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          placeholder="Descreva brevemente o problema relatado"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição detalhada *</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
          rows={4}
          placeholder="Detalhe o que foi relatado na ligação e, se já resolvido, o que foi orientado"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800 resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-700 bg-white"
          >
            <option value="">Selecionar</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.icone} {c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Setor *</label>
          <select
            value={setorId}
            onChange={(e) => setSetorId(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-700 bg-white"
          >
            <option value="">Selecionar</option>
            {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Urgência *</label>
        <select
          value={urgencia}
          onChange={(e) => setUrgencia(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-700 bg-white"
        >
          <option value="ALTA">Alta — impedia completamente o trabalho</option>
          <option value="MEDIA">Média — dificultava o trabalho</option>
          <option value="BAIXA">Baixa — não impedia o trabalho</option>
        </select>
      </div>

      {erro && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{erro}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={enviando}
          className="px-6 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-60"
        >
          {enviando ? "Registrando…" : jaResolvido ? "Registrar como resolvido ✓" : "Registrar ocorrência"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
