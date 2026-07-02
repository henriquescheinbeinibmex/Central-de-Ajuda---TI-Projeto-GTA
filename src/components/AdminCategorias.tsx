"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Item { id: string; nome: string; icone?: string | null }
interface ArtigoVinculado { id: string; titulo: string }

interface Props {
  categorias: Item[];
  setores: Item[];
}

// ──────────────────────────────────────────────────
// Seção genérica (usada para Setores)
// ──────────────────────────────────────────────────
function SecaoAdmin({
  titulo, itens, endpoint, comIcone,
}: {
  titulo: string;
  itens: Item[];
  endpoint: string;
  comIcone?: boolean;
}) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editIcone, setEditIcone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function criar() {
    if (!nome.trim()) return;
    setSalvando(true); setErro("");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, icone: icone || null }),
    });
    setSalvando(false);
    if (!res.ok) { const d = await res.json(); setErro(d.erro); return; }
    setNome(""); setIcone("");
    router.refresh();
  }

  async function salvarEdicao(id: string) {
    setSalvando(true); setErro("");
    const res = await fetch(`${endpoint}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: editNome, icone: editIcone || null }),
    });
    setSalvando(false);
    if (!res.ok) { const d = await res.json(); setErro(d.erro); return; }
    setEditandoId(null);
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este item?")) return;
    setErro("");
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); setErro(d.erro); return; }
    router.refresh();
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="font-semibold text-slate-700 mb-4">{titulo}</h2>
      <div className="flex gap-2 mb-5">
        {comIcone && (
          <input type="text" value={icone} onChange={(e) => setIcone(e.target.value)} placeholder="Emoji"
            className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-center" />
        )}
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
          placeholder={`Nome do ${titulo.toLowerCase().replace(/s$/, "")}`}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800"
          onKeyDown={(e) => e.key === "Enter" && criar()} />
        <button onClick={criar} disabled={salvando || !nome.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors">
          Adicionar
        </button>
      </div>
      {erro && <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}
      <div className="space-y-2">
        {itens.map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            {editandoId === item.id ? (
              <>
                {comIcone && <input value={editIcone} onChange={(e) => setEditIcone(e.target.value)}
                  className="w-14 px-2 py-1 border border-slate-300 rounded text-sm text-center" />}
                <input value={editNome} onChange={(e) => setEditNome(e.target.value)}
                  className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800"
                  onKeyDown={(e) => e.key === "Enter" && salvarEdicao(item.id)} />
                <button onClick={() => salvarEdicao(item.id)} disabled={salvando}
                  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Salvar</button>
                <button onClick={() => setEditandoId(null)}
                  className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-700">
                  {item.icone && <span className="mr-1">{item.icone}</span>}{item.nome}
                </span>
                <button onClick={() => { setEditandoId(item.id); setEditNome(item.nome); setEditIcone(item.icone ?? ""); }}
                  className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-white transition-colors">Editar</button>
                <button onClick={() => excluir(item.id)}
                  className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">Excluir</button>
              </>
            )}
          </div>
        ))}
        {itens.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Nenhum item cadastrado</p>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Seção de Categorias (com suporte a realocação de artigos)
// ──────────────────────────────────────────────────
function SecaoCategorias({ categorias }: { categorias: Item[] }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editIcone, setEditIcone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Estado do modal de realocação
  const [modalRealocar, setModalRealocar] = useState(false);
  const [categoriaParaExcluir, setCategoriaParaExcluir] = useState<Item | null>(null);
  const [artigosVinculados, setArtigosVinculados] = useState<ArtigoVinculado[]>([]);
  const [categoriaDestinoId, setCategoriaDestinoId] = useState("");

  async function criar() {
    if (!nome.trim()) return;
    setSalvando(true); setErro("");
    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, icone: icone || null }),
    });
    setSalvando(false);
    if (!res.ok) { const d = await res.json(); setErro(d.erro); return; }
    setNome(""); setIcone("");
    router.refresh();
  }

  async function salvarEdicao(id: string) {
    setSalvando(true); setErro("");
    const res = await fetch(`/api/categorias/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: editNome, icone: editIcone || null }),
    });
    setSalvando(false);
    if (!res.ok) { const d = await res.json(); setErro(d.erro); return; }
    setEditandoId(null);
    router.refresh();
  }

  async function tentarExcluir(item: Item) {
    if (!confirm(`Excluir a categoria "${item.nome}"?`)) return;
    setErro("");
    const res = await fetch(`/api/categorias/${item.id}`, { method: "DELETE" });

    if (res.ok) { router.refresh(); return; }

    const data = await res.json();

    // Artigos vinculados: abre modal de realocação
    if (data.tipo === "artigos" && data.artigos) {
      setCategoriaParaExcluir(item);
      setArtigosVinculados(data.artigos);
      setCategoriaDestinoId("");
      setModalRealocar(true);
      return;
    }

    // Qualquer outro erro (ex.: chamados vinculados)
    setErro(data.erro ?? "Não foi possível excluir.");
  }

  async function confirmarRealocar() {
    if (!categoriaParaExcluir || !categoriaDestinoId) return;
    setSalvando(true);
    const res = await fetch(`/api/categorias/${categoriaParaExcluir.id}?realocarPara=${categoriaDestinoId}`, { method: "DELETE" });
    setSalvando(false);
    if (!res.ok) { const d = await res.json(); setErro(d.erro); setModalRealocar(false); return; }
    setModalRealocar(false);
    setCategoriaParaExcluir(null);
    setArtigosVinculados([]);
    router.refresh();
  }

  const categoriasDestino = categorias.filter((c) => c.id !== categoriaParaExcluir?.id);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      {/* Modal de realocação */}
      {modalRealocar && categoriaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-lg">Artigos vinculados</h3>
            <p className="text-slate-600 text-sm">
              A categoria <strong>{categoriaParaExcluir.nome}</strong> possui {artigosVinculados.length} artigo(s).
              Selecione uma categoria de destino para realocá-los antes de excluir.
            </p>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {artigosVinculados.map((a) => (
                <li key={a.id} className="text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg">📄 {a.titulo}</li>
              ))}
            </ul>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mover artigos para</label>
              <select
                value={categoriaDestinoId}
                onChange={(e) => setCategoriaDestinoId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecionar categoria</option>
                {categoriasDestino.map((c) => (
                  <option key={c.id} value={c.id}>{c.icone && `${c.icone} `}{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={confirmarRealocar}
                disabled={salvando || !categoriaDestinoId}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {salvando ? "Realocando…" : "Realocar e excluir categoria"}
              </button>
              <button
                onClick={() => setModalRealocar(false)}
                className="px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 className="font-semibold text-slate-700 mb-4">Categorias</h2>
      <div className="flex gap-2 mb-5">
        <input type="text" value={icone} onChange={(e) => setIcone(e.target.value)} placeholder="Emoji"
          className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-center" />
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da categoria"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800"
          onKeyDown={(e) => e.key === "Enter" && criar()} />
        <button onClick={criar} disabled={salvando || !nome.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors">
          Adicionar
        </button>
      </div>
      {erro && <p className="text-red-600 text-sm mb-3 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}
      <div className="space-y-2">
        {categorias.map((item) => (
          <div key={item.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
            {editandoId === item.id ? (
              <>
                <input value={editIcone} onChange={(e) => setEditIcone(e.target.value)}
                  className="w-14 px-2 py-1 border border-slate-300 rounded text-sm text-center" />
                <input value={editNome} onChange={(e) => setEditNome(e.target.value)}
                  className="flex-1 px-3 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800"
                  onKeyDown={(e) => e.key === "Enter" && salvarEdicao(item.id)} />
                <button onClick={() => salvarEdicao(item.id)} disabled={salvando}
                  className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">Salvar</button>
                <button onClick={() => setEditandoId(null)}
                  className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">Cancelar</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-700">
                  {item.icone && <span className="mr-1">{item.icone}</span>}{item.nome}
                </span>
                <button onClick={() => { setEditandoId(item.id); setEditNome(item.nome); setEditIcone(item.icone ?? ""); }}
                  className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-white transition-colors">Editar</button>
                <button onClick={() => tentarExcluir(item)}
                  className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">Excluir</button>
              </>
            )}
          </div>
        ))}
        {categorias.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Nenhuma categoria cadastrada</p>}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// Exportação principal
// ──────────────────────────────────────────────────
export default function AdminCategorias({ categorias, setores }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SecaoCategorias categorias={categorias} />
      <SecaoAdmin titulo="Setores" itens={setores} endpoint="/api/setores" />
    </div>
  );
}
