import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@ceasaminas/database';
import { CreateNewsDto } from './dto/create-news.dto.js';
import { UpdateNewsDto } from './dto/update-news.dto.js';

@Injectable()
export class NewsService {
  findPublished() {
    return prisma.newsArticle.findMany({
      where: { status: 'PUBLISHED', publishedAt: { lte: new Date() } },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findAdmin() {
    return prisma.newsArticle.findMany({
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async findPublishedBySlug(slug: string) {
    const article = await prisma.newsArticle.findFirst({
      where: { slug, status: 'PUBLISHED', publishedAt: { lte: new Date() } },
    });
    if (!article) throw new NotFoundException('Notícia não encontrada.');
    return article;
  }

  async create(input: CreateNewsDto) {
    const status = input.status ?? 'DRAFT';
    try {
      return await prisma.newsArticle.create({
        data: {
          title: input.title.trim(),
          slug: this.slugify(input.slug || input.title),
          summary: input.summary.trim(),
          content: input.content.trim(),
          status,
          publishedAt: this.resolvePublishedAt(status, input.publishedAt, null),
        },
      });
    } catch (error) {
      this.handleKnownDatabaseError(error);
      throw error;
    }
  }

  async update(id: string, input: UpdateNewsDto) {
    const current = await prisma.newsArticle.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Notícia não encontrada.');

    const status = input.status ?? current.status;

    try {
      return await prisma.newsArticle.update({
        where: { id },
        data: {
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.slug !== undefined ? { slug: this.slugify(input.slug) } : {}),
          ...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
          ...(input.content !== undefined ? { content: input.content.trim() } : {}),
          ...(input.status !== undefined ? { status } : {}),
          publishedAt: this.resolvePublishedAt(status, input.publishedAt, current.publishedAt),
        },
      });
    } catch (error) {
      this.handleKnownDatabaseError(error);
      throw error;
    }
  }

  async remove(id: string) {
    const current = await prisma.newsArticle.findUnique({ where: { id }, select: { id: true } });
    if (!current) throw new NotFoundException('Notícia não encontrada.');
    await prisma.newsArticle.delete({ where: { id } });
    return { success: true, id };
  }

  private resolvePublishedAt(status: string, incoming: string | undefined, current: Date | null) {
    if (incoming) return new Date(incoming);
    if (status === 'PUBLISHED') return current ?? new Date();
    return current;
  }

  private slugify(value: string) {
    const slug = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) throw new ConflictException('Não foi possível gerar o slug.');
    return slug;
  }

  private handleKnownDatabaseError(error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw new ConflictException('Já existe uma notícia utilizando este slug.');
    }
  }
}
