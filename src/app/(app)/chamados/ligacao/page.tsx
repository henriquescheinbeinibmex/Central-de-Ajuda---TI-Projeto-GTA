import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormLigacao from "@/components/FormLigacao";

export default async function RegistrarLigacaoPage() {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") redirect("/");

  const [categorias, setores, colaboradorGenerico] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.setor.findMany({ orderBy: { nome: "asc" } }),
    prisma.user.findFirst({ where: { role: "COLABORADOR" }, select: { id: true } }),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Registrar ocorrência recebida por ligação</h1>
      <p className="text-slate-500 text-sm mb-6">
        Use esta tela para registrar chamados urgentes que foram atendidos por telefone.
      </p>
      <FormLigacao
        categorias={categorias}
        setores={setores}
        autorId={colaboradorGenerico?.id ?? ""}
        consultorId={session.user.id}
      />
    </div>
  );
}
