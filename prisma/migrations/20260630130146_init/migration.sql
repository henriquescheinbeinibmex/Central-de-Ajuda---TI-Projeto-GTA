-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COLABORADOR', 'CONSULTOR_TI', 'GESTOR');

-- CreateEnum
CREATE TYPE "Urgencia" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "StatusChamado" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'SOLUCAO_PROPOSTA', 'VALIDADO', 'REABERTO');

-- CreateEnum
CREATE TYPE "CanalOrigem" AS ENUM ('SITE', 'LIGACAO_URGENTE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLABORADOR',
    "setorId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "icone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artigo" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricaoProb" TEXT NOT NULL,
    "solucao" TEXT NOT NULL,
    "tags" TEXT[],
    "categoriaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "visualizacoes" INTEGER NOT NULL DEFAULT 0,
    "utilidade" INTEGER NOT NULL DEFAULT 0,
    "publicado" BOOLEAN NOT NULL DEFAULT true,
    "chamadoOrigemId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artigo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chamado" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "urgencia" "Urgencia" NOT NULL DEFAULT 'BAIXA',
    "canal" "CanalOrigem" NOT NULL DEFAULT 'SITE',
    "registradoAposLig" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusChamado" NOT NULL DEFAULT 'ABERTO',
    "categoriaId" TEXT NOT NULL,
    "setorId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "consultorId" TEXT,
    "solucaoProposta" TEXT,
    "dataSolucao" TIMESTAMP(3),
    "dataValidacao" TIMESTAMP(3),
    "validadoEm" TIMESTAMP(3),
    "feedbackColaborador" TEXT,
    "feedbackComentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chamado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoricoStatus" (
    "id" TEXT NOT NULL,
    "chamadoId" TEXT NOT NULL,
    "status" "StatusChamado" NOT NULL,
    "observacao" TEXT,
    "usuarioId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoricoStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Setor_nome_key" ON "Setor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Artigo_slug_key" ON "Artigo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Artigo_chamadoOrigemId_key" ON "Artigo"("chamadoOrigemId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artigo" ADD CONSTRAINT "Artigo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artigo" ADD CONSTRAINT "Artigo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artigo" ADD CONSTRAINT "Artigo_chamadoOrigemId_fkey" FOREIGN KEY ("chamadoOrigemId") REFERENCES "Chamado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "Setor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chamado" ADD CONSTRAINT "Chamado_consultorId_fkey" FOREIGN KEY ("consultorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoricoStatus" ADD CONSTRAINT "HistoricoStatus_chamadoId_fkey" FOREIGN KEY ("chamadoId") REFERENCES "Chamado"("id") ON DELETE CASCADE ON UPDATE CASCADE;
