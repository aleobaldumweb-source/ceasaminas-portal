import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const { apiPort, apiPrefix, apiPublicUrl, authCookiePath, corsOrigins } =
  await import('../dist/config/runtime-config.js');

describe('configuração de runtime', () => {
  it('normaliza o prefixo configurado', () => {
    assert.equal(apiPrefix({ API_PREFIX: ' /servicos/v2/ ' }), 'servicos/v2');
    assert.equal(authCookiePath({ API_PREFIX: ' /servicos/v2/ ' }), '/servicos/v2/auth');
    assert.throws(() => apiPrefix({ API_PREFIX: '///' }), /API_PREFIX/);
  });

  it('valida a porta antes de iniciar a API', () => {
    assert.equal(apiPort({ API_PORT: '8080' }), 8080);
    assert.throws(() => apiPort({ API_PORT: 'abc' }), /API_PORT/);
    assert.throws(() => apiPort({ API_PORT: '70000' }), /API_PORT/);
  });

  it('exige uma URL pública válida em produção', () => {
    assert.equal(
      apiPublicUrl({ API_PUBLIC_URL: 'https://api.ceasaminas.com.br/' }),
      'https://api.ceasaminas.com.br',
    );
    assert.equal(apiPublicUrl({ API_PORT: '4444' }), 'http://localhost:4444');
    assert.throws(() => apiPublicUrl({ NODE_ENV: 'production' }), /API_PUBLIC_URL/);
    assert.throws(
      () => apiPublicUrl({ API_PUBLIC_URL: 'https://api.ceasaminas.com.br/caminho' }),
      /API_PUBLIC_URL inválida/,
    );
  });

  it('usa todas as origens CORS configuradas sem duplicação', () => {
    assert.deepEqual(
      corsOrigins({
        CORS_ORIGINS:
          'https://portal.ceasaminas.com.br/, https://admin.ceasaminas.com.br, https://portal.ceasaminas.com.br',
      }),
      ['https://portal.ceasaminas.com.br', 'https://admin.ceasaminas.com.br'],
    );
  });

  it('rejeita origens CORS com caminho ou protocolo não HTTP', () => {
    assert.throws(
      () => corsOrigins({ CORS_ORIGINS: 'https://ceasaminas.com.br/caminho' }),
      /Origem CORS inválida/,
    );
    assert.throws(
      () => corsOrigins({ CORS_ORIGINS: 'javascript:alert(1)' }),
      /Origem CORS inválida/,
    );
  });
});
