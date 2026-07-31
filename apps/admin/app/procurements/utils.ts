import type { Procurement, ProcurementFormValues } from './types';

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatCurrency(value: string | null) {
  if (value === null || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function getPublicState(item: Procurement) {
  if (item.status === 'DRAFT') return { label: 'Rascunho', className: 'draft' };
  if (!item.publishedAt) return { label: 'Não publicada', className: 'unpublished' };

  const publishedAt = new Date(item.publishedAt);
  if (Number.isNaN(publishedAt.getTime())) {
    return { label: 'Data inválida', className: 'unpublished' };
  }

  if (publishedAt > new Date()) return { label: 'Programada', className: 'scheduled' };
  return { label: 'Pública', className: 'public' };
}

export function toFormValues(item: Procurement): ProcurementFormValues {
  return {
    number: item.number,
    title: item.title,
    description: item.description,
    modality: item.modality,
    status: item.status,
    openingAt: item.openingAt?.slice(0, 16) ?? '',
    deadlineAt: item.deadlineAt?.slice(0, 16) ?? '',
    estimatedValue: item.estimatedValue ?? '',
    department: item.department ?? '',
    contactEmail: item.contactEmail ?? '',
    publishedAt: item.publishedAt?.slice(0, 16) ?? '',
  };
}
