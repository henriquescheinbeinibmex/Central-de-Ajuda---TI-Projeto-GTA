import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import FormChamado from "@/components/FormChamado";

interface Props {
  searchParams: Promise<{ artigo?: string }>;
}

export default async function NovoChamadoPage({ searchParams }: Props) {
  const session = await auth();
  const { artigo } = await searchParams;

  const [categorias, setores] = await Promise.all([
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
    prisma.setor.findMany({ orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Abrir novo chamado</h1>
      <FormChamado
        categorias={categorias}
        setores={setores}
        autorId={session!.user.id}
        setorIdPadrao={session!.user.setorId}
        artigoConsultado={artigo}
      />
    </div>
  );
}
