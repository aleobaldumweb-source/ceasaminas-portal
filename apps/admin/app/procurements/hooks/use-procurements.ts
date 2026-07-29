'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { authenticatedRequest } from '../../../lib/auth-client';
import { initialProcurementForm, PAGE_SIZE } from '../constants';
import type {
  Procurement,
  ProcurementFormValues,
  ProcurementModality,
  ProcurementStatus,
  PublicationFilter,
  SortDirection,
  SortKey,
} from '../types';
import { getPublicState, toFormValues } from '../utils';

export function useProcurements() {
  const [items, setItems] = useState<Procurement[]>([]);
  const [form, setForm] = useState<ProcurementFormValues>(initialProcurementForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProcurementStatus>('ALL');
  const [modalityFilter, setModalityFilter] = useState<'ALL' | ProcurementModality>('ALL');
  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('deadlineAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [pageNumber, setPageNumber] = useState(1);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFor, setDocumentFor] = useState<string | null>(null);

  async function load() {
    try {
      setItems(
        await authenticatedRequest<Procurement[]>('/procurements/admin/list', {
          cache: 'no-store',
        }),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao carregar licitações.');
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const publicationWarning = useMemo(() => {
    if (form.status === 'DRAFT') {
      return {
        type: 'warning' as const,
        title: 'Licitação em rascunho',
        text: 'Esta licitação não aparecerá no portal público enquanto estiver como Rascunho.',
      };
    }

    if (!form.publishedAt) {
      return {
        type: 'warning' as const,
        title: 'Data de publicação não definida',
        text: 'Defina a data e a hora de publicação para que a licitação fique visível no portal público.',
      };
    }

    const publicationDate = new Date(form.publishedAt);
    if (Number.isNaN(publicationDate.getTime())) {
      return {
        type: 'warning' as const,
        title: 'Data de publicação inválida',
        text: 'Revise a data e a hora informadas antes de salvar.',
      };
    }

    if (publicationDate > new Date()) {
      return {
        type: 'info' as const,
        title: 'Publicação programada',
        text: 'A licitação será publicada automaticamente na data e hora informadas.',
      };
    }

    return null;
  }, [form.publishedAt, form.status]);

  const metrics = useMemo(() => {
    const now = new Date();
    const nextSevenDays = new Date(now);
    nextSevenDays.setDate(now.getDate() + 7);

    return {
      total: items.length,
      open: items.filter((item) => item.status === 'OPEN').length,
      drafts: items.filter((item) => item.status === 'DRAFT').length,
      expiring: items.filter((item) => {
        if (!item.deadlineAt || item.status === 'CLOSED' || item.status === 'CANCELLED') {
          return false;
        }
        const deadline = new Date(item.deadlineAt);
        return !Number.isNaN(deadline.getTime()) && deadline >= now && deadline <= nextSevenDays;
      }).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items
      .filter((item) => {
        const matchesQuery =
          !normalizedQuery ||
          `${item.number} ${item.title} ${item.description} ${item.department ?? ''}`
            .toLowerCase()
            .includes(normalizedQuery);
        const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
        const matchesModality = modalityFilter === 'ALL' || item.modality === modalityFilter;
        const state = getPublicState(item);
        const matchesPublication =
          publicationFilter === 'ALL' ||
          (publicationFilter === 'PUBLIC' && state.className === 'public') ||
          (publicationFilter === 'SCHEDULED' && state.className === 'scheduled') ||
          (publicationFilter === 'UNPUBLISHED' &&
            (state.className === 'draft' || state.className === 'unpublished'));

        return matchesQuery && matchesStatus && matchesModality && matchesPublication;
      })
      .sort((leftItem, rightItem) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        const left = leftItem[sortKey];
        const right = rightItem[sortKey];

        if (sortKey === 'deadlineAt' || sortKey === 'publishedAt') {
          const leftTime = left ? new Date(String(left)).getTime() : Number.MAX_SAFE_INTEGER;
          const rightTime = right ? new Date(String(right)).getTime() : Number.MAX_SAFE_INTEGER;
          return (leftTime - rightTime) * direction;
        }

        return (
          String(left ?? '').localeCompare(String(right ?? ''), 'pt-BR', {
            numeric: true,
            sensitivity: 'base',
          }) * direction
        );
      });
  }, [items, modalityFilter, publicationFilter, query, sortDirection, sortKey, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const start = (pageNumber - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, pageNumber]);

  useEffect(() => {
    setPageNumber(1);
  }, [query, statusFilter, modalityFilter, publicationFilter, sortKey, sortDirection]);

  useEffect(() => {
    if (pageNumber > totalPages) setPageNumber(totalPages);
  }, [pageNumber, totalPages]);

  function updateForm<K extends keyof ProcurementFormValues>(
    key: K,
    value: ProcurementFormValues[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function edit(item: Procurement) {
    setEditingId(item.id);
    setForm(toFormValues(item));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(initialProcurementForm);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const body = {
        ...form,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
        openingAt: form.openingAt ? new Date(form.openingAt).toISOString() : undefined,
        deadlineAt: form.deadlineAt ? new Date(form.deadlineAt).toISOString() : undefined,
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
      };

      await authenticatedRequest(
        editingId ? `/procurements/${editingId}` : '/procurements',
        {
          method: editingId ? 'PATCH' : 'POST',
          body: JSON.stringify(body),
        },
      );

      setMessage(editingId ? 'Licitação atualizada.' : 'Licitação criada.');
      resetForm();
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Procurement) {
    if (!window.confirm(`Excluir ${item.number}?`)) return;

    try {
      await authenticatedRequest(`/procurements/${item.id}`, { method: 'DELETE' });
      setMessage('Licitação excluída.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao excluir.');
    }
  }

  async function uploadDocument(event: FormEvent) {
    event.preventDefault();
    if (!documentFor || !documentFile) return;

    const data = new FormData();
    data.append('title', documentTitle);
    data.append('file', documentFile);

    try {
      await authenticatedRequest(`/procurements/${documentFor}/documents`, {
        method: 'POST',
        body: data,
      });
      setDocumentTitle('');
      setDocumentFile(null);
      setDocumentFor(null);
      setMessage('Documento anexado.');
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha no upload.');
    }
  }

  async function removeDocument(itemId: string, documentId: string) {
    try {
      await authenticatedRequest(`/procurements/${itemId}/documents/${documentId}`, {
        method: 'DELETE',
      });
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao remover documento.');
    }
  }

  function clearFilters() {
    setQuery('');
    setStatusFilter('ALL');
    setModalityFilter('ALL');
    setPublicationFilter('ALL');
    setSortKey('deadlineAt');
    setSortDirection('asc');
  }

  return {
    items,
    form,
    editingId,
    query,
    error,
    message,
    saving,
    statusFilter,
    modalityFilter,
    publicationFilter,
    sortKey,
    sortDirection,
    pageNumber,
    documentTitle,
    documentFile,
    documentFor,
    publicationWarning,
    metrics,
    filteredItems,
    paginatedItems,
    totalPages,
    setQuery,
    setStatusFilter,
    setModalityFilter,
    setPublicationFilter,
    setSortKey,
    setSortDirection,
    setPageNumber,
    setDocumentTitle,
    setDocumentFile,
    setDocumentFor,
    updateForm,
    edit,
    resetForm,
    submit,
    remove,
    uploadDocument,
    removeDocument,
    clearFilters,
  };
}

