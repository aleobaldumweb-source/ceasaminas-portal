$ErrorActionPreference = "Stop"

$schemaPath = ".\packages\database\prisma\schema.prisma"
$dtoPath = ".\apps\api\src\news\dto\create-news.dto.ts"
$servicePath = ".\apps\api\src\news\news.service.ts"

foreach ($path in @($schemaPath, $dtoPath, $servicePath)) {
  if (-not (Test-Path $path)) {
    throw "Arquivo não encontrado: $path. Execute este script na raiz do projeto."
  }
  Copy-Item $path "$path.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force
}

# Atualiza apenas o bloco NewsArticle, preservando o restante do schema.
$schema = Get-Content $schemaPath -Raw

$newsModel = @'
model NewsArticle {
  id          String            @id @default(cuid())
  title       String
  slug        String            @unique
  category    String            @default("Institucional")
  summary     String
  content     String
  imageUrl    String?
  sourceUrl   String?
  status      PublicationStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@index([status, publishedAt])
  @@index([category])
  @@map("news_articles")
}
'@

$pattern = '(?s)model\s+NewsArticle\s*\{.*?\r?\n\}'
if ($schema -notmatch $pattern) {
  throw "O bloco model NewsArticle não foi localizado."
}
$schema = [regex]::Replace($schema, $pattern, $newsModel, 1)
Set-Content $schemaPath $schema -Encoding utf8

$dto = @'
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
} from 'class-validator';

export enum NewsPublicationStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateNewsDto {
  @IsString()
  @Length(3, 180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsString()
  @Length(3, 100)
  category!: string;

  @IsString()
  @Length(10, 500)
  summary!: string;

  @IsString()
  @Length(10, 100000)
  content!: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  sourceUrl?: string;

  @IsOptional()
  @IsEnum(NewsPublicationStatus)
  status?: NewsPublicationStatus;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;
}
'@
Set-Content $dtoPath $dto -Encoding utf8

$service = @'
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
          category: input.category.trim(),
          summary: input.summary.trim(),
          content: input.content.trim(),
          imageUrl: input.imageUrl?.trim() || null,
          sourceUrl: input.sourceUrl?.trim() || null,
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
          ...(input.category !== undefined ? { category: input.category.trim() } : {}),
          ...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
          ...(input.content !== undefined ? { content: input.content.trim() } : {}),
          ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl.trim() || null } : {}),
          ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl.trim() || null } : {}),
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
'@
Set-Content $servicePath $service -Encoding utf8

Write-Host ""
Write-Host "Arquivos atualizados com sucesso." -ForegroundColor Green
Write-Host "Agora execute os comandos apresentados no arquivo LEIA-ME.txt." -ForegroundColor Yellow
