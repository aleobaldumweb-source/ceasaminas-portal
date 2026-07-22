export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;

  category: string;

  summary: string;
  content: string;

  imageUrl: string | null;
  sourceUrl: string | null;

  status: PublicationStatus;

  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3333/api/v1'
  ).replace(/\/+$/, '');
}

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiRequestError(`A API retornou o status ${response.status}.`, response.status);
  }

  return response.json() as Promise<T>;
}

export function getPublishedNews() {
  return apiRequest<NewsArticle[]>('/news');
}

export function getPublishedNewsBySlug(slug: string) {
  return apiRequest<NewsArticle>(`/news/${encodeURIComponent(slug)}`);
}

export function formatNewsDate(value: string | null) {
  if (!value) {
    return 'Data não informada';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
    .format(new Date(value))
    .replace('.', '');
}
