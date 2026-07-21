import { config } from 'dotenv';
import { resolve } from 'node:path';

config({
  path: resolve(process.cwd(), '../../.env'),
});

const { prisma } = await import('@ceasaminas/database');

try {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (users.length === 0) {
    console.log('Nenhum usuário encontrado no banco.');
  } else {
    console.table(users);
  }
} finally {
  await prisma.$disconnect();
}
