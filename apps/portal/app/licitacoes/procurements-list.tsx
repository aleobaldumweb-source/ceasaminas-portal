'use client';

import { useMemo, useState } from 'react';

import {
  formatProcurementDate,
  formatProcurementModality,
  formatProcurementMoney,
  procurementStatusLabels,
  type Procurement,
  type ProcurementStatus,
} from '@/lib/procurements';

import styles from './licitacoes.module.css';

type ProcurementsListProps = {
  items: Procurement[];
  unavailable: boolean;
};

export function ProcurementsList({ items, unavailable }: ProcurementsListProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'ALL' | ProcurementStatus>('ALL');

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

    return items.filter((item) => {
      const matchesStatus = status === 'ALL' || item.status === status;
      const searchable = `${item.number} ${item.title} ${item.description}`.toLocaleLowerCase(
        'pt-BR',
      );
      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [items, query, status]);

  const openCount = items.filter((item) => item.status === 'OPEN').length;
  const documentCount = items.reduce((total, item) => total + item.documents.length, 0);

  if (unavailable) {
    return (
      <div className={styles.message} role="status">
        <span aria-hidden="true">!</span>
        <div>
          <h3>Consulta temporariamente indisponível</h3>
          <p>Não foi possível acessar os processos neste momento. Tente novamente em instantes.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.metrics} aria-label="Resumo das licitações">
        <div>
          <strong>{items.length}</strong>
          <span>processos publicados</span>
        </div>
        <div>
          <strong>{openCount}</strong>
          <span>processos abertos</span>
        </div>
        <div>
          <strong>{documentCount}</strong>
          <span>documentos disponíveis</span>
        </div>
      </div>

      <div className={styles.toolbar} role="search">
        <label>
          <span>Pesquisar</span>
          <input
            type="search"
            placeholder="Número, objeto ou palavra-chave"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span>Situação</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as 'ALL' | ProcurementStatus)}
          >
            <option value="ALL">Todas as situações</option>
            {Object.entries(procurementStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.resultsHeader} aria-live="polite">
        <strong>{filtered.length}</strong>{' '}
        {filtered.length === 1 ? 'processo encontrado' : 'processos encontrados'}
      </div>

      {filtered.length > 0 ? (
        <div className={styles.list}>
          {filtered.map((item) => (
            <article className={styles.card} key={item.id}>
              <div className={styles.cardMain}>
                <div className={styles.cardMeta}>
                  <span className={`${styles.status} ${styles[`status${item.status}`]}`}>
                    {procurementStatusLabels[item.status]}
                  </span>
                  <span>{item.number}</span>
                  <span>{formatProcurementModality(item.modality)}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.department ? <small>Setor responsável: {item.department}</small> : null}
              </div>

              <aside
                className={styles.cardAside}
                aria-label={`Informações do processo ${item.number}`}
              >
                <dl>
                  <div>
                    <dt>Prazo</dt>
                    <dd>{formatProcurementDate(item.deadlineAt)}</dd>
                  </div>
                  {item.openingAt ? (
                    <div>
                      <dt>Abertura</dt>
                      <dd>{formatProcurementDate(item.openingAt)}</dd>
                    </div>
                  ) : null}
                  {item.estimatedValue ? (
                    <div>
                      <dt>Valor estimado</dt>
                      <dd>{formatProcurementMoney(item.estimatedValue)}</dd>
                    </div>
                  ) : null}
                </dl>

                {item.documents.length > 0 ? (
                  <div className={styles.documents}>
                    <strong>Documentos</strong>
                    {item.documents.map((document) => (
                      <a href={document.fileUrl} target="_blank" rel="noreferrer" key={document.id}>
                        {document.title} <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noDocuments}>Nenhum documento publicado.</p>
                )}
              </aside>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.message} role="status">
          <span aria-hidden="true">0</span>
          <div>
            <h3>Nenhuma licitação encontrada</h3>
            <p>Altere os filtros ou pesquise por outro termo.</p>
          </div>
        </div>
      )}
    </>
  );
}
