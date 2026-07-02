import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gerarSlug } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { titulo, descricaoProb, solucao, categoriaId, tags, publicado } = body;

  const artigo = await prisma.artigo.findUnique({ where: { id } });
  if (!artigo) return NextResponse.json({ erro: "Artigo não encontrado" }, { status: 404 });

  let slug = artigo.slug;
  if (titulo !== artigo.titulo) {
    slug = gerarSlug(titulo);
    const existe = await prisma.artigo.findFirst({ where: { slug, NOT: { id } } });
    if (existe) slug = `${slug}-${Date.now()}`;
  }

  try {
    const atualizado = await prisma.artigo.update({
      where: { id },
      data: { titulo, descricaoProb, solucao, categoriaId, tags: tags ?? [], publicado, slug },
    });
    return NextResponse.json(atualizado);
  } catch {
    return NextResponse.json({ erro: "Não foi possível atualizar o artigo. Verifique a categoria informada." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await prisma.artigo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ erro: "Artigo não encontrado" }, { status: 404 });
  }
}
