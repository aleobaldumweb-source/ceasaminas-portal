export type ProcurementStatus =
  'DRAFT' | 'OPEN' | 'UNDER_REVIEW' | 'SUSPENDED' | 'CLOSED' | 'CANCELLED';

export type ProcurementModality =
  | 'PREGAO_ELETRONICO'
  | 'CONCORRENCIA'
  | 'DISPENSA'
  | 'INEXIGIBILIDADE'
  | 'TOMADA_DE_PRECOS'
  | 'CONVITE'
  | 'OUTRA';

export type ProcurementDocument = {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
};

export type Procurement = {
  id: string;
  number: string;
  title: string;
  description: string;
  modality: ProcurementModality;
  status: ProcurementStatus;
  openingAt: string | null;
  deadlineAt: string | null;
  estimatedValue: string | null;
  department: string | null;
  contactEmail: string | null;
  publishedAt: string | null;
  documents: ProcurementDocument[];
};

export type ProcurementFormValues = {
  number: string;
  title: string;
  description: string;
  modality: ProcurementModality;
  status: ProcurementStatus;
  openingAt: string;
  deadlineAt: string;
  estimatedValue: string;
  department: string;
  contactEmail: string;
  publishedAt: string;
};

export type PublicationFilter = 'ALL' | 'PUBLIC' | 'SCHEDULED' | 'UNPUBLISHED';
export type SortKey = 'number' | 'title' | 'status' | 'deadlineAt' | 'publishedAt';
export type SortDirection = 'asc' | 'desc';
