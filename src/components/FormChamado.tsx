"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Categoria { id: string; nome: string; icone: string | null }
interface Setor { id: string; nome: string }
interface ArtigoSugestao { id: string; slug: string; titulo: string; descricaoProb: string; categoria: { nome: string } }

interface Props {
  categorias: Categoria[];
  setores: Setor[];
  autorId: string;
  setorIdPadrao: string | null;
  artigoConsultado?: string;
}

export default function FormChamado({ categorias, setores, autorId, setorIdPadrao, artigoConsultado }: Props) {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [setorId, setSetorId] = useState(setorIdPadrao ?? "");
  const [urgencia, setUrgencia] = useState("BAIXA");
  const [sugestoes, setSugestoes] = useState<ArtigoSugestao[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [modalSugestoes, setModalSugestoes] = useState(false);
  const [artigosConfirmados, setArtigosConfirmados] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zera confirmação sempre que as sugestões mudam (novo título = nova busca)
  useEffect(() => { setArtigosConfirmados(false); }, [titulo]);

  // Busca sugestões enquanto digita
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (titulo.length < 4) { setSugestoes([]); return; }

    timeoutRef.current = setTimeout(async () => {
      setBuscando(true);
      const res = await fetch(`/api/artigos?q=${encodeURIComponent(titulo)}`);
      const data = await res.json();
      setSugestoes(data);
      setBuscando(false);
    }, 500);

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [titulo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    // Se há artigos sugeridos e o colaborador ainda não confirmou que consultou, abre o modal
    if (sugestoes.length > 0 && !artigosConfirmados) {
      setModalSugestoes(true);
      return;
    }

    setEnviando(true);

    const res = await fetch("/api/chamados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo, descricao, categoriaId, setorId, urgencia,
        canal: "SITE",
        autorId,
      }),
    });

    setEnviando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.erro ?? "Erro ao abrir chamado.");
      return;
    }

    const data = await res.json();
    router.push(`/chamados/${data.id}`);
    router.refresh();
  }

  const urgenciaAlta = urgencia === "ALTA";

  return (
    <div className="space-y-4">

      {/* Modal de confirmação de artigos */}
      {modalSugestoes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📚</span>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Encontramos artigos relacionados</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Antes de abrir um chamado, consulte os artigos abaixo. Eles podem resolver o seu problema
                  sem necessidade de aguardar atendimento.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {sugestoes.map((s) => (
                <a
                  key={s.id}
                  href={`/base-conhecimento/${s.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 p-3 bg-primary-50 border border-primary-200 rounded-xl hover:border-primary-400 transition-colors group"
                >
                  <span className="text-primary-500 mt-0.5">📄</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-primary-700">{s.titulo}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{s.descricaoProb}</p>
                    <p className="text-xs text-primary-600 mt-1 font-medium">Abrir artigo →</p>
                  </div>
                </a>
              ))}
            </div>

            <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
              Os artigos abrem em nova aba. Leia com atenção antes de continuar.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => { setArtigosConfirmados(true); setModalSugestoes(false); }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Li os artigos e nenhum resolveu — abrir chamado
              </button>
              <button
                onClick={() => setModalSugestoes(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
              >
                Voltar e consultar os artigos
              </button>
            </div>
          </div>
        </div>
      )}
      {artigoConsultado && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Você consultou a base de conhecimento mas o artigo não resolveu. Preencha os detalhes abaixo.
        </div>
      )}

      {urgenciaAlta && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-semibold text-sm">⚠️ Urgência Alta — não abra pelo site!</p>
          <p className="text-red-600 text-xs mt-1">
            Para problemas que impedem completamente o trabalho, ligue diretamente para o TI.
            O consultor registrará a ocorrência no sistema após o atendimento.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título do problema *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            placeholder="Descreva brevemente o problema"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-800"
          />
        </div>

        {/* Sugestões da base de conhecimento */}
        {(sugestoes.length > 0 || buscando) && (
          <div className="border border-primary-100 bg-primary-50 rounded-xl p-4">
            <p className="text-sm font-medium text-primary-800 mb-3">
              {buscando ? "Buscando na base de conhecimento…" : "📚 Encontramos artigos que podem resolver:"}
            </p>
            {!buscando && sugestoes.map((s) => (
              <Link
                key={s.id}
                href={`/base-conhecimento/${s.slug}`}
                target="_blank"
                className="block bg-white border border-primary-200 rounded-lg p-3 mb-2 hover:border-primary-400 transition-colors last:mb-0"
              >
                <p className="text-sm font-medium text-slate-800">{s.titulo}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{s.descricaoProb}</p>
                <p className="text-xs text-primary-600 mt-1">Ver artigo →</p>
              </Link>
            ))}
            <p className="text-xs text-primary-600 mt-2">Consulte os artigos antes de prosseguir. Se não resolver, continue preenchendo.</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição detalhada *</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            rows={4}
            placeholder="Explique quando o problema começou, o que você tentou fazer e qualquer detalhe relevante"
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
            <option value="BAIXA">Baixa — não impede o trabalho</option>
            <option value="MEDIA">Média — dificulta o trabalho</option>
            <option value="ALTA">Alta — impede completamente o trabalho (ligar para o TI)</option>
          </select>
        </div>

        {erro && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{erro}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={enviando || urgenciaAlta}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {enviando ? "Abrindo chamado…" : sugestoes.length > 0 && !artigosConfirmados ? "Abrir chamado 📚" : "Abrir chamado"}
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
    </div>
  );
}
