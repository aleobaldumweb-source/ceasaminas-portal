import 'reflect-metadata';
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Controller, Get, Injectable, Module, UseGuards } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../dist/auth/auth.types.js';
import { Roles } from '../dist/auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../dist/auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../dist/auth/guards/roles.guard.js';

const JWT_SECRET = 'integration-test-secret-with-at-least-32-characters';

class TestJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  validate(payload) {
    return payload;
  }
}
Injectable()(TestJwtStrategy);

class AuthorizationTestController {
  public() {
    return { access: 'public' };
  }

  admin() {
    return { access: 'admin' };
  }
}
Controller('authorization-test')(AuthorizationTestController);

const publicDescriptor = Object.getOwnPropertyDescriptor(
  AuthorizationTestController.prototype,
  'public',
);
Get('public')(AuthorizationTestController.prototype, 'public', publicDescriptor);

const adminDescriptor = Object.getOwnPropertyDescriptor(
  AuthorizationTestController.prototype,
  'admin',
);
Get('admin')(AuthorizationTestController.prototype, 'admin', adminDescriptor);
Roles(Role.ADMIN)(AuthorizationTestController.prototype, 'admin', adminDescriptor);
UseGuards(JwtAuthGuard, RolesGuard)(
  AuthorizationTestController.prototype,
  'admin',
  adminDescriptor,
);

class AuthorizationTestModule {}
Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthorizationTestController],
  providers: [TestJwtStrategy, JwtAuthGuard, RolesGuard],
})(AuthorizationTestModule);

describe('autorização HTTP', () => {
  let app;
  let baseUrl;
  const jwt = new JwtService({ secret: JWT_SECRET });

  before(async () => {
    app = await NestFactory.create(AuthorizationTestModule, { logger: false });
    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}/authorization-test`;
  });

  after(async () => {
    await app?.close();
  });

  it('mantém rotas públicas acessíveis sem credenciais', async () => {
    const response = await fetch(`${baseUrl}/public`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { access: 'public' });
  });

  it('responde 401 quando a credencial está ausente', async () => {
    const response = await fetch(`${baseUrl}/admin`);

    assert.equal(response.status, 401);
  });

  it('responde 403 quando o perfil autenticado não é permitido', async () => {
    const token = jwt.sign({ sub: 'auditor', role: Role.AUDITOR });
    const response = await fetch(`${baseUrl}/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 403);
  });

  it('responde 200 quando o perfil possui autorização', async () => {
    const token = jwt.sign({ sub: 'admin', role: Role.ADMIN });
    const response = await fetch(`${baseUrl}/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { access: 'admin' });
  });
});
