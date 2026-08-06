import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@ceasaminas/database';
import type { AuthUser } from '../auth/auth.types.js';
import type { CreateProcurementDto } from './dto/create-procurement.dto.js';
import type { UpdateProcurementDto } from './dto/update-procurement.dto.js';

const includeDocuments = { documents: { orderBy: { createdAt: 'desc' as const } } };

const isUniqueConstraintError = (error: unknown) =>
  Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');

@Injectable()
export class ProcurementsService {
  findPublished(query?: string, status?: string) {
    return prisma.procurement.findMany({
      where: {
        publishedAt: { not: null, lte: new Date() },
        status: status && status !== 'ALL' ? (status as never) : { not: 'DRAFT' },
        ...(query
          ? {
              OR: [
                { number: { contains: query, mode: 'insensitive' } },
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: includeDocuments,
      orderBy: [{ deadlineAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findPublishedById(id: string) {
    return prisma.procurement.findFirst({
      where: { id, publishedAt: { not: null, lte: new Date() } },
      include: includeDocuments,
    });
  }

  findAdmin() {
    return prisma.procurement.findMany({
      include: includeDocuments,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(input: CreateProcurementDto, actor: AuthUser) {
    const number = input.number.trim();
    if (await prisma.procurement.findUnique({ where: { number }, select: { id: true } }))
      throw new ConflictException('Já existe uma licitação com esse número.');
    try {
      return await prisma.$transaction(async (tx) => {
        const item = await tx.procurement.create({
          data: this.toData(input, number),
          include: includeDocuments,
        });
        await tx.auditLog.create({
          data: {
            userId: actor.id,
            action: 'PROCUREMENT_CREATED',
            resource: 'PROCUREMENT',
            resourceId: item.id,
            metadata: { number: item.number, status: item.status },
          },
        });
        return item;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Já existe uma licitação com esse número.');
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateProcurementDto, actor: AuthUser) {
    if (!(await prisma.procurement.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Licitação não encontrada.');
    if (
      input.number &&
      (await prisma.procurement.findFirst({
        where: { number: input.number.trim(), id: { not: id } },
        select: { id: true },
      }))
    )
      throw new ConflictException('Já existe uma licitação com esse número.');
    try {
      return await prisma.$transaction(async (tx) => {
        const item = await tx.procurement.update({
          where: { id },
          data: this.toData(input, input.number?.trim()),
          include: includeDocuments,
        });
        await tx.auditLog.create({
          data: {
            userId: actor.id,
            action: 'PROCUREMENT_UPDATED',
            resource: 'PROCUREMENT',
            resourceId: id,
            metadata: { number: item.number, status: item.status },
          },
        });
        return item;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Já existe uma licitação com esse número.');
      }
      throw error;
    }
  }

  async remove(id: string, actor: AuthUser) {
    const item = await prisma.procurement.findUnique({
      where: { id },
      select: { number: true, documents: { select: { fileUrl: true } } },
    });
    if (!item) throw new NotFoundException('Licitação não encontrada.');
    await prisma.$transaction(async (tx) => {
      await tx.procurement.delete({ where: { id } });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'PROCUREMENT_DELETED',
          resource: 'PROCUREMENT',
          resourceId: id,
          metadata: { number: item.number },
        },
      });
    });
    return item;
  }

  async addDocument(
    id: string,
    file: { originalname: string; mimetype: string; size: number },
    fileUrl: string,
    title: string,
    actor: AuthUser,
  ) {
    if (!(await prisma.procurement.findUnique({ where: { id }, select: { id: true } })))
      throw new NotFoundException('Licitação não encontrada.');
    return prisma.$transaction(async (tx) => {
      const document = await tx.procurementDocument.create({
        data: {
          procurementId: id,
          title: title.trim(),
          fileName: file.originalname,
          fileUrl,
          mimeType: file.mimetype,
          fileSize: file.size,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'PROCUREMENT_DOCUMENT_ADDED',
          resource: 'PROCUREMENT',
          resourceId: id,
          metadata: { documentId: document.id, fileName: document.fileName },
        },
      });
      return document;
    });
  }

  async removeDocument(id: string, documentId: string, actor: AuthUser) {
    const doc = await prisma.procurementDocument.findFirst({
      where: { id: documentId, procurementId: id },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado.');
    await prisma.$transaction(async (tx) => {
      await tx.procurementDocument.delete({ where: { id: documentId } });
      await tx.auditLog.create({
        data: {
          userId: actor.id,
          action: 'PROCUREMENT_DOCUMENT_REMOVED',
          resource: 'PROCUREMENT',
          resourceId: id,
          metadata: { documentId, fileName: doc.fileName },
        },
      });
    });
    return doc;
  }

  private toData(input: UpdateProcurementDto, number?: string) {
    return {
      ...(number !== undefined ? { number } : {}),
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      ...(input.modality !== undefined ? { modality: input.modality } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.openingAt !== undefined
        ? { openingAt: input.openingAt ? new Date(input.openingAt) : null }
        : {}),
      ...(input.deadlineAt !== undefined
        ? { deadlineAt: input.deadlineAt ? new Date(input.deadlineAt) : null }
        : {}),
      ...(input.estimatedValue !== undefined ? { estimatedValue: input.estimatedValue } : {}),
      ...(input.department !== undefined ? { department: input.department?.trim() || null } : {}),
      ...(input.contactEmail !== undefined
        ? { contactEmail: input.contactEmail?.trim().toLowerCase() || null }
        : {}),
      ...(input.publishedAt !== undefined
        ? { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null }
        : {}),
    } as never;
  }
}
