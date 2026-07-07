import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enviarEmailNovoChamado, enviarEmailAprovacaoPendente } from "@/lib/email";
import { adicionarDiasUteis, slaAprovacaoDias } from "@/lib/utils";

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
  const ehColaborador = session.user.role === "COLABORADOR";

  // Colaboradores passam pela aprovação do gestor do setor antes de chegar ao TI.
  // Gestores e TI abrindo pelo site vão direto para ABERTO.
  const statusColaborador = ehColaborador ? "AGUARDANDO_APROVACAO" : "ABERTO";

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
        status: statusColaborador as const,
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

  const aguardandoAprovacao = dadosLigacao.status === "AGUARDANDO_APROVACAO";

  try {
    const dataValidacaoInicial =
      dadosLigacao.status === "SOLUCAO_PROPOSTA"
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        : null;

    // Prazo (SLA) para o gestor aprovar, conforme urgência (em dias úteis)
    const prazoAprovacao = aguardandoAprovacao
      ? adicionarDiasUteis(new Date(), slaAprovacaoDias[urgencia ?? "BAIXA"] ?? 3)
      : null;

    const observacaoInicial = aguardandoAprovacao
      ? "Chamado aberto — aguardando aprovação do gestor do setor"
      : jaResolvido
      ? `Problema resolvido durante o atendimento telefônico (relatado por ${dadosLigacao.solicitanteNome ?? "colaborador"})`
      : dadosLigacao.solicitanteNome
      ? `Chamado registrado pelo TI após atendimento por telefone (relatado por ${dadosLigacao.solicitanteNome})`
      : "Chamado aberto";

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
        ...(prazoAprovacao ? { prazoAprovacao } : {}),
        historico: {
          create: {
            status: dadosLigacao.status,
            observacao: observacaoInicial,
          },
        },
      },
    });

    // IMPORTANTE: aguardamos (await) o envio. Sem await, a função serverless
    // do Vercel é encerrada ao retornar a resposta e o email nunca é enviado.
    const setor = await prisma.setor.findUnique({ where: { id: setorId }, select: { nome: true } });

    if (aguardandoAprovacao) {
      // Notifica os gestores do setor para aprovarem o chamado
      const gestores = await prisma.user.findMany({
        where: { role: "GESTOR", setorId },
        select: { email: true },
      });
      const emailsGestores = gestores.map((g) => g.email).filter(Boolean) as string[];
      try {
        await enviarEmailAprovacaoPendente({
          gestores: emailsGestores,
          chamadoId: chamado.id,
          chamadoTitulo: chamado.titulo,
          autorNome: session.user.name ?? "Colaborador",
          setor: setor?.nome ?? "—",
        });
      } catch (err) {
        console.error("[email:aprovacaoPendente]", err instanceof Error ? err.message : err);
      }
    } else if (canalFinal === "SITE") {
      // Chamado que já vai direto para o TI (gestor abrindo pelo site)
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
