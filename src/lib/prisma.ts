import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Em ambiente serverless (Vercel), cada instância abre seu próprio pool.
  // Com o padrão de 10 conexões por instância, várias instâncias simultâneas
  // estouram o limite de conexões do Supabase (EMAXCONNSESSION / max clients).
  // Limitamos a poucas conexões por instância e liberamos as ociosas rápido.
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

// Reutiliza a mesma instância entre invocações "quentes" da função serverless,
// evitando abrir um novo pool a cada requisição.
const globalStore = globalForPrisma;
export const prisma = globalStore.prisma || createPrismaClient();
globalStore.prisma = prisma;
