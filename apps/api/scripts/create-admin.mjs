import { config } from 'dotenv';
import { resolve } from 'node:path';

config({
  path: resolve(process.cwd(), '../../.env'),
});

const [{ hash }, { prisma }] = await Promise.all([
  import('bcryptjs'),
  import('@ceasaminas/database'),
]);

const email = 'admin@ceasaminas.com.br';
const password = 'Ceasa@2026NovaSenha';

try {
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Administrador Ceasaminas',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      name: 'Administrador Ceasaminas',
      email,
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  await prisma.authSession.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  console.log('');
  console.log('Administrador criado/atualizado com sucesso:');
  console.table([user]);
} catch (error) {
  console.error('Erro ao criar o administrador:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
