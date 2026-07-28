'use client';

import { useMemo, useState } from 'react';

import {
  formatMarketDate,
  formatMarketMoney,
  formatMarketVariation,
  type MarketDashboard,
  type MarketImport,
  type MarketPrice,
} from '@/lib/market';

import styles from './market.module.css';

type MarketPanelProps = {
  dashboard: MarketDashboard | null;
  imports: MarketImport[];
  unavailable: boolean;
};

type SortKey =
  'productName' | 'category' | 'unit' | 'minPrice' | 'avgPrice' | 'maxPrice' | 'variation';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function comparePrices(left: MarketPrice, right: MarketPrice, key: SortKey) {
  if (key === 'productName' || key === 'category' || key === 'unit') {
    return left[key].localeCompare(right[key], 'pt-BR');
  }

  return left[key] - right[key];
}

function variationClass(value: number) {
  if (value > 0) return styles.positive;
  if (value < 0) return styles.negative;
  return styles.neutral;
}

function downloadCsv(rows: MarketPrice[]) {
  const header = [
    'Produto',
    'Categoria',
    'Unidade',
    'Preço mínimo',
    'Preço médio',
    'Preço máximo',
    'Variação',
    'Referência',
  ];

  const values = rows.map((item) => [
    item.productName,
    item.category,
    item.unit,
    item.minPrice.toFixed(2).replace('.', ','),
    item.avgPrice.toFixed(2).replace('.', ','),
    item.maxPrice.toFixed(2).replace('.', ','),
    item.variation.toFixed(2).replace('.', ','),
    item.referenceAt ? formatMarketDate(item.referenceAt) : '',
  ]);

  const csv = [header, ...values]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';'))
    .join('\r\n');

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;
  link.download = `ceasaminas-mercado-${new Date().toISOString().slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function PriceHighlight({ label, item }: { label: string; item: MarketPrice | null }) {
  return (
    <article className={styles.metricCard}>
      <span>{label}</span>

      <strong className={item ? variationClass(item.variation) : styles.neutral}>
        {item ? formatMarketVariation(item.variation) : '—'}
      </strong>

      <small>{item?.productName ?? 'Aguardando boletim comparativo'}</small>
    </article>
  );
}
function HistoryChart({ dashboard }: { dashboard: MarketDashboard }) {
  const items = dashboard.history?.items ?? [];

  if (items.length < 2) {
    return (
      <div className={styles.chartEmpty}>
        <strong>Histórico em formação</strong>

        <p>
          Importe novos boletins para visualizar a evolução do preço médio de{' '}
          {dashboard.history?.productName ?? dashboard.filters.product}.
        </p>
      </div>
    );
  }

  const width = 900;
  const height = 260;
  const padding = 34;

  const averages = items.map((i) => i.avgPrice);

  const minimum = Math.min(...averages);
  const maximum = Math.max(...averages);

  const range = maximum - minimum || 1;

  const coordinates = items.map((item, index) => ({
    x: padding + (index / Math.max(items.length - 1, 1)) * (width - padding * 2),

    y: height - padding - ((item.avgPrice - minimum) / range) * (height - padding * 2),
  }));

  const polyline = coordinates.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={styles.chartWrap}>
      <svg className={styles.chart} viewBox={`0 0 ${width} ${height}`}>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} />

        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />

        <polyline points={polyline} fill="none" stroke="currentColor" strokeWidth="4" />

        {items.map((item, index) => {
          const point = coordinates[index];

          if (!point) {
            return null;
          }

          return (
            <circle key={item.referenceAt} cx={point.x} cy={point.y} r="5">
              <title>
                {item.label}: {formatMarketMoney(item.avgPrice)}
              </title>
            </circle>
          );
        })}
      </svg>

      <div className={styles.chartLegend}>
        <span>
          Mínimo: <strong>{formatMarketMoney(minimum)}</strong>
        </span>

        <span>
          Máximo: <strong>{formatMarketMoney(maximum)}</strong>
        </span>
      </div>
    </div>
  );
}
export function MarketPanel({ dashboard, imports, unavailable }: MarketPanelProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [unit, setUnit] = useState('Todas');

  const [sortKey, setSortKey] = useState<SortKey>('productName');

  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const prices = dashboard?.prices ?? [];

  const categories = useMemo(
    () =>
      Array.from(new Set(prices.map((item) => item.category)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [prices],
  );

  const units = useMemo(
    () =>
      Array.from(new Set(prices.map((item) => item.unit)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [prices],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = normalize(query.trim());

    return prices
      .filter((item) => {
        const matchesQuery =
          !normalizedQuery ||
          normalize(`${item.productName} ${item.category} ${item.unit}`).includes(normalizedQuery);

        const matchesCategory = category === 'Todas' || item.category === category;

        const matchesUnit = unit === 'Todas' || item.unit === unit;

        return matchesQuery && matchesCategory && matchesUnit;
      })
      .sort((left, right) => {
        const result = comparePrices(left, right, sortKey);

        return sortDirection === 'asc' ? result : -result;
      });
  }, [prices, query, category, unit, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const visibleRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetPage() {
    setPage(1);
  }

  function updateSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }

    resetPage();
  }

  if (unavailable || !dashboard) {
    return (
      <section className="section container">
        <div className={styles.unavailable} role="alert">
          <strong>Dados de mercado temporariamente indisponíveis</strong>

          <p>
            A API não respondeu neste momento. Verifique se o serviço está em execução e tente
            novamente.
          </p>
        </div>
      </section>
    );
  }

  const firstVisible = filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const lastVisible = Math.min(currentPage * pageSize, filtered.length);

  return (
    <section className={`${styles.panel} container`}>
      <div className={styles.metrics} aria-label="Resumo do mercado">
        <article className={styles.metricCard}>
          <span>Produtos no boletim</span>

          <strong>{dashboard.summary.totalProducts}</strong>

          <small>{dashboard.summary.market ?? 'Mercado não informado'}</small>
        </article>

        <article className={styles.metricCard}>
          <span>Data do boletim</span>

          <strong>{formatMarketDate(dashboard.summary.bulletinDate)}</strong>

          <small>Atualizado em {formatMarketDate(dashboard.updatedAt, true)}</small>
        </article>

        <PriceHighlight label="Maior aumento" item={dashboard.highlights.highestIncrease} />

        <PriceHighlight label="Maior redução" item={dashboard.highlights.highestDecrease} />
      </div>

      <div className={styles.sectionHeading}>
        <div>
          <p className="eyebrow">Boletim mais recente</p>

          <h2>Preços, filtros e análise</h2>
        </div>

        <button
          className={styles.exportButton}
          type="button"
          onClick={() => downloadCsv(filtered)}
          disabled={!filtered.length}
        >
          Exportar CSV
        </button>
      </div>

      <div className={styles.filters}>
        <label>
          <span>Buscar produto</span>

          <input
            type="search"
            value={query}
            placeholder="Tomate, Banana..."
            onChange={(e) => {
              setQuery(e.target.value);
              resetPage();
            }}
          />
        </label>

        <label>
          <span>Categoria</span>

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              resetPage();
            }}
          >
            <option>Todas</option>

            {categories.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Unidade</span>

          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              resetPage();
            }}
          >
            <option>Todas</option>

            {units.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Itens por página</span>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              resetPage();
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.resultBar}>
        <span>
          Exibindo
          <strong>
            {' '}
            {firstVisible}–{lastVisible}
          </strong>{' '}
          de <strong>{filtered.length}</strong> resultados
        </span>
        {(query || category !== 'Todas' || unit !== 'Todas') && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setCategory('Todas');
              setUnit('Todas');
              resetPage();
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {[
                ['productName', 'Produto'],
                ['category', 'Categoria'],
                ['unit', 'Unidade'],
                ['minPrice', 'Mínimo'],
                ['avgPrice', 'Médio'],
                ['maxPrice', 'Máximo'],
                ['variation', 'Variação'],
              ].map(([key, label]) => (
                <th key={key} scope="col">
                  <button
                    type="button"
                    onClick={() => updateSort(key as SortKey)}
                    aria-label={`Ordenar por ${label}`}
                  >
                    {label}

                    {sortKey === key && (
                      <span aria-hidden="true">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((item) => (
              <tr key={`${item.productName}-${item.unit}`}>
                <td data-label="Produto">
                  <strong>{item.productName}</strong>
                </td>

                <td data-label="Categoria">{item.category}</td>

                <td data-label="Unidade">{item.unit}</td>

                <td data-label="Mínimo">{formatMarketMoney(item.minPrice)}</td>

                <td data-label="Médio">
                  <strong>{formatMarketMoney(item.avgPrice)}</strong>
                </td>

                <td data-label="Máximo">{formatMarketMoney(item.maxPrice)}</td>

                <td data-label="Variação">
                  <span className={`${styles.variationBadge} ${variationClass(item.variation)}`}>
                    {formatMarketVariation(item.variation)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!visibleRows.length && (
          <div className={styles.noResults}>
            Nenhum produto corresponde aos filtros selecionados.
          </div>
        )}
      </div>

      <nav className={styles.pagination} aria-label="Paginação dos preços">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => setPage((value) => Math.max(1, value - 1))}
        >
          ← Anterior
        </button>

        <span>
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
        </span>

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
        >
          Próxima →
        </button>
      </nav>

      <section className={styles.analysis}>
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">Evolução de preços</p>

            <h2>{dashboard.history?.productName || dashboard.filters.product}</h2>
          </div>

          <span className={styles.periodBadge}>
            Últimos {dashboard.history?.days ?? dashboard.filters.days} dias
          </span>
        </div>

        <HistoryChart dashboard={dashboard} />
      </section>

      <section className={styles.bulletins}>
        <div className={styles.sectionHeading}>
          <div>
            <p className="eyebrow">Base documental</p>

            <h2>Boletins importados</h2>
          </div>
        </div>

        <div className={styles.bulletinGrid}>
          {imports.map((item) => (
            <article key={item.id}>
              <span>{formatMarketDate(item.referenceAt)}</span>

              <h3>{item.sourceFile}</h3>

              <p>{item.market}</p>

              <small>
                {item._count?.prices ?? 0} cotações · importado em{' '}
                {formatMarketDate(item.importedAt, true)}
              </small>
            </article>
          ))}

          {!imports.length && (
            <div className={styles.chartEmpty}>Nenhum boletim importado foi encontrado.</div>
          )}
        </div>
      </section>
    </section>
  );
}
