import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveRequestId } from '../dist/observability/request-logging.middleware.js';

describe('correlação de requisições', () => {
  it('preserva um identificador válido fornecido pelo proxy', () => {
    assert.equal(resolveRequestId('request-12345678'), 'request-12345678');
  });

  it('substitui valores inválidos sem refletir conteúdo sensível', () => {
    const generated = resolveRequestId('token com espaços e dados?secret=1');
    assert.match(generated, /^[0-9a-f-]{36}$/);
    assert.doesNotMatch(generated, /secret/);
  });

  it('aceita apenas o primeiro valor de cabeçalhos repetidos', () => {
    assert.equal(resolveRequestId(['request-primary', 'request-secondary']), 'request-primary');
  });
});
