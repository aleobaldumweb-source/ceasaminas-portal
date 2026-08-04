import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validate } from 'class-validator';
import { Role } from '../dist/auth/auth.types.js';
import { CreateUserDto } from '../dist/users/dto/create-user.dto.js';
import { UpdateUserDto } from '../dist/users/dto/update-user.dto.js';

async function passwordErrors(dto) {
  const errors = await validate(dto);
  return errors.filter((error) => error.property === 'password');
}

describe('política de senha de usuários', () => {
  it('rejeita senha com menos de 12 caracteres na criação', async () => {
    const dto = new CreateUserDto();
    dto.name = 'Usuário Teste';
    dto.email = 'usuario@ceasaminas.com.br';
    dto.password = '12345678901';
    dto.role = Role.JOURNALIST;

    assert.equal((await passwordErrors(dto)).length, 1);
  });

  it('aceita senha com 12 caracteres na criação', async () => {
    const dto = new CreateUserDto();
    dto.name = 'Usuário Teste';
    dto.email = 'usuario@ceasaminas.com.br';
    dto.password = '123456789012';
    dto.role = Role.JOURNALIST;

    assert.equal((await passwordErrors(dto)).length, 0);
  });

  it('aplica a mesma política quando a senha é alterada', async () => {
    const invalid = new UpdateUserDto();
    invalid.password = '12345678901';
    const valid = new UpdateUserDto();
    valid.password = '123456789012';

    assert.equal((await passwordErrors(invalid)).length, 1);
    assert.equal((await passwordErrors(valid)).length, 0);
  });
});
