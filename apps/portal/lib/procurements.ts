export type ProcurementStatus = 'OPEN' | 'UNDER_REVIEW' | 'SUSPENDED' | 'CLOSED' | 'CANCELLED';

export type ProcurementDocument = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

export type Procurement = {
  id: string;
  number: string;
  title: string;
  description: string;
  modality: string;
  status: ProcurementStatus;
  openingAt: string | null;
  deadlineAt: string | null;
  estimatedValue: string | number | null;
  department: string | null;
  contactEmail: string | null;
  publishedAt: string | null;
  documents: ProcurementDocument[];
};

export const procurementStatusLabels: Record<ProcurementStatus, string> = {
  OPEN: 'Aberta',
  UNDER_REVIEW: 'Em análise',
  SUSPENDED: 'Suspensa',
  CLOSED: 'Encerrada',
  CANCELLED: 'Cancelada',
};

function getApiBaseUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3333/api/v1'
  ).replace(/\/+$/, '');
}

export async function getPublishedProcurements() {
  const response = await fetch(`${getApiBaseUrl()}/procurements`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`A API de licitações retornou o status ${response.status}.`);
  }

  return response.json() as Promise<Procurement[]>;
}

export function formatProcurementDate(value: string | null) {
  if (!value) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

export function formatProcurementMoney(value: string | number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

export function formatProcurementModality(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .split('_')
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1))
    .join(' ');
}
