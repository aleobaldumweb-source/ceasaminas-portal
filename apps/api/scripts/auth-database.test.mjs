import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, describe, it } from 'node:test';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';
process.env.JWT_ACCESS_SECRET = 'access-secret-for-database-integration-tests';
process.env.JWT_REFRESH_SECRET = 'refresh-secret-for-database-integration-tests';

const enabled = process.env.RUN_DATABASE_TESTS === 'true';
const databaseTest = enabled ? it : it.skip;
const [{ prisma }, { AuthService }] = enabled
  ? await Promise.all([import('@ceasaminas/database'), import('../dist/auth/auth.service.js')])
  : [{ prisma: undefined }, { AuthService: undefined }];

let userId;

after(async () => {
  if (!prisma) return;
  if (userId) {
    await prisma.authSession.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
});

describe('persistência de autenticação', () => {
  databaseTest('rotaciona o refresh token e revoga a sessão no logout', async () => {
    const suffix = randomUUID();
    const password = `senha-segura-${suffix}`;
    const user = await prisma.user.create({
      data: {
        name: 'Usuário de integração',
        email: `auth-${suffix}@ceasaminas.test`,
        passwordHash: await hash(password, 4),
        role: 'EDITOR',
      },
    });
    userId = user.id;

    const jwt = new JwtService();
    const service = new AuthService(jwt);
    const meta = { ipAddress: '127.0.0.1', userAgent: 'integration-test' };
    const login = await service.login({ email: user.email, password }, meta);
    const payload = jwt.decode(login.accessToken);

    const rotated = await service.refresh(login.refreshToken, meta);
    assert.notEqual(rotated.refreshToken, login.refreshToken);
    await assert.rejects(() => service.refresh(login.refreshToken, meta), /revogada/);

    await service.logout(user.id, payload.sessionId, meta);
    await assert.rejects(() => service.refresh(rotated.refreshToken, meta), /revogada/);

    const session = await prisma.authSession.findUnique({ where: { id: payload.sessionId } });
    assert.ok(session?.revokedAt instanceof Date);

    const actions = await prisma.auditLog.findMany({
      where: { userId: user.id, resource: 'SESSION' },
      orderBy: { createdAt: 'asc' },
      select: { action: true },
    });
    assert.deepEqual(
      actions.map(({ action }) => action),
      ['AUTH_LOGIN', 'AUTH_LOGOUT'],
    );
  });
});
