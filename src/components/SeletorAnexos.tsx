"use client";

import { useRef } from "react";

const MAX_ARQUIVOS = 5;
const MAX_BYTES = 15 * 1024 * 1024;

interface Props {
  arquivos: File[];
  onChange: (arquivos: File[]) => void;
  label?: string;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SeletorAnexos({ arquivos, onChange, label = "Anexos (opcional)" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function adicionar(novos: FileList | null) {
    if (!novos) return;
    const lista = [...arquivos];
    for (const f of Array.from(novos)) {
      if (lista.length >= MAX_ARQUIVOS) break;
      if (f.size > MAX_BYTES) {
        alert(`"${f.name}" excede o limite de 15 MB e não foi adicionado.`);
        continue;
      }
      lista.push(f);
    }
    onChange(lista.slice(0, MAX_ARQUIVOS));
    if (inputRef.current) inputRef.current.value = "";
  }

  function remover(i: number) {
    onChange(arquivos.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="space-y-2">
        {arquivos.map((f, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <span className="truncate text-slate-700">📎 {f.name}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400">{formatarTamanho(f.size)}</span>
              <button type="button" onClick={() => remover(i)} className="text-slate-400 hover:text-red-500 text-lg leading-none">
                ×
              </button>
            </div>
          </div>
        ))}
        {arquivos.length < MAX_ARQUIVOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-300 rounded-lg py-3 text-sm text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            + Adicionar arquivo (imagem, vídeo, PDF…)
          </button>
        )}
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => adicionar(e.target.files)} />
        <p className="text-xs text-slate-400">Até {MAX_ARQUIVOS} arquivos, 15 MB cada.</p>
      </div>
    </div>
  );
}

// Sobe os arquivos selecionados para um chamado já criado.
export async function uploadAnexos(chamadoId: string, arquivos: File[], origem: string): Promise<void> {
  if (arquivos.length === 0) return;
  const fd = new FormData();
  fd.append("origem", origem);
  for (const f of arquivos) fd.append("file", f);
  const res = await fetch(`/api/chamados/${chamadoId}/anexos`, { method: "POST", body: fd });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.erro ?? "Falha ao enviar anexos");
  }
}
