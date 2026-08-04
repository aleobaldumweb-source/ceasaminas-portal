import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { prisma } from '@ceasaminas/database';
import type { AuthUser } from '../auth/auth.types.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

const selectUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  findAll() {
    return prisma.user.findMany({
      select: selectUser,
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
  }

  async create(input: CreateUserDto, actor: AuthUser) {
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) throw new ConflictException('Já existe um usuário com esse e-mail.');

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash: await hash(input.password, 12),
          role: input.role,
        },
        select: selectUser,
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'USER_CREATED',
          resource: 'USER',
          resourceId: user.id,
          metadata: { email: user.email, role: user.role },
        },
      });
      return user;
    });
  }

  async update(id: string, input: UpdateUserDto, actor: AuthUser) {
    const current = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new NotFoundException('Usuário não encontrado.');

    if (input.email) {
      const duplicate = await prisma.user.findFirst({
        where: { email: input.email.trim().toLowerCase(), id: { not: id } },
        select: { id: true },
      });
      if (duplicate) throw new ConflictException('Já existe um usuário com esse e-mail.');
    }

    const shouldRevokeSessions =
      Boolean(input.password) || Boolean(input.status && input.status !== 'ACTIVE');

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(input.name ? { name: input.name.trim() } : {}),
          ...(input.email ? { email: input.email.trim().toLowerCase() } : {}),
          ...(input.role ? { role: input.role } : {}),
          ...(input.status ? { status: input.status } : {}),
          ...(input.password ? { passwordHash: await hash(input.password, 12) } : {}),
        },
        select: selectUser,
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'USER_UPDATED',
          resource: 'USER',
          resourceId: user.id,
          metadata: {
            role: user.role,
            status: user.status,
            passwordChanged: Boolean(input.password),
          },
        },
      });
      if (shouldRevokeSessions) {
        await tx.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return user;
    });
  }
}
