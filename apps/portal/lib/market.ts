export type MarketPrice = {
  id?: string;
  productName: string;
  category: string;
  unit: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  variation: number;
  referenceAt: string;
};

export type MarketHistoryPoint = {
  label: string;
  referenceAt: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
};

export type MarketDashboard = {
  source: 'database' | 'demonstration';
  updatedAt: string;
  filters: {
    product: string;
    days: number;
  };
  highlights: {
    highestIncrease: MarketPrice | null;
    highestDecrease: MarketPrice | null;
    mostViewed: MarketPrice | null;
  };
  prices: MarketPrice[];
  history: {
    source: 'database' | 'demonstration';
    productName: string;
    unit: string;
    days: number;
    items: MarketHistoryPoint[];
  };
};

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3333/api/v1'
  ).replace(/\/+$/, '');
}

export async function getMarketDashboard(product?: string, days = 30): Promise<MarketDashboard> {
  const params = new URLSearchParams();

  if (product) {
    params.set('product', product);
  }

  params.set('days', String(days));

  const response = await fetch(`${getApiBaseUrl()}/market/dashboard?${params.toString()}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`A API de mercado retornou ${response.status}.`);
  }

  return response.json() as Promise<MarketDashboard>;
}
