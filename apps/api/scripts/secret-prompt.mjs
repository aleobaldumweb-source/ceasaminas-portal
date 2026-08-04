export async function readSecret(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      'Entrada interativa indisponível. Defina CEASA_ADMIN_PASSWORD no ambiente para automação.',
    );
  }

  process.stdout.write(label);

  return new Promise((resolve, reject) => {
    let value = '';
    const stdin = process.stdin;

    const cleanup = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
    };

    const onData = (chunk) => {
      for (const character of String(chunk)) {
        if (character === '\r' || character === '\n') {
          cleanup();
          resolve(value);
          return;
        }

        if (character === '\u0003') {
          cleanup();
          reject(new Error('Operação cancelada.'));
          return;
        }

        if (character === '\u007f' || character === '\b') {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write('\b \b');
          }
          continue;
        }

        if (character >= ' ') {
          value += character;
          process.stdout.write('*');
        }
      }
    };

    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

export async function getConfirmedPassword() {
  const environmentPassword = process.env.CEASA_ADMIN_PASSWORD;

  if (environmentPassword) {
    return environmentPassword;
  }

  const password = await readSecret('Nova senha: ');
  const confirmation = await readSecret('Confirme a senha: ');

  if (password !== confirmation) {
    throw new Error('As senhas informadas não coincidem.');
  }

  return password;
}

export function validatePassword(password) {
  if (password.length < 12) {
    throw new Error('A senha deve possuir pelo menos 12 caracteres.');
  }
}
