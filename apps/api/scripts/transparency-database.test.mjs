import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, it } from 'node:test';
import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const enabled = process.env.RUN_DATABASE_TESTS === 'true';
const databaseTest = enabled ? it : it.skip;
const [{ prisma }, { TransparencyService }] = enabled
  ? await Promise.all([
      import('@ceasaminas/database'),
      import('../dist/transparency/transparency.service.js'),
    ])
  : [{ prisma: undefined }, { TransparencyService: undefined }];

let actorId;
let itemId;

after(async () => {
  if (!prisma) return;
  if (itemId) {
    await prisma.transparencyItem.deleteMany({ where: { id: itemId } });
    await prisma.auditLog.deleteMany({ where: { resourceId: itemId } });
  }
  if (actorId) await prisma.user.deleteMany({ where: { id: actorId } });
  await prisma.$disconnect();
});

describe('persistência de transparência', () => {
  databaseTest('publica, ordena e audita o ciclo completo', async () => {
    const suffix = randomUUID();
    const actor = await prisma.user.create({
      data: {
        name: 'Admin integração',
        email: `transparency-${suffix}@ceasaminas.test`,
        passwordHash: 'hash-inutilizado',
        role: 'ADMIN',
      },
    });
    actorId = actor.id;
    const service = new TransparencyService();
    const authUser = { id: actor.id, role: 'ADMIN' };

    const created = await service.create(
      {
        title: 'Relatório temporário',
        description: 'Documento temporário para o teste de persistência.',
        category: 'Relatórios',
        url: 'https://example.gov.br/relatorio',
        status: 'DRAFT',
        sortOrder: 10,
      },
      authUser,
    );
    itemId = created.id;
    assert.equal(
      (await service.findPublished()).some(({ id }) => id === created.id),
      false,
    );

    await service.update(created.id, { status: 'PUBLISHED' }, authUser);
    assert.equal(
      (await service.findPublished()).some(({ id }) => id === created.id),
      true,
    );

    await service.remove(created.id, authUser);
    assert.equal(await prisma.transparencyItem.findUnique({ where: { id: created.id } }), null);
    const logs = await prisma.auditLog.findMany({
      where: { resourceId: created.id },
      orderBy: { createdAt: 'asc' },
      select: { action: true },
    });
    assert.deepEqual(
      logs.map(({ action }) => action),
      ['TRANSPARENCY_CREATED', 'TRANSPARENCY_UPDATED', 'TRANSPARENCY_DELETED'],
    );
  });
});
