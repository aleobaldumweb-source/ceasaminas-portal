import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, it } from 'node:test';
import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const enabled = process.env.RUN_DATABASE_TESTS === 'true';
const databaseTest = enabled ? it : it.skip;
const [{ prisma }, { NewsService }] = enabled
  ? await Promise.all([import('@ceasaminas/database'), import('../dist/news/news.service.js')])
  : [{ prisma: undefined }, { NewsService: undefined }];

const createdIds = [];

after(async () => {
  if (!prisma) return;
  if (createdIds.length) {
    await prisma.newsArticle.deleteMany({ where: { id: { in: createdIds } } });
  }
  await prisma.$disconnect();
});

describe('persistência de notícias', () => {
  databaseTest('cria, publica, consulta e remove uma notícia no PostgreSQL', async () => {
    const service = new NewsService();
    const suffix = randomUUID();
    const slug = `teste-integracao-${suffix}`;
    const created = await service.create({
      title: `Teste de integração ${suffix}`,
      slug,
      category: 'Institucional',
      summary: 'Registro temporário criado pela validação automatizada.',
      content: 'Conteúdo temporário do teste de integração com PostgreSQL.',
      status: 'DRAFT',
    });
    createdIds.push(created.id);

    const published = await service.update(created.id, { status: 'PUBLISHED' });
    assert.equal(published.status, 'PUBLISHED');
    assert.ok(published.publishedAt instanceof Date);

    const found = await service.findPublishedBySlug(slug);
    assert.equal(found.id, created.id);

    await service.remove(created.id);
    createdIds.splice(createdIds.indexOf(created.id), 1);
    assert.equal(await prisma.newsArticle.findUnique({ where: { id: created.id } }), null);
  });
});
