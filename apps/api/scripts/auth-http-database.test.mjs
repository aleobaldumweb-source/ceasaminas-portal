import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, describe, it } from 'node:test';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { hash } from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

config({ path: resolve(process.cwd(), '../../.env'), quiet: true });
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';
process.env.JWT_ACCESS_SECRET = 'access-secret-for-http-database-integration';
process.env.JWT_REFRESH_SECRET = 'refresh-secret-for-http-database-integration';
process.env.API_PREFIX = 'integration/v2';

const enabled = process.env.RUN_DATABASE_TESTS === 'true';
const databaseTest = enabled ? it : it.skip;
const [{ prisma }, { AppModule }] = enabled
  ? await Promise.all([import('@ceasaminas/database'), import('../dist/app.module.js')])
  : [{ prisma: undefined }, { AppModule: undefined }];

let app;
let baseUrl;
let userId;
let email;
let password;

before(async () => {
  if (!enabled) return;
  const suffix = randomUUID();
  email = `auth-http-${suffix}@ceasaminas.test`;
  password = `senha-http-${suffix}`;
  const user = await prisma.user.create({
    data: {
      name: 'Usuário HTTP de integração',
      email,
      passwordHash: await hash(password, 4),
      role: 'EDITOR',
    },
  });
  userId = user.id;

  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('integration/v2');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  await app.listen(0, '127.0.0.1');
  const address = app.getHttpServer().address();
  baseUrl = `http://127.0.0.1:${address.port}/integration/v2/auth`;
});

after(async () => {
  await app?.close();
  if (!prisma) return;
  if (userId) {
    await prisma.authSession.deleteMany({ where: { userId } });
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
});

describe('autenticação HTTP persistida', () => {
  databaseTest('respeita o prefixo no cookie e revoga o acesso após logout', async () => {
    const loginResponse = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    assert.equal(loginResponse.status, 200);
    const login = await loginResponse.json();
    const loginCookie = loginResponse.headers.get('set-cookie');
    assert.match(loginCookie, /ceasa_refresh_token=/);
    assert.match(loginCookie, /Path=\/integration\/v2\/auth/);
    assert.match(loginCookie, /HttpOnly/);
    const cookie = loginCookie.split(';', 1)[0];

    const meResponse = await fetch(`${baseUrl}/me`, {
      headers: { authorization: `Bearer ${login.accessToken}` },
    });
    assert.equal(meResponse.status, 200);

    const refreshResponse = await fetch(`${baseUrl}/refresh`, {
      method: 'POST',
      headers: { cookie },
    });
    assert.equal(refreshResponse.status, 200);
    const refreshed = await refreshResponse.json();

    const logoutResponse = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: { authorization: `Bearer ${refreshed.accessToken}` },
    });
    assert.equal(logoutResponse.status, 200);
    assert.match(logoutResponse.headers.get('set-cookie'), /Path=\/integration\/v2\/auth/);

    const revokedResponse = await fetch(`${baseUrl}/me`, {
      headers: { authorization: `Bearer ${refreshed.accessToken}` },
    });
    assert.equal(revokedResponse.status, 401);
  });
});
