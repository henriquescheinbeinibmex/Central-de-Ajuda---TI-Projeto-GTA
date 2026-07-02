import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const { nome, icone } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ erro: "Nome obrigatório" }, { status: 400 });

  try {
    const cat = await prisma.categoria.update({ where: { id }, data: { nome: nome.trim(), icone } });
    return NextResponse.json(cat);
  } catch {
    return NextResponse.json({ erro: "Já existe uma categoria com esse nome" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });

  const { id } = await params;
  const realocarPara = req.nextUrl.searchParams.get("realocarPara");

  const [emUsoChamados, artigos] = await Promise.all([
    prisma.chamado.count({ where: { categoriaId: id } }),
    prisma.artigo.findMany({ where: { categoriaId: id }, select: { id: true, titulo: true } }),
  ]);

  // Chamados bloqueiam exclusão permanentemente (histórico não pode perder referência)
  if (emUsoChamados > 0) {
    return NextResponse.json(
      { erro: `Não é possível excluir: ${emUsoChamados} chamado(s) estão vinculados a esta categoria. Reatribua-os primeiro.` },
      { status: 409 }
    );
  }

  // Artigos: bloqueiam, mas podem ser realocados
  if (artigos.length > 0 && !realocarPara) {
    return NextResponse.json(
      { erro: "artigos_vinculados", artigos, tipo: "artigos" },
      { status: 409 }
    );
  }

  if (artigos.length > 0 && realocarPara) {
    // Verifica que a categoria destino existe
    const categoriaDestino = await prisma.categoria.findUnique({ where: { id: realocarPara } });
    if (!categoriaDestino) {
      return NextResponse.json({ erro: "Categoria de destino não encontrada" }, { status: 400 });
    }
    // Move todos os artigos para a nova categoria
    await prisma.artigo.updateMany({ where: { categoriaId: id }, data: { categoriaId: realocarPara } });
  }

  await prisma.categoria.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
