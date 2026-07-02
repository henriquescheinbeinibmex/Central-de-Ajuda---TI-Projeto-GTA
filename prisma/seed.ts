import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter, log: ["error"] });

async function main() {
  console.log("🌱 Iniciando seed...");

  // Setores
  const setores = await Promise.all([
    prisma.setor.upsert({ where: { nome: "Administrativo" }, update: {}, create: { nome: "Administrativo" } }),
    prisma.setor.upsert({ where: { nome: "Financeiro" }, update: {}, create: { nome: "Financeiro" } }),
    prisma.setor.upsert({ where: { nome: "Comercial" }, update: {}, create: { nome: "Comercial" } }),
    prisma.setor.upsert({ where: { nome: "TI" }, update: {}, create: { nome: "TI" } }),
    prisma.setor.upsert({ where: { nome: "RH" }, update: {}, create: { nome: "RH" } }),
  ]);

  const [setorAdmin, setorFinanceiro, setorComercial, setorTI] = setores;

  // Categorias
  const categorias = await Promise.all([
    prisma.categoria.upsert({ where: { nome: "Rede e Conectividade" }, update: {}, create: { nome: "Rede e Conectividade", icone: "🌐" } }),
    prisma.categoria.upsert({ where: { nome: "Hardware" }, update: {}, create: { nome: "Hardware", icone: "🖥️" } }),
    prisma.categoria.upsert({ where: { nome: "Software" }, update: {}, create: { nome: "Software", icone: "💻" } }),
    prisma.categoria.upsert({ where: { nome: "Acessos e Permissões" }, update: {}, create: { nome: "Acessos e Permissões", icone: "🔐" } }),
    prisma.categoria.upsert({ where: { nome: "Impressoras" }, update: {}, create: { nome: "Impressoras", icone: "🖨️" } }),
    prisma.categoria.upsert({ where: { nome: "Sistemas Internos" }, update: {}, create: { nome: "Sistemas Internos", icone: "⚙️" } }),
  ]);

  const [catRede, catHardware, catSoftware, catAcessos, catImpressoras, catSistemas] = categorias;

  // Usuários — logins compartilhados por perfil
  const consultor = await prisma.user.upsert({
    where: { username: "tiesteio" },
    update: {},
    create: {
      nome: "Consultor de TI",
      username: "tiesteio",
      email: "henriquescheinbein@ibmex.com.br",
      senha: await hash("demandas2026", 12),
      role: "CONSULTOR_TI",
      setorId: setorTI.id,
    },
  });

  const gestor = await prisma.user.upsert({
    where: { username: "gestoresesteio" },
    update: {},
    create: {
      nome: "Gestor",
      username: "gestoresesteio",
      email: "gestores@empresa.com",
      senha: await hash("gestoresdemandas2026", 12),
      role: "GESTOR",
      setorId: null,
    },
  });

  const colaborador1 = await prisma.user.upsert({
    where: { username: "chamadoti" },
    update: {},
    create: {
      nome: "Colaborador",
      username: "chamadoti",
      email: "colaborador@empresa.com",
      senha: await hash("colaboradoresteio", 12),
      role: "COLABORADOR",
      setorId: setorFinanceiro.id,
    },
  });

  const colaborador2 = colaborador1;

  // Artigos da base de conhecimento
  const artigos = [
    {
      slug: "impressora-nao-imprime-windows",
      titulo: "Impressora não imprime no Windows",
      descricaoProb: "A impressora aparece na lista de dispositivos, mas ao tentar imprimir nada acontece. O documento fica parado na fila de impressão ou some sem imprimir.",
      solucao: `1. Abra o **Painel de Controle** → Dispositivos e Impressoras\n2. Clique com o botão direito na impressora → **Ver o que está sendo impresso**\n3. No menu superior, clique em **Impressora** → **Cancelar todos os documentos**\n4. Feche a janela e aguarde 30 segundos\n5. Abra o **Gerenciador de Tarefas** (Ctrl+Shift+Esc) → aba Serviços\n6. Procure o serviço **Spooler de Impressão** (ou Print Spooler), clique com o botão direito → **Reiniciar**\n7. Tente imprimir novamente\n\nSe o problema persistir, verifique se o cabo USB da impressora está bem conectado ou, se for impressora de rede, se ela está ligada e na mesma rede Wi-Fi.`,
      tags: ["impressora", "fila", "spooler", "windows", "imprimir"],
      categoriaId: catImpressoras.id,
    },
    {
      slug: "wifi-conectado-sem-internet",
      titulo: "Wi-Fi conectado mas sem acesso à internet",
      descricaoProb: "O computador aparece como conectado ao Wi-Fi (mostra o ícone de Wi-Fi sem o 'X'), mas nenhuma página abre no navegador e o símbolo de alerta aparece na conexão.",
      solucao: `1. Abra o **Prompt de Comando** como administrador (tecla Windows → digite "cmd" → clique com botão direito → Executar como administrador)\n2. Digite cada comando abaixo e pressione Enter após cada um:\n   - \`ipconfig /release\`\n   - \`ipconfig /flushdns\`\n   - \`ipconfig /renew\`\n   - \`netsh winsock reset\`\n3. **Reinicie o computador**\n4. Se continuar sem internet, verifique se outros dispositivos na mesma rede também estão sem internet (problema pode ser no roteador ou provedor)\n5. Se apenas o seu computador estiver com problema, entre em contato com o TI`,
      tags: ["wifi", "internet", "rede", "sem conexão", "dns"],
      categoriaId: catRede.id,
    },
    {
      slug: "esqueci-senha-windows",
      titulo: "Esqueci a senha do Windows / conta bloqueada",
      descricaoProb: "Não consigo fazer login no Windows porque esqueci minha senha ou a conta foi bloqueada após várias tentativas incorretas.",
      solucao: `**Atenção:** O reset de senha do Windows corporativo deve ser feito APENAS pelo TI para garantir a segurança da conta.\n\n1. **Abra um chamado URGENTE** no sistema ou ligue diretamente para o TI\n2. Informe: seu nome completo, setor, e o nome do computador (geralmente colado na máquina ou na etiqueta do patrimônio)\n3. O consultor de TI fará o reset remotamente ou presencialmente\n4. Você receberá uma senha temporária e será solicitado a criar uma nova senha no primeiro login\n\n**Dica para evitar no futuro:** anote sua senha em local seguro ou use um gerenciador de senhas.`,
      tags: ["senha", "login", "bloqueado", "windows", "acesso"],
      categoriaId: catAcessos.id,
    },
    {
      slug: "computador-lento",
      titulo: "Computador muito lento",
      descricaoProb: "O computador demora para abrir programas, trava durante o uso ou fica com o disco em 100% no Gerenciador de Tarefas.",
      solucao: `**Verificações iniciais:**\n1. Abra o **Gerenciador de Tarefas** (Ctrl+Shift+Esc)\n2. Na aba **Processos**, verifique qual programa está consumindo mais CPU, Memória ou Disco\n3. Se for o **Windows Defender** ou **Windows Update**, aguarde — ele vai terminar sozinho\n\n**Se o problema persistir:**\n4. Reinicie o computador (muitas vezes resolve)\n5. Verifique se há atualizações pendentes: Configurações → Windows Update → Verificar atualizações\n6. Libere espaço em disco: clique com botão direito no disco C: → Propriedades → Limpeza de Disco\n7. Desative programas que iniciam com o Windows: Gerenciador de Tarefas → aba Inicializar → desative o que não precisar\n\nSe o computador continuar lento após essas etapas, abra um chamado para o TI analisar o hardware.`,
      tags: ["lento", "travando", "disco", "cpu", "memória", "performance"],
      categoriaId: catHardware.id,
    },
    {
      slug: "outlook-nao-sincroniza-emails",
      titulo: "Outlook não sincroniza / emails não chegam",
      descricaoProb: "O Outlook está aberto mas não recebe novos emails, ou aparece a mensagem 'Desconectado' na barra inferior.",
      solucao: `1. Verifique a barra de status na parte inferior do Outlook — ela deve mostrar **Conectado** (não 'Desconectado' ou 'Offline')\n2. Se mostrar **Trabalhando Offline**, clique na aba **Enviar/Receber** → clique em **Trabalhar Offline** para desmarcar\n3. Clique em **Enviar/Receber Todas as Pastas** (F9)\n4. Se ainda não funcionar, feche o Outlook completamente e abra novamente\n5. Verifique se está conectado à internet ou à VPN (se trabalhar remotamente)\n\nSe o problema persistir por mais de 30 minutos, abra um chamado para o TI verificar as configurações da conta de email.`,
      tags: ["outlook", "email", "sincronizar", "desconectado", "office"],
      categoriaId: catSoftware.id,
    },
  ];

  for (const artigo of artigos) {
    await prisma.artigo.upsert({
      where: { slug: artigo.slug },
      update: {},
      create: {
        ...artigo,
        autorId: consultor.id,
        visualizacoes: Math.floor(Math.random() * 80) + 10,
        utilidade: Math.floor(Math.random() * 40) + 5,
      },
    });
  }

  // Chamados de exemplo
  const dataAntiga = new Date();
  dataAntiga.setDate(dataAntiga.getDate() - 20);
  const dataValidacaoVencida = new Date();
  dataValidacaoVencida.setDate(dataValidacaoVencida.getDate() - 2);

  await prisma.chamado.upsert({
    where: { id: "chamado-seed-1" },
    update: {},
    create: {
      id: "chamado-seed-1",
      titulo: "Impressora do financeiro não imprime",
      descricao: "A impressora HP do setor financeiro para de imprimir depois de alguns documentos. Os documentos ficam na fila mas nada sai.",
      urgencia: "MEDIA",
      status: "SOLUCAO_PROPOSTA",
      categoriaId: catImpressoras.id,
      setorId: setorFinanceiro.id,
      autorId: colaborador1.id,
      consultorId: consultor.id,
      solucaoProposta: "Reiniciado o serviço Spooler de Impressão e atualizado o driver da impressora HP LaserJet M401.",
      dataSolucao: dataAntiga,
      dataValidacao: dataValidacaoVencida,
    },
  });

  await prisma.chamado.upsert({
    where: { id: "chamado-seed-2" },
    update: {},
    create: {
      id: "chamado-seed-2",
      titulo: "Não consigo acessar o sistema ERP",
      descricao: "Ao tentar acessar o sistema interno de ERP, aparece mensagem de 'usuário sem permissão'. Isso começou após as férias.",
      urgencia: "ALTA",
      status: "EM_ANDAMENTO",
      categoriaId: catSistemas.id,
      setorId: setorComercial.id,
      autorId: gestor.id,
      consultorId: consultor.id,
    },
  });

  await prisma.chamado.upsert({
    where: { id: "chamado-seed-3" },
    update: {},
    create: {
      id: "chamado-seed-3",
      titulo: "Computador reiniciando sozinho",
      descricao: "Meu computador reinicia sozinho durante o trabalho, sem aviso. Já aconteceu 3 vezes hoje. Estou perdendo o trabalho não salvo.",
      urgencia: "ALTA",
      canal: "LIGACAO_URGENTE",
      registradoAposLig: true,
      status: "ABERTO",
      categoriaId: catHardware.id,
      setorId: setorAdmin.id,
      autorId: colaborador2.id,
    },
  });

  await prisma.chamado.upsert({
    where: { id: "chamado-seed-4" },
    update: {},
    create: {
      id: "chamado-seed-4",
      titulo: "Wi-Fi caindo toda hora",
      descricao: "A conexão Wi-Fi cai a cada 15-20 minutos. Preciso reconectar manualmente. Outros colegas da mesma sala não relatam o problema.",
      urgencia: "BAIXA",
      status: "VALIDADO",
      categoriaId: catRede.id,
      setorId: setorFinanceiro.id,
      autorId: colaborador1.id,
      consultorId: consultor.id,
      solucaoProposta: "Atualizado o driver da placa de rede Wi-Fi e alterado o canal do roteador de 6 para 11 para evitar interferência.",
      dataSolucao: dataAntiga,
      dataValidacao: dataValidacaoVencida,
      validadoEm: new Date(),
      feedbackColaborador: "resolveu",
      feedbackComentario: "Funcionou perfeitamente após a atualização do driver!",
    },
  });

  console.log("✅ Seed concluído!");
  console.log("\n📋 Usuários criados:");
  console.log("  • Consultor TI: tiesteio / demandas2026");
  console.log("  • Gestor:       gestoresesteio / gestoresdemandas2026");
  console.log("  • Colaborador:  chamadoti / colaboradoresteio");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
