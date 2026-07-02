import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: "CONSULTOR_TI" },
    data: { email: "henriquescheinbein@ibmex.com.br" },
  });
  console.log(`Atualizado: ${result.count} usuário(s)`);

  const usuarios = await prisma.user.findMany({
    select: { nome: true, email: true, role: true },
  });
  console.table(usuarios);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
