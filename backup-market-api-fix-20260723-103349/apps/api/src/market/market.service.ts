import { Injectable } from '@nestjs/common';
import { prisma } from '@ceasaminas/database';

type DashboardOptions = {
  product?: string;
  days: number;
};

type DemoPrice = {
  productName: string;
  category: string;
  unit: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  variation: number;
  referenceAt: string;
};

const DEMO_PRICES: DemoPrice[] = [
  {
    productName: 'Banana-prata',
    category: 'Frutas',
    unit: 'cx. 20 kg',
    minPrice: 78,
    avgPrice: 88.5,
    maxPrice: 96,
    variation: 4.2,
    referenceAt: new Date().toISOString(),
  },
  {
    productName: 'Tomate longa vida',
    category: 'Hortaliças',
    unit: 'cx. 22 kg',
    minPrice: 86,
    avgPrice: 96,
    maxPrice: 108,
    variation: -2.1,
    referenceAt: new Date().toISOString(),
  },
  {
    productName: 'Batata inglesa',
    category: 'Tubérculos',
    unit: 'sc. 50 kg',
    minPrice: 139,
    avgPrice: 154,
    maxPrice: 166,
    variation: 8.4,
    referenceAt: new Date().toISOString(),
  },
  {
    productName: 'Cenoura',
    category: 'Hortaliças',
    unit: 'cx. 20 kg',
    minPrice: 65,
    avgPrice: 72,
    maxPrice: 80,
    variation: 1.5,
    referenceAt: new Date().toISOString(),
  },
  {
    productName: 'Abacaxi pérola',
    category: 'Frutas',
    unit: 'unidade',
    minPrice: 6.5,
    avgPrice: 7.4,
    maxPrice: 8.5,
    variation: -0.9,
    referenceAt: new Date().toISOString(),
  },
  {
    productName: 'Mamão formosa',
    category: 'Frutas',
    unit: 'cx. 18 kg',
    minPrice: 68,
    avgPrice: 74.5,
    maxPrice: 82,
    variation: 3.1,
    referenceAt: new Date().toISOString(),
  },
];

@Injectable()
export class MarketService {
  async getLatestPrices(product?: string) {
    const rows = await prisma.marketPrice.findMany({
      where: product
        ? {
            productName: {
              contains: product,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: [{ referenceAt: 'desc' }, { productName: 'asc' }],
      take: 250,
    });

    if (rows.length === 0) {
      const filtered = product
        ? DEMO_PRICES.filter((item) =>
            item.productName
              .toLocaleLowerCase('pt-BR')
              .includes(product.toLocaleLowerCase('pt-BR')),
          )
        : DEMO_PRICES;

      return {
        source: 'demonstration',
        updatedAt: new Date().toISOString(),
        items: filtered,
      };
    }

    const latestByProduct = new Map<string, (typeof rows)[number]>();

    for (const row of rows) {
      if (!latestByProduct.has(row.productName)) {
        latestByProduct.set(row.productName, row);
      }
    }

    return {
      source: 'database',
      updatedAt: rows[0]?.referenceAt.toISOString() ?? new Date().toISOString(),
      items: [...latestByProduct.values()].map((row) => ({
        id: row.id,
        productName: row.productName,
        category: 'Não informada',
        unit: row.unit,
        minPrice: Number(row.minPrice),
        avgPrice: Number(row.avgPrice),
        maxPrice: Number(row.maxPrice),
        variation: 0,
        referenceAt: row.referenceAt.toISOString(),
      })),
    };
  }

  async getHistory(product: string, days = 30) {
    const safeDays = Number.isFinite(days) ? Math.min(Math.max(Math.trunc(days), 1), 365) : 30;

    const from = new Date();
    from.setDate(from.getDate() - safeDays);

    const rows = await prisma.marketPrice.findMany({
      where: {
        productName: {
          equals: decodeURIComponent(product),
          mode: 'insensitive',
        },
        referenceAt: {
          gte: from,
        },
      },
      orderBy: {
        referenceAt: 'asc',
      },
      take: 365,
    });

    if (rows.length === 0) {
      const base =
        DEMO_PRICES.find(
          (item) =>
            item.productName.toLocaleLowerCase('pt-BR') ===
            decodeURIComponent(product).toLocaleLowerCase('pt-BR'),
        ) ?? DEMO_PRICES[0];

      const values = [0.93, 0.95, 0.955, 0.98, 1].map((factor, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (4 - index));

        return {
          label: new Intl.DateTimeFormat('pt-BR', {
            weekday: 'short',
          })
            .format(date)
            .replace('.', ''),
          referenceAt: date.toISOString(),
          minPrice: Number((base.minPrice * factor).toFixed(2)),
          avgPrice: Number((base.avgPrice * factor).toFixed(2)),
          maxPrice: Number((base.maxPrice * factor).toFixed(2)),
        };
      });

      return {
        source: 'demonstration',
        productName: base.productName,
        unit: base.unit,
        days: safeDays,
        items: values,
      };
    }

    return {
      source: 'database',
      productName: rows[0].productName,
      unit: rows[0].unit,
      days: safeDays,
      items: rows.map((row) => ({
        label: new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }).format(row.referenceAt),
        referenceAt: row.referenceAt.toISOString(),
        minPrice: Number(row.minPrice),
        avgPrice: Number(row.avgPrice),
        maxPrice: Number(row.maxPrice),
      })),
    };
  }

  async getDashboard(options: DashboardOptions) {
    const pricesResponse = await this.getLatestPrices(options.product);
    const prices = pricesResponse.items;

    const selectedProduct =
      options.product && prices.some((item) => item.productName === options.product)
        ? options.product
        : (prices[0]?.productName ?? 'Banana-prata');

    const history = await this.getHistory(selectedProduct, options.days);

    const highest = [...prices].sort((left, right) => right.variation - left.variation)[0];

    const lowest = [...prices].sort((left, right) => left.variation - right.variation)[0];

    return {
      source:
        pricesResponse.source === 'database' && history.source === 'database'
          ? 'database'
          : 'demonstration',
      updatedAt: pricesResponse.updatedAt,
      filters: {
        product: selectedProduct,
        days: options.days,
      },
      highlights: {
        highestIncrease: highest ?? null,
        highestDecrease: lowest ?? null,
        mostViewed: prices[0] ?? null,
      },
      prices,
      history,
    };
  }
}
