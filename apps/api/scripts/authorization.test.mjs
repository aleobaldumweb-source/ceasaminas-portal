import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const [{ Role }, { ROLES_KEY }, { JwtAuthGuard }, { RolesGuard }] = await Promise.all([
  import('../dist/auth/auth.types.js'),
  import('../dist/auth/decorators/roles.decorator.js'),
  import('../dist/auth/guards/jwt-auth.guard.js'),
  import('../dist/auth/guards/roles.guard.js'),
]);
const [
  { MarketImportController },
  { NewsController },
  { ProcurementsController },
  { TransparencyController },
  { UsersController },
] = await Promise.all([
  import('../dist/market/import/market-import.controller.js'),
  import('../dist/news/news.controller.js'),
  import('../dist/procurement/procurements.controller.js'),
  import('../dist/transparency/transparency.controller.js'),
  import('../dist/users/users.controller.js'),
]);

function executionContext(user) {
  return {
    getHandler: () => 'handler',
    getClass: () => 'controller',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
}

function assertPolicy(controller, methodName, expectedRoles) {
  const handler = controller.prototype[methodName];
  const roles = Reflect.getMetadata(ROLES_KEY, handler);
  const guards = Reflect.getMetadata(GUARDS_METADATA, handler);

  assert.deepEqual(roles, expectedRoles);
  assert.deepEqual(guards, [JwtAuthGuard, RolesGuard]);
}

function assertControllerPolicy(controller, expectedRoles) {
  assert.deepEqual(Reflect.getMetadata(ROLES_KEY, controller), expectedRoles);
  assert.deepEqual(Reflect.getMetadata(GUARDS_METADATA, controller), [JwtAuthGuard, RolesGuard]);
}

describe('RolesGuard', () => {
  it('permite rotas sem restrição de perfil', () => {
    const reflector = { getAllAndOverride: () => undefined };
    const guard = new RolesGuard(reflector);

    assert.equal(guard.canActivate(executionContext(undefined)), true);
  });

  it('rejeita requisições anônimas em rotas restritas', () => {
    const reflector = { getAllAndOverride: () => [Role.ADMIN] };
    const guard = new RolesGuard(reflector);

    assert.equal(guard.canActivate(executionContext(undefined)), false);
  });

  it('aceita somente perfis declarados pela rota', () => {
    const reflector = { getAllAndOverride: () => [Role.ADMIN, Role.EDITOR] };
    const guard = new RolesGuard(reflector);

    assert.equal(guard.canActivate(executionContext({ role: Role.EDITOR })), true);
    assert.equal(guard.canActivate(executionContext({ role: Role.AUDITOR })), false);
  });
});

describe('políticas dos controllers administrativos', () => {
  it('restringe escrita de notícias e reserva exclusão para administradores', () => {
    const writers = [Role.ADMIN, Role.EDITOR, Role.JOURNALIST];

    assertPolicy(NewsController, 'create', writers);
    assertPolicy(NewsController, 'uploadImage', writers);
    assertPolicy(NewsController, 'removeImage', writers);
    assertPolicy(NewsController, 'update', writers);
    assertPolicy(NewsController, 'remove', [Role.ADMIN]);
  });

  it('separa importação e leitura do histórico de mercado', () => {
    assertPolicy(MarketImportController, 'importBulletin', [Role.ADMIN, Role.EDITOR]);
    assertPolicy(MarketImportController, 'listImports', [
      Role.ADMIN,
      Role.EDITOR,
      Role.JOURNALIST,
      Role.AUDITOR,
    ]);
  });

  it('reserva toda a administração de usuários ao perfil administrador', () => {
    assertControllerPolicy(UsersController, [Role.ADMIN]);
  });

  it('protege escrita e documentos de licitações por perfil', () => {
    const editors = [Role.ADMIN, Role.EDITOR];

    assertPolicy(ProcurementsController, 'findAdmin', [Role.ADMIN, Role.EDITOR, Role.AUDITOR]);
    assertPolicy(ProcurementsController, 'create', editors);
    assertPolicy(ProcurementsController, 'update', editors);
    assertPolicy(ProcurementsController, 'upload', editors);
    assertPolicy(ProcurementsController, 'removeDocument', editors);
    assertPolicy(ProcurementsController, 'remove', [Role.ADMIN]);
  });

  it('permite leitura administrativa e restringe a gestão de transparência', () => {
    const editors = [Role.ADMIN, Role.EDITOR];

    assertPolicy(TransparencyController, 'findAdmin', [Role.ADMIN, Role.EDITOR, Role.AUDITOR]);
    assertPolicy(TransparencyController, 'create', editors);
    assertPolicy(TransparencyController, 'update', editors);
    assertPolicy(TransparencyController, 'remove', [Role.ADMIN]);
  });
});
