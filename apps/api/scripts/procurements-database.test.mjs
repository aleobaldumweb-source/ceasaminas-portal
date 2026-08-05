import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, it } from 'node:test';
import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const enabled = process.env.RUN_DATABASE_TESTS === 'true';
const databaseTest = enabled ? it : it.skip;
const [{ prisma }, { ProcurementsService }] = enabled
  ? await Promise.all([
      import('@ceasaminas/database'),
      import('../dist/procurement/procurements.service.js'),
    ])
  : [{ prisma: undefined }, { ProcurementsService: undefined }];

let actorId;
let procurementId;

after(async () => {
  if (!prisma) return;
  if (procurementId) {
    await prisma.procurement.deleteMany({ where: { id: procurementId } });
    await prisma.auditLog.deleteMany({ where: { resourceId: procurementId } });
  }
  if (actorId) await prisma.user.deleteMany({ where: { id: actorId } });
  await prisma.$disconnect();
});

describe('persistência de licitações', () => {
  databaseTest('mantém publicação e auditoria durante todo o ciclo no PostgreSQL', async () => {
    const suffix = randomUUID();
    const actor = await prisma.user.create({
      data: {
        name: 'Administrador de integração',
        email: `integration-${suffix}@ceasaminas.test`,
        passwordHash: 'hash-inutilizado-no-teste-de-persistencia',
        role: 'ADMIN',
      },
    });
    actorId = actor.id;
    const authUser = { id: actor.id, role: 'ADMIN' };
    const service = new ProcurementsService();

    const created = await service.create(
      {
        number: `INT-${suffix}`,
        title: 'Licitação temporária de integração',
        description: 'Registro temporário criado para validar persistência e auditoria.',
        modality: 'PREGAO_ELETRONICO',
        status: 'DRAFT',
      },
      authUser,
    );
    procurementId = created.id;

    const published = await service.update(
      created.id,
      { status: 'OPEN', publishedAt: new Date().toISOString() },
      authUser,
    );
    assert.equal(published.status, 'OPEN');

    const publicItem = await service.findPublishedById(created.id);
    assert.equal(publicItem?.id, created.id);

    await service.remove(created.id, authUser);
    assert.equal(await prisma.procurement.findUnique({ where: { id: created.id } }), null);

    const auditActions = await prisma.auditLog.findMany({
      where: { resourceId: created.id },
      orderBy: { createdAt: 'asc' },
      select: { action: true },
    });
    assert.deepEqual(
      auditActions.map(({ action }) => action),
      ['PROCUREMENT_CREATED', 'PROCUREMENT_UPDATED', 'PROCUREMENT_DELETED'],
    );
  });
});
