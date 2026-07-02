import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminUsuarios from "@/components/AdminUsuarios";

export default async function AdminUsuariosPage() {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") redirect("/");

  const [usuarios, setores] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, nome: true, username: true, email: true, role: true, setorId: true, setor: { select: { nome: true } }, criadoEm: true },
      orderBy: { nome: "asc" },
    }),
    prisma.setor.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Gerenciar Usuários</h1>
      <AdminUsuarios usuarios={usuarios} setores={setores} sessaoId={session.user.id} />
    </div>
  );
}
