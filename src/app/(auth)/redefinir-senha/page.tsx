"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function RedefinirSenhaForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!/^\d{4}$/.test(senha)) {
      setErro("A senha deve ter exatamente 4 dígitos numéricos.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    const res = await fetch("/api/auth/redefinir-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, novaSenha: senha }),
    });
    setCarregando(false);

    if (!res.ok) {
      const d = await res.json();
      setErro(d.erro ?? "Não foi possível redefinir a senha.");
      return;
    }
    setSucesso(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (!token) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
        Link inválido. Solicite uma nova recuperação de senha.
        <Link href="/esqueci-senha" className="block mt-2 text-primary-600 hover:underline">
          Solicitar novamente
        </Link>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
        Senha redefinida com sucesso! Redirecionando para o login…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha (4 dígitos)</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={senha}
          onChange={(e) => setSenha(e.target.value.replace(/\D/g, "").slice(0, 4))}
          required
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 tracking-widest"
          placeholder="0000"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar nova senha</label>
        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value.replace(/\D/g, "").slice(0, 4))}
          required
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 tracking-widest"
          placeholder="0000"
        />
      </div>
      {erro && <p className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">{erro}</p>}
      <button
        type="submit"
        disabled={carregando}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {carregando ? "Salvando…" : "Redefinir senha"}
      </button>
    </form>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Nova senha</h1>
          <p className="text-slate-500 mt-1 text-sm">Escolha uma nova senha de 4 dígitos.</p>
        </div>
        <Suspense fallback={<p className="text-center text-sm text-slate-400">Carregando…</p>}>
          <RedefinirSenhaForm />
        </Suspense>
      </div>
    </div>
  );
}
