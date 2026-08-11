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
    controller.checkRedis = async () => undefined;
    controller.checkUploads = async () => undefined;

    const result = await controller.check();

    assert.equal(result.status, 'ok');
    assert.deepEqual(result.checks, { database: 'ok', redis: 'ok', uploads: 'ok' });
  });

  it('responde indisponível sem expor o erro interno de uma dependência', async () => {
    const controller = new HealthController();
    controller.checkDatabase = async () => {
      throw new Error('segredo interno da conexão');
    };
    controller.checkRedis = async () => undefined;
    controller.checkUploads = async () => undefined;

    await assert.rejects(
      () => controller.check(),
      (error) => {
        assert.equal(error.getStatus(), 503);
        const response = error.getResponse();
        assert.equal(response.status, 'unavailable');
        assert.deepEqual(response.checks, {
          database: 'unavailable',
          redis: 'ok',
          uploads: 'ok',
        });
        assert.equal(JSON.stringify(response).includes('segredo interno'), false);
        return true;
      },
    );
  });

  it('marca a prontidão como indisponível quando o Redis falha', async () => {
    const controller = new HealthController();
    controller.checkDatabase = async () => undefined;
    controller.checkRedis = async () => {
      throw new Error('credencial interna');
    };
    controller.checkUploads = async () => undefined;

    await assert.rejects(
      () => controller.check(),
      (error) => {
        assert.equal(error.getStatus(), 503);
        const response = error.getResponse();
        assert.deepEqual(response.checks, {
          database: 'ok',
          redis: 'unavailable',
          uploads: 'ok',
        });
        assert.equal(JSON.stringify(response).includes('credencial interna'), false);
        return true;
      },
    );
  });
});
