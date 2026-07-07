"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatarData } from "@/lib/utils";

interface Usuario {
  id: string;
  nome: string;
  username: string;
  email: string;
  role: string;
  setorId: string | null;
  setor: { nome: string } | null;
  criadoEm: Date | string;
}

interface Setor { id: string; nome: string }

interface Props {
  usuarios: Usuario[];
  setores: Setor[];
  sessaoId: string;
}

const roleLabel: Record<string, string> = {
  COLABORADOR: "Colaborador",
  CONSULTOR_TI: "Consultor de TI",
  GESTOR: "Gestor",
};

const roleBadge: Record<string, string> = {
  COLABORADOR: "bg-slate-100 text-slate-600",
  CONSULTOR_TI: "bg-primary-100 text-primary-700",
  GESTOR: "bg-purple-100 text-purple-700",
};

export default function AdminUsuarios({ usuarios, setores, sessaoId }: Props) {
  const router = useRouter();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const formVazio = { nome: "", email: "", senha: "", role: "COLABORADOR", setorId: "" };
  const [form, setForm] = useState(formVazio);

  function abrirEdicao(u: Usuario) {
    setEditando(u);
    setForm({ nome: u.nome, email: u.email, senha: "", role: u.role, setorId: u.setorId ?? "" });
    setMostrarForm(true);
  }

  function fechar() {
    setMostrarForm(false);
    setEditando(null);
    setForm(formVazio);
    setErro("");
  }

  async function salvar() {
    setErro("");

    // Senha obrigatória na criação; opcional na edição. Quando informada, 4 dígitos.
    const senhaInformada = form.senha.trim();
    if (!editando && !senhaInformada) { setErro("Informe uma senha de 4 dígitos."); return; }
    if (senhaInformada && !/^\d{4}$/.test(senhaInformada)) {
      setErro("A senha deve ter exatamente 4 dígitos numéricos.");
      return;
    }

    setSalvando(true);
    const payload = { ...form, setorId: form.setorId || null };
    const url = editando ? `/api/usuarios/${editando.id}` : "/api/usuarios";
    const method = editando ? "PUT" : "POST";

    if (editando) {
      const { senha, ...rest } = payload;
      Object.assign(payload, senha ? { novaSenha: senha } : {});
      if (!senha) delete (payload as Record<string, unknown>).senha;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSalvando(false);
    if (!res.ok) { const d = await res.json(); setErro(d.erro); return; }
    fechar();
    router.refresh();
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este usuário? Esta ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.erro); return; }
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setMostrarForm(true); setEditando(null); setForm(formVazio); }}
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo usuário
        </button>
      </div>

      {/* Modal de formulário */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="font-bold text-slate-800 text-lg mb-5">
              {editando ? "Editar usuário" : "Novo usuário"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email (login) *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="colaborador@empresa.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800" />
                <p className="text-xs text-slate-400 mt-1">O usuário fará login com este email.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editando ? "Nova senha (4 dígitos — deixe em branco para manter)" : "Senha (4 dígitos) *"}
                </label>
                <input type="password" inputMode="numeric" maxLength={4} value={form.senha}
                  onChange={(e) => setForm({ ...form, senha: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  placeholder="0000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 tracking-widest" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Perfil *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700">
                  <option value="COLABORADOR">Colaborador</option>
                  <option value="GESTOR">Gestor</option>
                  <option value="CONSULTOR_TI">Consultor de TI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                <select value={form.setorId} onChange={(e) => setForm({ ...form, setorId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700">
                  <option value="">Nenhum</option>
                  {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            </div>
            {erro && <p className="text-red-600 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={salvar} disabled={salvando}
                className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors">
                {salvando ? "Salvando…" : editando ? "Salvar" : "Criar usuário"}
              </button>
              <button onClick={fechar}
                className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de usuários */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-slate-600">Nome</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">Email (login)</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">Perfil</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">Setor</th>
              <th className="text-left px-5 py-3 font-medium text-slate-600">Criado em</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">{u.nome}</td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge[u.role]}`}>
                    {roleLabel[u.role]}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{u.setor?.nome ?? "—"}</td>
                <td className="px-5 py-3 text-slate-400">{formatarData(u.criadoEm)}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => abrirEdicao(u)}
                      className="text-xs px-3 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                      Editar
                    </button>
                    {u.id !== sessaoId && (
                      <button onClick={() => excluir(u.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
