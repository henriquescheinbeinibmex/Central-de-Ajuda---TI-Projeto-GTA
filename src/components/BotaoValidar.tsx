"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BotaoValidar({ chamadoId }: { chamadoId: string }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);

  async function validar() {
    setSalvando(true);
    await fetch(`/api/chamados/${chamadoId}/validar`, { method: "POST" });
    setSalvando(false);
    router.refresh();
  }

  return (
    <button
      onClick={validar}
      disabled={salvando}
      className="flex-shrink-0 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
    >
      {salvando ? "Validando…" : "Validar"}
    </button>
  );
}
