# Guia de Deploy — Central de Ajuda de TI

## Pré-requisitos
- Conta no GitHub (gratuita): github.com
- Conta no Supabase (gratuita): supabase.com
- Conta no Vercel (gratuita): vercel.com

---

## Passo 1 — Criar o banco de dados no Supabase

1. Acesse supabase.com → New project
2. Defina nome, senha forte e região (South America - São Paulo)
3. Aguarde inicializar (~1 min)
4. Vá em Settings → Database → Connection string → URI
5. Copie a string (começa com `postgresql://postgres:...`)

---

## Passo 2 — Configurar variáveis de ambiente localmente

Edite o arquivo `.env` na raiz do projeto:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA@db.XXXX.supabase.co:5432/postgres"
NEXTAUTH_SECRET="gere_com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
NEXTAUTH_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seuemail@empresa.com"
SMTP_PASS="sua_senha_de_app_gmail"
SMTP_FROM="Central de Ajuda TI <seuemail@empresa.com>"
CRON_SECRET="outro_segredo_aleatorio_longo"
```

### Como gerar um segredo aleatório:
Abra o terminal na pasta do projeto e execute:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Como obter senha de app do Gmail:
1. Acesse myaccount.google.com → Segurança
2. Ative a verificação em duas etapas
3. Pesquise "Senhas de app" → crie uma para "Email"
4. Use a senha gerada (16 caracteres) no SMTP_PASS

---

## Passo 3 — Rodar migration e seed

Com o DATABASE_URL configurado no .env, execute:

```bash
npm run db:migrate
# (quando perguntar o nome da migration, digite: init)

npm run db:seed
```

Usuários criados pelo seed:
- ti@empresa.com / senha123 (Consultor TI)
- gestor@empresa.com / senha123 (Gestor)
- joao@empresa.com / senha123 (Colaborador)
- maria@empresa.com / senha123 (Colaborador)

**IMPORTANTE: Troque as senhas após o primeiro acesso.**

---

## Passo 4 — Publicar no GitHub

1. Crie um repositório privado em github.com/new
2. Na pasta do projeto, execute:
```bash
git init
git add .
git commit -m "Versão inicial"
git remote add origin https://github.com/SEU_USUARIO/central-ajuda-ti.git
git push -u origin main
```

---

## Passo 5 — Deploy no Vercel

1. Acesse vercel.com → New Project → Import do GitHub
2. Selecione o repositório `central-ajuda-ti`
3. Em **Environment Variables**, adicione todas as variáveis do `.env`
   (exceto NEXTAUTH_URL — o Vercel preenche automaticamente)
4. Para NEXTAUTH_URL: adicione com o valor `https://central-ajuda-ti.vercel.app`
   (ajuste para o domínio que o Vercel atribuir)
5. Clique em Deploy

---

## Passo 6 — Configurar o Cron no Vercel

O cron de email já está configurado no `vercel.json` para rodar às 8h diariamente.
Ele exige que a variável `CRON_SECRET` esteja definida nas variáveis de ambiente do Vercel.

---

## Atualizar o site no futuro

Qualquer alteração no código: basta fazer `git push` para o GitHub.
O Vercel detecta automaticamente e faz o deploy em ~2 minutos.
