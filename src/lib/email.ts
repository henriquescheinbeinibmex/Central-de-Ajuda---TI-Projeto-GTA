import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

// Remetente. Precisa ser de um domínio VERIFICADO no Resend.
// Padrão: onboarding@resend.dev (domínio de teste já verificado do Resend).
// Em produção, o cliente define EMAIL_FROM com um endereço do domínio dele.
const FROM = process.env.EMAIL_FROM ?? "Central TI <onboarding@resend.dev>";

// O SDK do Resend NÃO lança exceção em falha — retorna { data, error }.
// Este wrapper registra o erro no log para diagnóstico.
async function enviar(opts: { from: string; to: string[]; subject: string; html: string }) {
  const { data, error } = await resend.emails.send(opts);
  if (error) {
    console.error("[email:resend]", JSON.stringify(error), "→ destinatários:", opts.to.join(", "));
    return;
  }
  console.log("[email:resend] enviado id=", data?.id, "→", opts.to.join(", "));
}

async function getDestinatariosTI(fallback?: string): Promise<string[]> {
  const consultores = await prisma.user.findMany({
    where: { role: "CONSULTOR_TI" },
    select: { email: true },
  });
  const emails = consultores.map((u) => u.email).filter(Boolean) as string[];
  if (emails.length > 0) return emails;
  return fallback ? [fallback] : [];
}

function baseHtml(conteudo: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
      <div style="background: #1d4ed8; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; color: white; font-size: 18px;">Central de Ajuda de TI — Esteio Superatacado</h2>
      </div>
      <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
        ${conteudo}
        <p style="margin-top: 32px; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Email enviado automaticamente pela Central de Ajuda de TI.
        </p>
      </div>
    </div>`;
}

// ── 1. Novo chamado aberto ──────────────────────────────────────────
export async function enviarEmailNovoChamado(params: {
  chamadoId: string;
  chamadoTitulo: string;
  setor: string;
  urgencia: string;
}) {
  const to = await getDestinatariosTI();
  if (to.length === 0) return;

  const url = `${process.env.AUTH_URL}/chamados/${params.chamadoId}`;
  const urgenciaLabel: Record<string, string> = {
    ALTA: "🔴 Alta", MEDIA: "🟡 Média", BAIXA: "🟢 Baixa",
  };

  await enviar({
    from: FROM,
    to,
    subject: `[Central TI] Novo chamado: ${params.chamadoTitulo}`,
    html: baseHtml(`
      <p style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">📋 Novo chamado aberto</p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Título:</strong> ${params.chamadoTitulo}</p>
        <p style="margin: 0 0 8px 0;"><strong>Setor:</strong> ${params.setor}</p>
        <p style="margin: 0;"><strong>Urgência:</strong> ${urgenciaLabel[params.urgencia] ?? params.urgencia}</p>
      </div>
      <a href="${url}" style="background: #1d4ed8; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">
        Ver chamado →
      </a>
    `),
  });
}

// ── 2. Chamado reaberto pelo colaborador ───────────────────────────
export async function enviarEmailChamadoReaberto(params: {
  chamadoId: string;
  chamadoTitulo: string;
  comentario?: string | null;
}) {
  const to = await getDestinatariosTI();
  if (to.length === 0) return;

  const url = `${process.env.AUTH_URL}/chamados/${params.chamadoId}`;

  await enviar({
    from: FROM,
    to,
    subject: `[Central TI] Chamado reaberto: ${params.chamadoTitulo}`,
    html: baseHtml(`
      <p style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">🔄 Chamado reaberto pelo colaborador</p>
      <p>O colaborador indicou que o problema <strong>não foi resolvido</strong> e o chamado foi reaberto automaticamente.</p>
      <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Chamado:</strong> ${params.chamadoTitulo}</p>
        ${params.comentario ? `<p style="margin: 0;"><strong>Comentário:</strong> ${params.comentario}</p>` : ""}
      </div>
      <a href="${url}" style="background: #ea580c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">
        Ver chamado →
      </a>
    `),
  });
}

// ── 3. Prazo de validação vencido (chamado pelo cron diário) ───────
export async function enviarEmailValidacao(params: {
  consultorEmail?: string;
  consultorNome: string;
  chamadoId: string;
  chamadoTitulo: string;
}) {
  const to = await getDestinatariosTI(params.consultorEmail);
  if (to.length === 0) return;

  const url = `${process.env.AUTH_URL}/chamados/${params.chamadoId}`;

  await enviar({
    from: FROM,
    to,
    subject: `[Central TI] Chamado pronto para validação: ${params.chamadoTitulo}`,
    html: baseHtml(`
      <p style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">🎉 Prazo de validação atingido</p>
      <p>O prazo de 14 dias para validação do chamado abaixo foi atingido sem reincidência. Por favor, confirme a validação.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <strong>${params.chamadoTitulo}</strong>
      </div>
      <a href="${url}" style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">
        Validar chamado →
      </a>
    `),
  });
}

// ── 4. Solução proposta ao colaborador ─────────────────────────────
export async function enviarEmailSolucaoProposta(params: {
  colaboradorEmail: string;
  colaboradorNome: string;
  chamadoId: string;
  chamadoTitulo: string;
  solucao: string;
}) {
  const url = `${process.env.AUTH_URL}/chamados/${params.chamadoId}`;

  await enviar({
    from: FROM,
    to: [params.colaboradorEmail],
    subject: `[Central TI] Solução proposta para: ${params.chamadoTitulo}`,
    html: baseHtml(`
      <p style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">✅ O TI propôs uma solução para o seu chamado</p>
      <p>Olá, <strong>${params.colaboradorNome}</strong>. O consultor de TI registrou uma solução para o seu chamado.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0;"><strong>Chamado:</strong> ${params.chamadoTitulo}</p>
        <p style="margin: 0;"><strong>Solução:</strong> ${params.solucao}</p>
      </div>
      <p>Acesse o chamado para confirmar se o problema foi resolvido ou reabri-lo caso não tenha sido.</p>
      <a href="${url}" style="background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: 600;">
        Ver chamado →
      </a>
    `),
  });
}
