import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminCategorias from "@/components/AdminCategorias";

export default async function AdminCategoriasPage() {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") redirect("/");

  const [categorias, setores] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.setor.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Categorias e Setores</h1>
      <AdminCategorias categorias={categorias} setores={setores} />
    </div>
  );
}
