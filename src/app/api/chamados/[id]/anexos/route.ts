import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadAnexo, MAX_ARQUIVO_BYTES, MAX_ARQUIVOS } from "@/lib/storage";

// Faz upload de um ou mais anexos para um chamado.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  const chamado = await prisma.chamado.findUnique({
    where: { id },
    select: { id: true, autorId: true, setorId: true },
  });
  if (!chamado) return NextResponse.json({ erro: "Chamado não encontrado" }, { status: 404 });

  // Permissão: TI, autor do chamado, ou gestor do mesmo setor
  const ehTI = session.user.role === "CONSULTOR_TI";
  const ehAutor = session.user.id === chamado.autorId;
  const ehGestorSetor = session.user.role === "GESTOR" && session.user.setorId === chamado.setorId;
  if (!ehTI && !ehAutor && !ehGestorSetor) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  const formData = await req.formData();
  const arquivos = formData.getAll("file").filter((f): f is File => f instanceof File);
  const origem = (formData.get("origem") as string) ?? "ABERTURA";

  if (arquivos.length === 0) {
    return NextResponse.json({ erro: "Nenhum arquivo enviado" }, { status: 400 });
  }

  // Limite total de anexos por chamado
  const jaExistentes = await prisma.anexo.count({ where: { chamadoId: id } });
  if (jaExistentes + arquivos.length > MAX_ARQUIVOS) {
    return NextResponse.json(
      { erro: `Máximo de ${MAX_ARQUIVOS} anexos por chamado` },
      { status: 400 }
    );
  }

  const criados = [];
  for (const arquivo of arquivos) {
    if (arquivo.size > MAX_ARQUIVO_BYTES) {
      return NextResponse.json(
        { erro: `"${arquivo.name}" excede o limite de 15 MB` },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    try {
      const caminho = await uploadAnexo({
        chamadoId: id,
        nomeArquivo: arquivo.name,
        tipo: arquivo.type || "application/octet-stream",
        buffer,
      });
      const anexo = await prisma.anexo.create({
        data: {
          chamadoId: id,
          origem,
          nomeArquivo: arquivo.name,
          caminho,
          tipo: arquivo.type || "application/octet-stream",
          tamanho: arquivo.size,
          enviadoPorId: session.user.id,
        },
        select: { id: true, nomeArquivo: true, tipo: true, tamanho: true },
      });
      criados.push(anexo);
    } catch (err) {
      console.error("[anexo:upload]", err instanceof Error ? err.message : err);
      return NextResponse.json({ erro: "Falha ao enviar o arquivo. Tente novamente." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, anexos: criados }, { status: 201 });
}
