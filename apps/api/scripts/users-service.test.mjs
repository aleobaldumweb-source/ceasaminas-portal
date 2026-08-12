import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const [{ prisma }, { UsersService }] = await Promise.all([
  import('@ceasaminas/database'),
  import('../dist/users/users.service.js'),
]);

const originalFindUnique = prisma.user.findUnique;
const originalFindFirst = prisma.user.findFirst;
const originalTransaction = prisma.$transaction;

afterEach(() => {
  prisma.user.findUnique = originalFindUnique;
  prisma.user.findFirst = originalFindFirst;
  prisma.$transaction = originalTransaction;
});

describe('UsersService', () => {
  it('revoga sessões ao alterar a senha e não registra a credencial', async () => {
    prisma.user.findUnique = async () => ({ id: 'user-1' });

    let sessionUpdate;
    let auditEntry;
    const updatedUser = {
      id: 'user-1',
      name: 'Usuário',
      email: 'usuario@ceasaminas.com.br',
      role: 'JOURNALIST',
      status: 'ACTIVE',
    };
    prisma.$transaction = async (operation) =>
      operation({
        user: { update: async () => updatedUser },
        auditLog: {
          create: async ({ data }) => {
            auditEntry = data;
          },
        },
        authSession: {
          updateMany: async (query) => {
            sessionUpdate = query;
            return { count: 2 };
          },
        },
      });

    const service = new UsersService();
    const result = await service.update(
      'user-1',
      { password: 'senha-segura-123' },
      { id: 'admin-1', role: 'ADMIN' },
    );

    assert.equal(result, updatedUser);
    assert.deepEqual(sessionUpdate.where, { userId: 'user-1', revokedAt: null });
    assert.equal(auditEntry.metadata.passwordChanged, true);
    assert.equal(JSON.stringify(auditEntry).includes('senha-segura-123'), false);
  });

  it('impede que o administrador remova o próprio perfil', async () => {
    prisma.user.findUnique = async () => ({ id: 'admin-1' });
    const service = new UsersService();

    await assert.rejects(
      () => service.update('admin-1', { role: 'EDITOR' }, { id: 'admin-1', role: 'ADMIN' }),
      /Não é permitido remover o próprio perfil de administrador/,
    );
  });

  it('impede que o administrador bloqueie a própria conta', async () => {
    prisma.user.findUnique = async () => ({ id: 'admin-1' });
    const service = new UsersService();

    await assert.rejects(
      () => service.update('admin-1', { status: 'BLOCKED' }, { id: 'admin-1', role: 'ADMIN' }),
      /Não é permitido bloquear ou inativar a própria conta/,
    );
  });

  it('converte conflito concorrente de e-mail em resposta previsível', async () => {
    prisma.user.findUnique = async () => null;
    prisma.$transaction = async () => {
      throw { code: 'P2002' };
    };
    const service = new UsersService();

    await assert.rejects(
      () =>
        service.create(
          {
            name: 'Usuário',
            email: 'usuario@ceasaminas.com.br',
            password: 'senha-segura-123',
            role: 'JOURNALIST',
          },
          { id: 'admin-1', role: 'ADMIN' },
        ),
      /Já existe um usuário com esse e-mail/,
    );
  });
});
