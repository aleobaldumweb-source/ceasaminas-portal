import { Injectable } from '@nestjs/common';
import { prisma } from '@ceasaminas/database';

type DashboardOptions = {
  product?: string;
  days: number;
};

type MarketPriceView = {
  productName: string;
  category: string;
  unit: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  variation: number;
  referenceAt: string;
};

@Injectable()
export class MarketService {
  private safeDays(value: number): number {
    return Number.isFinite(value) ? Math.min(Math.max(Math.trunc(value), 1), 365) : 30;
  }

  private async variationFor(
    productName: string,
    unit: string,
    currentAverage: number,
    currentReferenceAt: Date,
  ): Promise<number> {
    const previous = await prisma.marketPrice.findFirst({
      where: {
        productName: {
          equals: productName,
          mode: 'insensitive',
        },
        unit,
        bulletin: {
          referenceAt: {
            lt: currentReferenceAt,
          },
        },
      },
      orderBy: {
        bulletin: {
          referenceAt: 'desc',
        },
      },
      select: {
        avgPrice: true,
      },
    });

    if (!previous) return 0;

    const previousAverage = Number(previous.avgPrice);
    if (!Number.isFinite(previousAverage) || previousAverage === 0) return 0;

    return Number((((currentAverage - previousAverage) / previousAverage) * 100).toFixed(2));
  }

  async getLatestPrices(product?: string) {
    const latestBulletin = await prisma.marketBulletin.findFirst({
      orderBy: [{ referenceAt: 'desc' }, { importedAt: 'desc' }],
      select: {
        id: true,
        market: true,
        referenceAt: true,
      },
    });

    if (!latestBulletin) {
      return {
        source: 'database' as const,
        updatedAt: null,
        market: null,
        total: 0,
        items: [] as MarketPriceView[],
      };
    }

    const rows = await prisma.marketPrice.findMany({
      where: {
        bulletinId: latestBulletin.id,
        ...(product
          ? {
              productName: {
                contains: product.trim(),
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      orderBy: [{ productName: 'asc' }, { unit: 'asc' }],
      take: 1000,
    });

    const items: MarketPriceView[] = await Promise.all(
      rows.map(async (row) => {
        const average = Number(row.avgPrice);

        return {
          productName: row.productName,
          category: row.category,
          unit: row.unit,
          minPrice: Number(row.minPrice),
          avgPrice: average,
          maxPrice: Number(row.maxPrice),
          variation: await this.variationFor(
            row.productName,
            row.unit,
            average,
            latestBulletin.referenceAt,
          ),
          referenceAt: latestBulletin.referenceAt.toISOString(),
        };
      }),
    );

    return {
      source: 'database' as const,
      updatedAt: latestBulletin.referenceAt.toISOString(),
      market: latestBulletin.market,
      total: items.length,
      items,
    };
  }

  async getHistory(product: string, days = 30) {
    const safeDays = this.safeDays(days);
    const decodedProduct = decodeURIComponent(product).trim();

    const latest = await prisma.marketPrice.findFirst({
      where: {
        productName: {
          equals: decodedProduct,
          mode: 'insensitive',
        },
      },
      orderBy: {
        bulletin: {
          referenceAt: 'desc',
        },
      },
      select: {
        productName: true,
        unit: true,
        bulletin: {
          select: {
            referenceAt: true,
          },
        },
      },
    });

    if (!latest) {
      return {
        source: 'database' as const,
        productName: decodedProduct,
        unit: '',
        days: safeDays,
        items: [],
      };
    }

    const latestReferenceAt = latest.bulletin.referenceAt;
    const from = new Date(latestReferenceAt);
    from.setUTCDate(from.getUTCDate() - safeDays + 1);

    const rows = await prisma.marketPrice.findMany({
      where: {
        productName: {
          equals: latest.productName,
          mode: 'insensitive',
        },
        unit: latest.unit,
        bulletin: {
          referenceAt: {
            gte: from,
            lte: latestReferenceAt,
          },
        },
      },
      orderBy: {
        bulletin: {
          referenceAt: 'asc',
        },
      },
      take: 365,
      include: {
        bulletin: {
          select: {
            referenceAt: true,
          },
        },
      },
    });

    return {
      source: 'database' as const,
      productName: latest.productName,
      unit: latest.unit,
      days: safeDays,
      items: rows.map((row) => ({
        label: new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          timeZone: 'UTC',
        }).format(row.bulletin.referenceAt),
        referenceAt: row.bulletin.referenceAt.toISOString(),
        minPrice: Number(row.minPrice),
        avgPrice: Number(row.avgPrice),
        maxPrice: Number(row.maxPrice),
      })),
    };
  }

  async getDashboard(options: DashboardOptions) {
    const safeDays = this.safeDays(options.days);
    const pricesResponse = await this.getLatestPrices(options.product);
    const prices = pricesResponse.items;

    const requested = options.product?.trim().toLocaleLowerCase('pt-BR');
    const selectedProduct =
      prices.find((item) => item.productName.toLocaleLowerCase('pt-BR') === requested)
        ?.productName ??
      prices[0]?.productName ??
      '';

    const history = selectedProduct
      ? await this.getHistory(selectedProduct, safeDays)
      : {
          source: 'database' as const,
          productName: '',
          unit: '',
          days: safeDays,
          items: [],
        };

    const highest = [...prices].sort((left, right) => right.variation - left.variation)[0] ?? null;

    const lowest = [...prices].sort((left, right) => left.variation - right.variation)[0] ?? null;

    return {
      source: pricesResponse.source,
      updatedAt: pricesResponse.updatedAt,
      filters: {
        product: selectedProduct,
        days: safeDays,
      },
      summary: {
        totalProducts: pricesResponse.total,
        bulletinDate: pricesResponse.updatedAt?.slice(0, 10) ?? null,
        market: pricesResponse.market,
      },
      highlights: {
        highestIncrease: highest,
        highestDecrease: lowest,
        mostViewed: prices[0] ?? null,
      },
      prices,
      history,
    };
  }
}
