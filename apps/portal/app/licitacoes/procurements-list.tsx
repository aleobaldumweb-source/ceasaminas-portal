'use client';
import { useMemo, useState } from 'react';

type Document = { id: string; title: string; fileUrl: string; fileSize: number };
type Item = {
  id: string;
  number: string;
  title: string;
  description: string;
  modality: string;
  status: string;
  deadlineAt: string | null;
  openingAt: string | null;
  estimatedValue: string | null;
  department: string | null;
  documents: Document[];
};
const labels: Record<string, string> = {
  OPEN: 'Aberta',
  UNDER_REVIEW: 'Em análise',
  SUSPENDED: 'Suspensa',
  CLOSED: 'Encerrada',
  CANCELLED: 'Cancelada',
};
export function ProcurementsList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (status === 'ALL' || i.status === status) &&
          `${i.number} ${i.title} ${i.description}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query, status],
  );
  return (
    <>
      <div className="list-toolbar">
        <input
          aria-label="Pesquisar licitações"
          placeholder="Pesquisar por número, objeto ou descrição"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Filtrar por situação"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">Todas</option>
          {Object.entries(labels).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <p className="result-count">{filtered.length} processo(s) encontrado(s)</p>
      <div className="notice-list">
        {filtered.map((item) => (
          <article key={item.id}>
            <div>
              <span className={`status procurement-${item.status.toLowerCase()}`}>
                {labels[item.status] ?? item.status}
              </span>
              <p>
                {item.number} · {item.modality.replaceAll('_', ' ')}
              </p>
              <h2>{item.title}</h2>
              <p className="notice-description">{item.description}</p>
              {item.department && <small>Setor responsável: {item.department}</small>}
            </div>
            <div>
              <span>Prazo</span>
              <strong>
                {item.deadlineAt
                  ? new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(item.deadlineAt))
                  : 'Não informado'}
              </strong>
              {item.estimatedValue && (
                <small>
                  Valor estimado:{' '}
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    Number(item.estimatedValue),
                  )}
                </small>
              )}
              <div className="notice-documents">
                {item.documents.map((doc) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer">
                    {doc.title} ↗
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="empty-state">
          <h2>Nenhuma licitação encontrada</h2>
          <p>Altere os filtros ou tente outro termo de pesquisa.</p>
        </div>
      )}
    </>
  );
}
