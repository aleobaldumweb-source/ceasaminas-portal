import { config } from 'dotenv';
import { resolve } from 'node:path';

config({
  path: resolve(process.cwd(), '../../.env'),
});

if (process.env.CONFIRM_REPLACE_NEWS !== 'true') {
  throw new Error('Defina CONFIRM_REPLACE_NEWS=true para substituir todas as notícias.');
}

const { prisma } = await import('@ceasaminas/database');

const officialNews = [
  {
    title: 'Acordo entre CeasaMinas e MPMG garante prorrogação de contratos de lojistas',
    slug: 'acordo-ceasaminas-mpmg-prorrogacao-contratos-lojistas',
    category: 'Institucional',
    summary:
      'Termo firmado com o Ministério Público de Minas Gerais permite prorrogar contratos de concessão nos seis entrepostos da CeasaMinas.',
    content:
      'A CeasaMinas assinou, em Contagem, um Termo de Compromisso de Conduta com o Ministério Público de Minas Gerais para disciplinar a prorrogação dos contratos de concessão de uso em seus seis entrepostos.\n\nSegundo a publicação oficial, contratos elegíveis poderão ser prorrogados uma vez por até 25 anos, desde que atendam aos requisitos cadastrais, financeiros, jurídicos e contratuais. O acordo busca preservar a continuidade do abastecimento e ampliar a segurança jurídica para concessionários e produtores.\n\nConsulte a íntegra e os critérios no site oficial da CeasaMinas.',
    sourceUrl: 'https://www.ceasaminas.com.br/noticiageral.asp?codigonoticia=5583',
    imageUrl: '/images/news/acordo-mpmg.svg',
    publishedAt: new Date('2026-07-16T12:00:00.000Z'),
  },
  {
    title: 'CeasaMinas participa do 41º Congresso Mineiro de Municípios',
    slug: 'ceasaminas-41-congresso-mineiro-municipios',
    category: 'Institucional',
    summary:
      'Participação apresentou o papel da central no desenvolvimento agrícola e ampliou a cooperação técnica com municípios mineiros.',
    content:
      'A CeasaMinas participou do 41º Congresso Mineiro de Municípios, no Expominas, para apresentar sua atuação no abastecimento e no desenvolvimento da agricultura estadual.\n\nDurante o evento foi prevista a assinatura de cooperação técnica com a Associação Mineira de Municípios. A iniciativa contempla capacitação de servidores municipais envolvidos na elaboração de editais, no recebimento e na distribuição de produtos hortigranjeiros.\n\nMais informações estão disponíveis na publicação oficial.',
    sourceUrl: 'https://www.ceasaminas.com.br/noticiageral.asp?codigonoticia=5575',
    imageUrl: '/images/news/congresso-municipios.svg',
    publishedAt: new Date('2026-05-04T12:00:00.000Z'),
  },
  {
    title: 'Prodal lista sete motivos para você se tornar um doador em 2026',
    slug: 'prodal-sete-motivos-doador-2026',
    category: 'Responsabilidade social',
    summary:
      'Banco de Alimentos destaca controle, segurança, transparência e benefícios ambientais de doar alimentos próprios para consumo.',
    content:
      'O Prodal Banco de Alimentos apresentou razões para concessionários e produtores destinarem excedentes próprios para consumo às instituições atendidas pelo programa.\n\nA operação inclui critérios de cadastro das entidades beneficiadas, avaliação dos alimentos recebidos, coleta das doações e publicação periódica de resultados. Além do impacto social, a doação reduz desperdícios e a destinação inadequada de resíduos.\n\nOs contatos e detalhes atualizados estão na notícia oficial da CeasaMinas.',
    sourceUrl: 'https://www.ceasaminas.com.br/noticiageral.asp?codigonoticia=5561',
    imageUrl: '/images/news/prodal-doadores.svg',
    publishedAt: new Date('2026-01-13T12:00:00.000Z'),
  },
  {
    title: 'Prodal adere à Rede Brasileira de Bancos de Alimentos',
    slug: 'prodal-rede-brasileira-bancos-alimentos',
    category: 'Responsabilidade social',
    summary:
      'Adesão reconhece a atuação do Prodal e amplia o acesso do programa a capacitações, referências técnicas e iniciativas de doação.',
    content:
      'O Prodal Banco de Alimentos passou a integrar a Rede Brasileira de Bancos de Alimentos, que reúne organizações comprometidas com o combate à fome e ao desperdício.\n\nA participação fortalece o acesso a treinamentos, manuais e recursos técnicos, além de aproximar o programa de iniciativas nacionais e regionais de doação. O reconhecimento reforça o trabalho realizado com concessionários, produtores e instituições beneficiadas.\n\nLeia os detalhes na fonte oficial da CeasaMinas.',
    sourceUrl: 'https://www.ceasaminas.com.br/noticiageral.asp?codigonoticia=5560',
    imageUrl: '/images/news/prodal-rede.svg',
    publishedAt: new Date('2025-12-17T12:00:00.000Z'),
  },
  {
    title: 'Quilombo dos Arturos começa a comercializar na CeasaMinas',
    slug: 'quilombo-arturos-comercializa-ceasaminas',
    category: 'Inclusão produtiva',
    summary:
      'Comunidade tradicional passou a levar hortaliças, plantas medicinais, quitandas e artesanato ao Varejão de Contagem.',
    content:
      'A Comunidade Quilombola dos Arturos iniciou sua participação comercial no Varejão do entreposto de Contagem, ampliando o acesso do público à produção agrícola, às quitandas e ao artesanato da comunidade.\n\nA ação integra o projeto Caminhos da Inclusão, previsto no planejamento estratégico da CeasaMinas. O projeto facilita o acesso de quilombos, assentamentos, agricultura urbana e periurbana e povos originários aos espaços de comercialização.\n\nA matéria completa pode ser consultada no site oficial.',
    sourceUrl: 'https://www.ceasaminas.com.br/noticiageral.asp?codigonoticia=5543',
    imageUrl: '/images/news/arturos.svg',
    publishedAt: new Date('2025-10-15T12:00:00.000Z'),
  },
].map((article) => ({
  ...article,
  status: 'PUBLISHED',
}));

try {
  const result = await prisma.$transaction(async (tx) => {
    const removed = await tx.newsArticle.deleteMany();
    const inserted = await tx.newsArticle.createMany({ data: officialNews });

    return {
      removed: removed.count,
      inserted: inserted.count,
    };
  });

  console.log(
    `Notícias substituídas com sucesso: ${result.removed} removidas e ${result.inserted} oficiais adicionadas.`,
  );
} finally {
  await prisma.$disconnect();
}
