import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/ceasaminas';

const { HealthController } = await import('../dist/health/health.controller.js');

describe('HealthController', () => {
  it('mantém uma sonda de processo independente das dependências', () => {
    const result = new HealthController().live();

    assert.equal(result.status, 'ok');
    assert.equal(result.service, 'ceasaminas-api');
  });

  it('informa prontidão somente quando todas as dependências respondem', async () => {
    const controller = new HealthController();
    controller.checkDatabase = async () => undefined;
    controller.checkUploads = async () => undefined;

    const result = await controller.check();

    assert.equal(result.status, 'ok');
    assert.deepEqual(result.checks, { database: 'ok', uploads: 'ok' });
  });

  it('responde indisponível sem expor o erro interno de uma dependência', async () => {
    const controller = new HealthController();
    controller.checkDatabase = async () => {
      throw new Error('segredo interno da conexão');
    };
    controller.checkUploads = async () => undefined;

    await assert.rejects(
      () => controller.check(),
      (error) => {
        assert.equal(error.getStatus(), 503);
        const response = error.getResponse();
        assert.equal(response.status, 'unavailable');
        assert.deepEqual(response.checks, { database: 'unavailable', uploads: 'ok' });
        assert.equal(JSON.stringify(response).includes('segredo interno'), false);
        return true;
      },
    );
  });
});
