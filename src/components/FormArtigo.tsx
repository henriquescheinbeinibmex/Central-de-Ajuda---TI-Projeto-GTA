"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Categoria {
  id: string;
  nome: string;
  icone: string | null;
}

interface Props {
  categorias: Categoria[];
  artigoEditar?: {
    id: string;
    titulo: string;
    descricaoProb: string;
    solucao: string;
    tags: string[];
    categoriaId: string;
    publicado: boolean;
  } | null;
  chamadoOrigem?: {
    id: string;
    titulo: string;
    descricao: string;
    solucaoProposta: string | null;
    categoriaId: string;
  } | null;
  autorId: string;
}

export default function FormArtigo({ categorias, artigoEditar, chamadoOrigem, autorId }: Props) {
  const router = useRouter();
  const editando = !!artigoEditar;

  const [titulo, setTitulo] = useState(artigoEditar?.titulo ?? chamadoOrigem?.titulo ?? "");
  const [descricaoProb, setDescricaoProb] = useState(artigoEditar?.descricaoProb ?? chamadoOrigem?.descricao ?? "");
  const [solucao, setSolucao] = useState(artigoEditar?.solucao ?? chamadoOrigem?.solucaoProposta ?? "");
  const [categoriaId, setCategoriaId] = useState(artigoEditar?.categoriaId ?? chamadoOrigem?.categoriaId ?? "");
  const [tagsStr, setTagsStr] = useState(artigoEditar?.tags.join(", ") ?? "");
  const [publicado, setPublicado] = useState(artigoEditar?.publicado ?? true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);

    const tags = tagsStr.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);

    const payload = {
      titulo,
      descricaoProb,
      solucao,
      categoriaId,
      tags,
      publicado,
      autorId,
      chamadoOrigemId: chamadoOrigem?.id ?? null,
    };

    const res = await fetch(
      editando ? `/api/artigos/${artigoEditar!.id}` : "/api/artigos",
      {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setSalvando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.erro ?? "Erro ao salvar artigo.");
      return;
    }

    const data = await res.json();
    router.push(`/base-conhecimento/${data.slug}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
      {chamadoOrigem && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-700">
          Artigo sendo criado a partir do chamado: <strong>{chamadoOrigem.titulo}</strong>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Título do artigo *</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          placeholder="Ex: Impressora não imprime no Windows"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-700 bg-white"
        >
          <option value="">Selecione uma categoria</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.icone} {cat.nome}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do problema *</label>
        <p className="text-xs text-slate-400 mb-1">Descreva os sintomas do problema como o colaborador vai ver</p>
        <textarea
          value={descricaoProb}
          onChange={(e) => setDescricaoProb(e.target.value)}
          required
          rows={3}
          placeholder="Ex: A impressora aparece na lista de dispositivos, mas ao tentar imprimir nada acontece..."
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800 resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Solução passo a passo *</label>
        <p className="text-xs text-slate-400 mb-1">
          Use <code className="bg-slate-100 px-1 rounded">**texto**</code> para negrito e numere os passos (1. 2. 3.)
        </p>
        <textarea
          value={solucao}
          onChange={(e) => setSolucao(e.target.value)}
          required
          rows={10}
          placeholder={"1. Abra o Painel de Controle\n2. Clique em Dispositivos e Impressoras\n..."}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800 font-mono resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
        <p className="text-xs text-slate-400 mb-1">Separe por vírgula — ajudam na busca</p>
        <input
          type="text"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="impressora, spooler, windows, fila"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="publicado"
          checked={publicado}
          onChange={(e) => setPublicado(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="publicado" className="text-sm text-slate-700">
          Publicar imediatamente (visível para todos os colaboradores)
        </label>
      </div>

      {erro && (
        <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{erro}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={salvando}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Publicar artigo"}
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
