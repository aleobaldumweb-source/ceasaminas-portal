import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { DirectoryAuthService } from '../dist/auth/directory-auth.service.js';

const originalEnvironment = { ...process.env };
afterEach(() => {
  for (const key of Object.keys(process.env))
    if (!(key in originalEnvironment)) delete process.env[key];
  Object.assign(process.env, originalEnvironment);
});

function configure() {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    AD_ENABLED: 'true',
    AD_URL: 'ldap://directory.test:389',
    AD_BIND_DN: 'CN=service,DC=directory,DC=test',
    AD_BIND_PASSWORD: 'service-password',
    AD_BASE_DN: 'DC=directory,DC=test',
    AD_USER_FILTER: '(userPrincipalName={email})',
    AD_ADMIN_GROUP: 'CN=Portal Admins,OU=Groups,DC=directory,DC=test',
    AD_TIMEOUT_MS: '1000',
  });
}

describe('autenticação no Active Directory', () => {
  it('faz bind, escapa filtro e mapeia grupo', async () => {
    configure();
    const calls = [];
    const service = new DirectoryAuthService(() => ({
      bind: async (...args) => calls.push(['bind', ...args]),
      search: async (base, options) => {
        calls.push(['search', base, options]);
        return {
          searchReferences: [],
          searchEntries: [
            {
              dn: 'CN=Usuário,OU=People,DC=directory,DC=test',
              objectGUID: Buffer.from('00112233445566778899aabbccddeeff', 'hex'),
              mail: 'usuario@directory.test',
              displayName: 'Usuário Institucional',
              memberOf: [process.env.AD_ADMIN_GROUP],
            },
          ],
        };
      },
      unbind: async () => calls.push(['unbind']),
    }));
    const identity = await service.authenticate('usuario*)(mail=*)@directory.test', 'password');
    assert.deepEqual(identity, {
      directoryId: '33221100-5544-7766-8899-aabbccddeeff',
      email: 'usuario@directory.test',
      name: 'Usuário Institucional',
      role: 'ADMIN',
    });
    assert.match(calls[1][2].filter, /usuario\\2a\\29\\28mail=\\2a\\29@directory\.test/);
    assert.deepEqual(calls[2], ['bind', 'CN=Usuário,OU=People,DC=directory,DC=test', 'password']);
    assert.deepEqual(calls.at(-1), ['unbind']);
  });

  it('recusa usuário sem grupo autorizado antes do bind pessoal', async () => {
    configure();
    let binds = 0;
    const service = new DirectoryAuthService(() => ({
      bind: async () => {
        binds += 1;
      },
      search: async () => ({
        searchReferences: [],
        searchEntries: [{ dn: 'CN=User,DC=test', memberOf: [] }],
      }),
      unbind: async () => undefined,
    }));
    assert.equal(await service.authenticate('user@directory.test', 'password'), null);
    assert.equal(binds, 1);
  });

  it('trata credencial inválida como autenticação recusada', async () => {
    configure();
    const service = new DirectoryAuthService(() => ({
      bind: async () => {
        const error = new Error('invalid');
        error.code = 49;
        throw error;
      },
      search: async () => ({ searchReferences: [], searchEntries: [] }),
      unbind: async () => undefined,
    }));
    assert.equal(await service.authenticate('user@directory.test', 'invalid'), null);
  });

  it('exige LDAPS em produção', async () => {
    configure();
    process.env.NODE_ENV = 'production';
    const service = new DirectoryAuthService(() => {
      throw new Error('cliente inesperado');
    });
    await assert.rejects(() => service.authenticate('user@directory.test', 'password'), /ldaps/);
  });
});
