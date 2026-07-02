import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { gerarSlug } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  // Divide a query em palavras para busca mais abrangente
  const palavras = q.trim().split(/\s+/).filter(Boolean);

  const artigos = await prisma.artigo.findMany({
    where: {
      publicado: true,
      ...(palavras.length > 0
        ? {
            OR: palavras.flatMap((p) => [
              { titulo: { contains: p, mode: "insensitive" } },
              { descricaoProb: { contains: p, mode: "insensitive" } },
              { tags: { has: p.toLowerCase() } },
            ]),
          }
        : {}),
    },
    select: { id: true, slug: true, titulo: true, descricaoProb: true, tags: true, categoria: { select: { nome: true } } },
    orderBy: { visualizacoes: "desc" },
    take: 5,
  });

  return NextResponse.json(artigos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "CONSULTOR_TI") {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const { titulo, descricaoProb, solucao, categoriaId, tags, publicado, chamadoOrigemId } = body;

  if (!titulo || !descricaoProb || !solucao || !categoriaId) {
    return NextResponse.json({ erro: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  let slug = gerarSlug(titulo);
  const existe = await prisma.artigo.findUnique({ where: { slug } });
  if (existe) slug = `${slug}-${Date.now()}`;

  if (chamadoOrigemId) {
    const jaConvertido = await prisma.artigo.findUnique({ where: { chamadoOrigemId } });
    if (jaConvertido) {
      return NextResponse.json({ erro: "Este chamado já foi convertido em artigo" }, { status: 409 });
    }
  }

  try {
    const artigo = await prisma.artigo.create({
      data: {
        slug,
        titulo,
        descricaoProb,
        solucao,
        categoriaId,
        tags: tags ?? [],
        publicado: publicado ?? true,
        autorId: session.user.id,
        chamadoOrigemId: chamadoOrigemId ?? null,
      },
    });

    return NextResponse.json(artigo, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Não foi possível criar o artigo. Verifique a categoria informada." }, { status: 400 });
  }
}
