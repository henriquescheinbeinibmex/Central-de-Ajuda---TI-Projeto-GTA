import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarEmailNovoChamado } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const {
    titulo, descricao, categoriaId, setorId, urgencia, canal,
    registradoAposLig, autorId, solicitanteNome, consultorId, status, jaResolvido,
  } = body;

  if (!titulo || !descricao || !categoriaId || !setorId) {
    return NextResponse.json({ erro: "Campos obrigatórios ausentes" }, { status: 400 });
  }

  const ehTI = session.user.role === "CONSULTOR_TI";

  // Apenas o consultor de TI pode registrar chamados em nome de outro autor (ligação),
  // atribuir consultor diretamente, definir status inicial diferente de ABERTO,
  // usar canal de ligação, ou abrir chamados com urgência Alta
  const dadosLigacao = ehTI
    ? {
        autorId: autorId || session.user.id,
        solicitanteNome: solicitanteNome ?? null,
        consultorId: consultorId ?? null,
        status: status ?? "ABERTO",
        canal: canal ?? "SITE",
        registradoAposLig: registradoAposLig ?? false,
      }
    : {
        autorId: session.user.id,
        solicitanteNome: null,
        consultorId: null,
        status: "ABERTO" as const,
        canal: "SITE" as const,
        registradoAposLig: false,
      };

  if (!ehTI && urgencia === "ALTA") {
    return NextResponse.json(
      { erro: "Chamados de urgência alta devem ser feitos por ligação direta ao TI, não pelo site" },
      { status: 400 }
    );
  }

  const { canal: canalFinal, registradoAposLig: registradoAposLigFinal, ...restoLigacao } = dadosLigacao;

  try {
    const dataValidacaoInicial =
      dadosLigacao.status === "SOLUCAO_PROPOSTA"
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        : null;

    const chamado = await prisma.chamado.create({
      data: {
        titulo,
        descricao,
        categoriaId,
        setorId,
        urgencia: urgencia ?? "BAIXA",
        canal: canalFinal,
        registradoAposLig: registradoAposLigFinal,
        ...restoLigacao,
        ...(dataValidacaoInicial ? { dataValidacao: dataValidacaoInicial } : {}),
        historico: {
          create: {
            status: dadosLigacao.status,
            observacao: jaResolvido
              ? `Problema resolvido durante o atendimento telefônico (relatado por ${dadosLigacao.solicitanteNome ?? "colaborador"})`
              : dadosLigacao.solicitanteNome
              ? `Chamado registrado pelo TI após atendimento por telefone (relatado por ${dadosLigacao.solicitanteNome})`
              : "Chamado aberto",
          },
        },
      },
    });

    // Notifica TI apenas para chamados abertos pelo colaborador via site
    // Chamados de ligação são registrados pelo próprio TI — não faz sentido notificá-lo
    // IMPORTANTE: aguardamos (await) o envio. Sem await, a função serverless
    // do Vercel é encerrada ao retornar a resposta e o email nunca é enviado.
    if (canalFinal === "SITE") {
      const setor = await prisma.setor.findUnique({ where: { id: setorId }, select: { nome: true } });
      try {
        await enviarEmailNovoChamado({
          chamadoId: chamado.id,
          chamadoTitulo: chamado.titulo,
          setor: setor?.nome ?? "—",
          urgencia: chamado.urgencia,
        });
      } catch (err) {
        console.error("[email:novoChamado]", err instanceof Error ? err.message : err);
      }
    }

    return NextResponse.json(chamado, { status: 201 });
  } catch {
    return NextResponse.json({ erro: "Categoria, setor ou usuário informado é inválido" }, { status: 400 });
  }
}
