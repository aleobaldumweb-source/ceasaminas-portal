import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';
process.env.JWT_ACCESS_SECRET ??= 'integration-test-secret-with-at-least-32-characters';

const [{ prisma }, { JwtStrategy }] = await Promise.all([
  import('@ceasaminas/database'),
  import('../dist/auth/strategies/jwt.strategy.js'),
]);

const originalFindFirst = prisma.authSession.findFirst;

afterEach(() => {
  prisma.authSession.findFirst = originalFindFirst;
});

describe('JwtStrategy', () => {
  it('aceita somente uma sessão ativa vinculada ao usuário do token', async () => {
    const expectedUser = {
      id: 'user-1',
      email: 'admin@ceasaminas.com.br',
      name: 'Administrador',
      role: 'ADMIN',
    };
    let receivedQuery;
    prisma.authSession.findFirst = async (query) => {
      receivedQuery = query;
      return { id: 'session-1', user: expectedUser };
    };

    const strategy = new JwtStrategy();
    const user = await strategy.validate({ sub: 'user-1', sessionId: 'session-1' });

    assert.deepEqual(user, { ...expectedUser, sessionId: 'session-1' });
    assert.equal(receivedQuery.where.id, 'session-1');
    assert.equal(receivedQuery.where.userId, 'user-1');
    assert.equal(receivedQuery.where.revokedAt, null);
    assert.deepEqual(receivedQuery.where.user, { status: 'ACTIVE' });
    assert.ok(receivedQuery.where.expiresAt.gt instanceof Date);
  });

  it('rejeita token cuja sessão foi revogada, expirou ou não existe', async () => {
    prisma.authSession.findFirst = async () => null;

    const strategy = new JwtStrategy();

    await assert.rejects(
      () => strategy.validate({ sub: 'user-1', sessionId: 'session-1' }),
      /Sessão inválida, expirada ou revogada/,
    );
  });
});
