import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, it } from 'node:test';
import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const enabled = process.env.RUN_DATABASE_TESTS === 'true';
const databaseTest = enabled ? it : it.skip;
const [{ prisma }, { MarketImportService }, { MarketService }] = enabled
  ? await Promise.all([
      import('@ceasaminas/database'),
      import('../dist/market/import/market-import.service.js'),
      import('../dist/market/market.service.js'),
    ])
  : [{ prisma: undefined }, { MarketImportService: undefined }, { MarketService: undefined }];

const bulletinIds = [];

after(async () => {
  if (!prisma) return;
  if (bulletinIds.length) {
    await prisma.marketBulletin.deleteMany({ where: { id: { in: bulletinIds } } });
  }
  await prisma.$disconnect();
});

describe('persistência de mercado', () => {
  databaseTest('importa boletins, calcula variação e impede duplicidade', async () => {
    const suffix = randomUUID();
    const market = `Mercado integração ${suffix}`;
    const parser = {
      parse(buffer) {
        const current = buffer.toString() === 'current';
        return {
          market,
          referenceAt: new Date(current ? '2026-08-05T00:00:00.000Z' : '2026-08-04T00:00:00.000Z'),
          rows: [
            {
              category: 'Hortaliças',
              subgroup: 'Frutos',
              productCode: suffix,
              productName: `Tomate integração ${suffix}`,
              normalizedProduct: `tomate integracao ${suffix}`,
              unit: 'kg',
              minPrice: current ? 11 : 9,
              avgPrice: current ? 12 : 10,
              maxPrice: current ? 13 : 11,
            },
          ],
        };
      },
    };
    const importer = new MarketImportService(parser);
    const previous = await importer.import({
      originalname: `previous-${suffix}.xlsx`,
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 8,
      buffer: Buffer.from('previous'),
    });
    bulletinIds.push(previous.bulletinId);
    const currentFile = {
      originalname: `current-${suffix}.xlsx`,
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 7,
      buffer: Buffer.from('current'),
    };
    const current = await importer.import(currentFile);
    bulletinIds.push(current.bulletinId);

    const prices = await new MarketService().getLatestPrices(suffix);
    assert.equal(prices.total, 1);
    assert.equal(prices.items[0].avgPrice, 12);
    assert.equal(prices.items[0].variation, 20);

    await assert.rejects(() => importer.import(currentFile), /já foi importado/);
    assert.equal(await prisma.marketBulletin.count({ where: { market } }), 2);
  });
});
