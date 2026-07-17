export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: {
    page: number;
    pageSize: number;
    total: number;
    pageCount: number;
  };
};

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
