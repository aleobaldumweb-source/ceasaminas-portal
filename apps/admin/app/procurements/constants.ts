import type { ProcurementFormValues, ProcurementModality, ProcurementStatus } from './types';

export const PAGE_SIZE = 10;

export const statusLabels: Record<ProcurementStatus, string> = {
  DRAFT: 'Rascunho',
  OPEN: 'Aberta',
  UNDER_REVIEW: 'Em análise',
  SUSPENDED: 'Suspensa',
  CLOSED: 'Encerrada',
  CANCELLED: 'Cancelada',
};

export const modalityLabels: Record<ProcurementModality, string> = {
  PREGAO_ELETRONICO: 'Pregão eletrônico',
  CONCORRENCIA: 'Concorrência',
  DISPENSA: 'Dispensa',
  INEXIGIBILIDADE: 'Inexigibilidade',
  TOMADA_DE_PRECOS: 'Tomada de preços',
  CONVITE: 'Convite',
  OUTRA: 'Outra',
};

export const initialProcurementForm: ProcurementFormValues = {
  number: '',
  title: '',
  description: '',
  modality: 'PREGAO_ELETRONICO',
  status: 'DRAFT',
  openingAt: '',
  deadlineAt: '',
  estimatedValue: '',
  department: '',
  contactEmail: '',
  publishedAt: '',
};
