import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '../../.env') });

const { prisma } = await import('@ceasaminas/database');

const imageBySlug = new Map([
  ['acordo-ceasaminas-mpmg-prorrogacao-contratos-lojistas', '/images/news/acordo-mpmg.svg'],
  ['ceasaminas-41-congresso-mineiro-municipios', '/images/news/congresso-municipios.svg'],
  ['prodal-sete-motivos-doador-2026', '/images/news/prodal-doadores.svg'],
  ['prodal-rede-brasileira-bancos-alimentos', '/images/news/prodal-rede.svg'],
  ['quilombo-arturos-comercializa-ceasaminas', '/images/news/arturos.svg'],
]);

try {
  const updated = await prisma.$transaction(async (tx) => {
    const results = await Promise.all(
      [...imageBySlug].map(([slug, imageUrl]) =>
        tx.newsArticle.updateMany({
          where: { slug },
          data: { imageUrl },
        }),
      ),
    );

    const count = results.reduce((total, result) => total + result.count, 0);

    if (count !== imageBySlug.size) {
      throw new Error(
        `Esperadas ${imageBySlug.size} notícias oficiais, mas ${count} foram encontradas.`,
      );
    }

    return count;
  });

  console.log(`${updated} imagens de notícias atualizadas com sucesso.`);
} finally {
  await prisma.$disconnect();
}
