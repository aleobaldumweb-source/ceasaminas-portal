import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getConfirmedPassword, validatePassword } from './secret-prompt.mjs';

const originalPassword = process.env.CEASA_ADMIN_PASSWORD;

afterEach(() => {
  if (originalPassword === undefined) {
    delete process.env.CEASA_ADMIN_PASSWORD;
    return;
  }

  process.env.CEASA_ADMIN_PASSWORD = originalPassword;
});

describe('credenciais administrativas', () => {
  it('obtém a senha pelo ambiente em execuções automatizadas', async () => {
    process.env.CEASA_ADMIN_PASSWORD = 'uma-senha-segura';

    await assert.doesNotReject(async () => {
      const password = await getConfirmedPassword();
      assert.equal(password, 'uma-senha-segura');
    });
  });

  it('rejeita senhas com menos de 12 caracteres', () => {
    assert.throws(() => validatePassword('curta'), /pelo menos 12 caracteres/);
  });

  it('aceita senhas a partir de 12 caracteres', () => {
    assert.doesNotThrow(() => validatePassword('123456789012'));
  });
});
