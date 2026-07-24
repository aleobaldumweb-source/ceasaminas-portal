import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { prisma } from '@ceasaminas/database';
import { BulletinParserService } from './bulletin-parser.service.js';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class MarketImportService {
  private readonly logger = new Logger(MarketImportService.name);

  constructor(private readonly parser: BulletinParserService) {}

  async import(file: UploadedFile, replace = false) {
    const startedAt = Date.now();
    const parsed = this.parser.parse(file.buffer);
    const checksum = createHash('sha256').update(file.buffer).digest('hex');

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.marketBulletin.findFirst({
        where: {
          market: parsed.market,
          referenceAt: parsed.referenceAt,
        },
        select: {
          id: true,
          sourceFile: true,
        },
      });

      if (existing && !replace) {
        throw new ConflictException(
          `O boletim de ${this.formatDate(parsed.referenceAt)} para "${parsed.market}" já foi importado pelo arquivo "${existing.sourceFile}". Use replace=true para reprocessar.`,
        );
      }

      if (existing) {
        await tx.marketBulletin.delete({
          where: { id: existing.id },
        });
      }

      const bulletin = await tx.marketBulletin.create({
        data: {
          sourceFile: file.originalname,
          market: parsed.market,
          referenceAt: parsed.referenceAt,
          importedAt: new Date(),
        },
      });

      /*
       * O schema atual armazena a data no MarketBulletin. As cotações
       * referenciam o boletim por bulletinId.
       */
      await tx.marketPrice.createMany({
        data: parsed.rows.map((row) => ({
          bulletinId: bulletin.id,
          category: row.category,
          subCategory: row.subgroup || null,
          productCode: row.productCode || null,
          productName: row.productName,
          normalizedName: row.normalizedProduct || null,
          unit: row.unit,
          minPrice: row.minPrice,
          avgPrice: row.avgPrice,
          maxPrice: row.maxPrice,
          variation: null,
        })),
      });

      return {
        bulletinId: bulletin.id,
        sourceFile: bulletin.sourceFile,
        market: bulletin.market,
        referenceAt: bulletin.referenceAt,
        importedAt: bulletin.importedAt,
        records: parsed.rows.length,
        replaced: Boolean(existing),
      };
    });

    this.logger.log(`Boletim ${file.originalname} importado com ${result.records} cotações.`);

    return {
      success: true,
      checksum,
      ...result,
      referenceAt: result.referenceAt.toISOString(),
      importedAt: result.importedAt.toISOString(),
      durationMs: Date.now() - startedAt,
    };
  }

  list(limit = 30) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);

    return prisma.marketBulletin.findMany({
      orderBy: [{ referenceAt: 'desc' }, { importedAt: 'desc' }],
      take: safeLimit,
      select: {
        id: true,
        sourceFile: true,
        market: true,
        referenceAt: true,
        importedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            prices: true,
          },
        },
      },
    });
  }

  private formatDate(value: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'UTC',
    }).format(value);
  }
}
