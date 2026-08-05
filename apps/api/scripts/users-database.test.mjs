import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, it } from 'node:test';
import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const enabled = process.env.RUN_DATABASE_TESTS === 'true';
const databaseTest = enabled ? it : it.skip;
const [{ prisma }, { UsersService }] = enabled
  ? await Promise.all([import('@ceasaminas/database'), import('../dist/users/users.service.js')])
  : [{ prisma: undefined }, { UsersService: undefined }];

let actorId;
let targetId;

after(async () => {
  if (!prisma) return;
  if (targetId) {
    await prisma.authSession.deleteMany({ where: { userId: targetId } });
    await prisma.auditLog.deleteMany({ where: { resourceId: targetId } });
    await prisma.user.deleteMany({ where: { id: targetId } });
  }
  if (actorId) await prisma.user.deleteMany({ where: { id: actorId } });
  await prisma.$disconnect();
});

describe('persistência de usuários', () => {
  databaseTest('cria usuário e revoga suas sessões ao trocar a senha', async () => {
    const suffix = randomUUID();
    const actor = await prisma.user.create({
      data: {
        name: 'Administrador de integração',
        email: `users-admin-${suffix}@ceasaminas.test`,
        passwordHash: 'hash-inutilizado-no-teste-de-usuarios',
        role: 'ADMIN',
      },
    });
    actorId = actor.id;
    const service = new UsersService();
    const authUser = { id: actor.id, role: 'ADMIN' };

    const target = await service.create(
      {
        name: 'Editor de integração',
        email: `users-target-${suffix}@ceasaminas.test`,
        password: `senha-inicial-${suffix}`,
        role: 'EDITOR',
      },
      authUser,
    );
    targetId = target.id;

    const session = await prisma.authSession.create({
      data: {
        userId: target.id,
        refreshTokenHash: `hash-${suffix}`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await service.update(target.id, { password: `senha-alterada-${suffix}` }, authUser);
    const revokedSession = await prisma.authSession.findUnique({ where: { id: session.id } });
    assert.ok(revokedSession?.revokedAt instanceof Date);

    const blocked = await service.update(target.id, { status: 'BLOCKED' }, authUser);
    assert.equal(blocked.status, 'BLOCKED');

    const auditActions = await prisma.auditLog.findMany({
      where: { resourceId: target.id },
      orderBy: { createdAt: 'asc' },
      select: { action: true, metadata: true },
    });
    assert.deepEqual(
      auditActions.map(({ action }) => action),
      ['USER_CREATED', 'USER_UPDATED', 'USER_UPDATED'],
    );
    assert.equal(auditActions[1].metadata.passwordChanged, true);
  });
});
