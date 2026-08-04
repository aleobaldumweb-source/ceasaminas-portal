import { config } from 'dotenv';
import { resolve } from 'node:path';
import { getConfirmedPassword, validatePassword } from './secret-prompt.mjs';

config({ path: resolve(process.cwd(), '../../.env') });

const email = (process.argv[2] ?? 'admin@ceasaminas.com.br').trim().toLowerCase();
const name = (process.argv[3] ?? 'Administrador Ceasaminas').trim();

const [{ hash }, { prisma }] = await Promise.all([
  import('bcryptjs'),
  import('@ceasaminas/database'),
]);

try {
  const password = await getConfirmedPassword();
  validatePassword(password);
  const passwordHash = await hash(password, 12);

  const user = await prisma.$transaction(async (transaction) => {
    const admin = await transaction.user.upsert({
      where: { email },
      update: { name, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
      create: { name, email, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    await transaction.authSession.updateMany({
      where: { userId: admin.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return admin;
  });

  console.log('Administrador criado/atualizado com sucesso:');
  console.table([user]);
  console.log('As sessões anteriores foram revogadas.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao criar o administrador.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
