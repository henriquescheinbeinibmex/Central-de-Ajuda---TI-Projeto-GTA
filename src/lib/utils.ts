import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function formatarData(data: Date | string): string {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

export function formatarDataHora(data: Date | string): string {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export const statusLabel: Record<string, string> = {
  AGUARDANDO_APROVACAO: "Aguardando aprovação do gestor",
  REPROVADO: "Reprovado pelo gestor",
  ABERTO: "Chamados pendentes de atendimento",
  EM_ANDAMENTO: "Em andamento",
  SOLUCAO_PROPOSTA: "Solução proposta",
  VALIDADO: "Resolvido / Validado",
  REABERTO: "Reaberto",
};

// Adiciona N dias úteis (seg-sex) a uma data — usado nos prazos de SLA.
export function adicionarDiasUteis(data: Date, dias: number): Date {
  const resultado = new Date(data);
  let restantes = dias;
  while (restantes > 0) {
    resultado.setDate(resultado.getDate() + 1);
    const diaSemana = resultado.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) restantes--;
  }
  return resultado;
}

// SLA de aprovação do gestor por urgência (em dias úteis).
export const slaAprovacaoDias: Record<string, number> = {
  BAIXA: 3,
  MEDIA: 1,
};

export const urgenciaLabel: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
};

export const statusColor: Record<string, string> = {
  AGUARDANDO_APROVACAO: "bg-amber-100 text-amber-800",
  REPROVADO: "bg-rose-100 text-rose-800",
  ABERTO: "bg-yellow-100 text-yellow-800",
  EM_ANDAMENTO: "bg-primary-100 text-primary-800",
  SOLUCAO_PROPOSTA: "bg-purple-100 text-purple-800",
  VALIDADO: "bg-green-100 text-green-800",
  REABERTO: "bg-red-100 text-red-800",
};

export const urgenciaColor: Record<string, string> = {
  BAIXA: "bg-gray-100 text-gray-700",
  MEDIA: "bg-orange-100 text-orange-700",
  ALTA: "bg-red-100 text-red-700",
};
