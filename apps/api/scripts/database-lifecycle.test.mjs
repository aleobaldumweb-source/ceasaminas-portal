import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const [{ prisma }, { DatabaseLifecycleService }] = await Promise.all([
  import('@ceasaminas/database'),
  import('../dist/database-lifecycle.service.js'),
]);
const originalDisconnect = prisma.$disconnect;

afterEach(() => {
  prisma.$disconnect = originalDisconnect;
});

describe('ciclo de vida do banco', () => {
  it('encerra o pool do Prisma durante o desligamento da aplicação', async () => {
    let disconnected = false;
    prisma.$disconnect = async () => {
      disconnected = true;
    };

    await new DatabaseLifecycleService().onApplicationShutdown();

    assert.equal(disconnected, true);
  });
});
