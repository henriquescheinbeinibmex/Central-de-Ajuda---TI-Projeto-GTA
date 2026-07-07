import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { urlAssinada } from "@/lib/storage";

// Redireciona para uma URL temporária assinada do arquivo, após checar permissão.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const anexo = await prisma.anexo.findUnique({
    where: { id },
    include: { chamado: { select: { autorId: true, setorId: true } } },
  });
  if (!anexo) return NextResponse.json({ erro: "Anexo não encontrado" }, { status: 404 });

  // Mesma regra de acesso ao chamado
  const ehTI = session.user.role === "CONSULTOR_TI";
  const ehAutor = session.user.id === anexo.chamado.autorId;
  const ehGestorSetor = session.user.role === "GESTOR" && session.user.setorId === anexo.chamado.setorId;
  const ehColaboradorSetor = session.user.role === "COLABORADOR" && session.user.setorId === anexo.chamado.setorId;
  if (!ehTI && !ehAutor && !ehGestorSetor && !ehColaboradorSetor) {
    return NextResponse.json({ erro: "Sem permissão" }, { status: 403 });
  }

  try {
    const url = await urlAssinada(anexo.caminho, 300);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[anexo:download]", err instanceof Error ? err.message : err);
    return NextResponse.json({ erro: "Falha ao acessar o arquivo" }, { status: 500 });
  }
}
