import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FormArtigo from "@/components/FormArtigo";

interface Props {
  searchParams: Promise<{ editar?: string; chamado?: string }>;
}

export default async function NovoArtigoPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") redirect("/");

  const { editar, chamado } = await searchParams;

  const [categorias, artigoEditar, chamadoOrigem] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    editar ? prisma.artigo.findUnique({ where: { id: editar } }) : null,
    chamado ? prisma.chamado.findUnique({ where: { id: chamado }, select: { id: true, titulo: true, descricao: true, solucaoProposta: true, categoriaId: true } }) : null,
  ]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        {artigoEditar ? "Editar artigo" : "Novo artigo"}
      </h1>
      <FormArtigo
        categorias={categorias}
        artigoEditar={artigoEditar}
        chamadoOrigem={chamadoOrigem}
        autorId={session.user.id}
      />
    </div>
  );
}
