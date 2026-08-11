export type MarketPrice = {
  productName: string;
  category: string;
  unit: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  variation: number;
  referenceAt: string | null;
};

export type MarketHistoryItem = {
  label: string;
  referenceAt: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
};

export type MarketHistory = {
  source: 'database';
  productName: string;
  unit: string;
  days: number;
  items: MarketHistoryItem[];
};

export type MarketDashboard = {
  source: 'database';
  updatedAt: string | null;
  filters: { product: string; days: number };
  summary: {
    totalProducts: number;
    bulletinDate: string | null;
    market: string | null;
  };
  highlights: {
    highestIncrease: MarketPrice | null;
    highestDecrease: MarketPrice | null;
    mostViewed: MarketPrice | null;
  };
  prices: MarketPrice[];
  history: MarketHistory;
};

export type MarketImport = {
  id: string;
  sourceFile: string;
  market: string;
  referenceAt: string;
  importedAt: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: { prices?: number };
};

function apiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3333/api/v1'
  ).replace(/\/+$/, '');
}

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`A API de mercado retornou o status ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

export function getMarketDashboard(days = 30, product?: string) {
  const params = new URLSearchParams({ days: String(days) });
  if (product?.trim()) params.set('product', product.trim());
  return apiRequest<MarketDashboard>(`/market/dashboard?${params.toString()}`);
}

export function getMarketImports(limit = 12) {
  return apiRequest<MarketImport[]>(`/market/bulletins?limit=${limit}`);
}

export function formatMarketDate(value: string | null, withTime = false) {
  if (!value) return 'Não informado';

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(withTime ? { timeStyle: 'short' as const } : {}),
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

export function formatMarketMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatMarketVariation(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}%`;
}
