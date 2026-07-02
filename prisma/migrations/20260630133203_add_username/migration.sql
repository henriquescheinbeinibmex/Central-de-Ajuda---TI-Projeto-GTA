-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill (tabela vazia neste momento, mas garante segurança caso existam linhas)
UPDATE "User" SET "username" = "id" WHERE "username" IS NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
