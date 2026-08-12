import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@ceasaminas/database';
import type { AuthUser } from '../auth/auth.types.js';
import type { CreateTransparencyItemDto } from './dto/create-transparency-item.dto.js';
import type { UpdateTransparencyItemDto } from './dto/update-transparency-item.dto.js';

@Injectable()
export class TransparencyService {
  findPublished() {
    return prisma.transparencyItem.findMany({
      where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  findAdmin() {
    return prisma.transparencyItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  create(input: CreateTransparencyItemDto, actor: AuthUser) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.transparencyItem.create({ data: this.toData(input) });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'TRANSPARENCY_CREATED',
          resource: 'TRANSPARENCY',
          resourceId: item.id,
          metadata: { title: item.title, status: item.status },
        },
      });
      return item;
    });
  }

  async update(id: string, input: UpdateTransparencyItemDto, actor: AuthUser) {
    const current = await prisma.transparencyItem.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Item de transparência não encontrado.');
    return prisma.$transaction(async (tx) => {
      const item = await tx.transparencyItem.update({
        where: { id },
        data: this.toData(input, current.publishedAt),
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'TRANSPARENCY_UPDATED',
          resource: 'TRANSPARENCY',
          resourceId: item.id,
          metadata: { title: item.title, status: item.status },
        },
      });
      return item;
    });
  }

  async remove(id: string, actor: AuthUser) {
    const current = await prisma.transparencyItem.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Item de transparência não encontrado.');
    await prisma.$transaction(async (tx) => {
      await tx.transparencyItem.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'TRANSPARENCY_DELETED',
          resource: 'TRANSPARENCY',
          resourceId: id,
          metadata: { title: current.title },
        },
      });
    });
    return { success: true };
  }

  private toData(input: UpdateTransparencyItemDto, currentPublishedAt: Date | null = null) {
    const status = input.status;
    return {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.category !== undefined ? { category: input.category.trim() } : {}),
      ...(input.url !== undefined ? { url: input.url.trim() } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.publishedAt !== undefined
        ? { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null }
        : status === 'PUBLISHED'
          ? { publishedAt: currentPublishedAt ?? new Date() }
          : {}),
    } as never;
  }
}
