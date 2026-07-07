import { createClient } from "@supabase/supabase-js";

// Cliente do Supabase Storage usando a service_role key (server-side apenas).
// Nunca expor esta chave no cliente.
const supabaseUrl = process.env.SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const BUCKET_ANEXOS = "anexos";

// Limites (item 1): suficiente para 5 PNGs, PDF/DOCX de 5 páginas.
export const MAX_ARQUIVO_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_ARQUIVOS = 5;

function getClient() {
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase Storage não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

// Sobe um arquivo e retorna o caminho salvo no bucket.
export async function uploadAnexo(params: {
  chamadoId: string;
  nomeArquivo: string;
  tipo: string;
  buffer: Buffer;
}): Promise<string> {
  const client = getClient();
  const nomeLimpo = params.nomeArquivo.replace(/[^\w.\-]/g, "_");
  const caminho = `${params.chamadoId}/${Date.now()}-${nomeLimpo}`;

  const { error } = await client.storage
    .from(BUCKET_ANEXOS)
    .upload(caminho, params.buffer, { contentType: params.tipo, upsert: false });

  if (error) throw new Error(error.message);
  return caminho;
}

// Gera uma URL temporária (assinada) para baixar/visualizar um anexo privado.
export async function urlAssinada(caminho: string, segundos = 300): Promise<string> {
  const client = getClient();
  const { data, error } = await client.storage
    .from(BUCKET_ANEXOS)
    .createSignedUrl(caminho, segundos);
  if (error || !data) throw new Error(error?.message ?? "Falha ao gerar URL");
  return data.signedUrl;
}

// Remove um arquivo do bucket (usado quando um anexo é excluído).
export async function removerAnexo(caminho: string): Promise<void> {
  const client = getClient();
  await client.storage.from(BUCKET_ANEXOS).remove([caminho]);
}
