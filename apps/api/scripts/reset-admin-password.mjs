import { config } from 'dotenv';
import { resolve } from 'node:path';
import { getConfirmedPassword, validatePassword } from './secret-prompt.mjs';

config({ path: resolve(process.cwd(), '../../.env') });

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error('Uso: pnpm admin:reset-password EMAIL');
  process.exit(1);
}

const [{ hash }, { prisma }] = await Promise.all([
  import('bcryptjs'),
  import('@ceasaminas/database'),
]);

try {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!existingUser) {
    throw new Error(`Usuário não encontrado: ${email}`);
  }

  const password = await getConfirmedPassword();
  validatePassword(password);
  const passwordHash = await hash(password, 12);

  await prisma.$transaction(async (transaction) => {
    await transaction.user.update({
      where: { email },
      data: { passwordHash, status: 'ACTIVE' },
    });
    await transaction.authSession.updateMany({
      where: { userId: existingUser.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  console.log('Senha redefinida com sucesso.');
  console.log(`Usuário: ${existingUser.name}`);
  console.log(`E-mail: ${existingUser.email}`);
  console.log(`Perfil: ${existingUser.role}`);
  console.log('As sessões anteriores foram revogadas.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao redefinir a senha.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
