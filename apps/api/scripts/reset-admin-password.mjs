import { config } from 'dotenv';
import { resolve } from 'node:path';

config({
  path: resolve(process.cwd(), '../../.env'),
});

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

if (!email || !password) {
  console.error('Uso: node reset-admin-password.mjs EMAIL NOVA_SENHA');
  process.exit(1);
}

if (password.length < 8) {
  console.error('A senha deve possuir pelo menos 8 caracteres.');
  process.exit(1);
}

const [{ hash }, { prisma }] = await Promise.all([
  import('bcryptjs'),
  import('@ceasaminas/database'),
]);

try {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  if (!existingUser) {
    console.error(`Usuário não encontrado: ${email}`);
    process.exitCode = 1;
  } else {
    const passwordHash = await hash(password, 12);

    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        status: 'ACTIVE',
      },
    });

    await prisma.authSession.updateMany({
      where: {
        userId: existingUser.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    console.log('');
    console.log('Senha redefinida com sucesso.');
    console.log(`Usuário: ${existingUser.name}`);
    console.log(`E-mail: ${existingUser.email}`);
    console.log(`Perfil: ${existingUser.role}`);
    console.log('As sessões anteriores foram revogadas.');
  }
} catch (error) {
  console.error('Falha ao redefinir a senha:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
