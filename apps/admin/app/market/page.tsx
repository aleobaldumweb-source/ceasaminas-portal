'use client';

import {
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '../../components/auth-provider';
import { authenticatedRequest as request } from '../../lib/auth-client';

type ImportRecord = {
  id: string;
  sourceFile: string;
  market: string;
  referenceAt: string;
  importedAt: string;
  _count?: { prices?: number };
};
type PriceItem = {
  productName: string;
  category: string;
  unit: string;
  minPrice: number;
  avgPrice: number;
  maxPrice: number;
  variation: number;
  referenceAt: string;
};
type Dashboard = {
  summary: { totalProducts: number; bulletinDate: string | null; market: string | null };
  highlights: {
    highestIncrease: PriceItem | null;
    highestDecrease: PriceItem | null;
    mostViewed: PriceItem | null;
  };
  prices: PriceItem[];
};
type ImportResult = { records: number; replaced: boolean; durationMs: number };

const date = (value?: string | null, time = false) =>
  value
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        ...(time ? { timeStyle: 'short' as const } : {}),
      }).format(new Date(value))
    : '—';
const money = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const variation = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toFixed(2).replace('.', ',')}%`;

export default function MarketPage() {
  const { user, logout } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [replace, setReplace] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [history, market] = await Promise.all([
        request<ImportRecord[]>('/market/imports?limit=50', { cache: 'no-store' }),
        request<Dashboard>('/market/dashboard?days=30', { cache: 'no-store' }),
      ]);
      setImports(history);
      setDashboard(market);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar o mercado.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const prices = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    return (dashboard?.prices ?? []).filter(
      (item) =>
        !term ||
        `${item.productName} ${item.category} ${item.unit}`
          .toLocaleLowerCase('pt-BR')
          .includes(term),
    );
  }, [dashboard, query]);

  function choose(selected: File | null) {
    if (!selected) return;
    if (!/\.(xls|xlsx)$/i.test(selected.name))
      return setError('Selecione um arquivo .xls ou .xlsx.');
    if (selected.size > 15 * 1024 * 1024) return setError('O arquivo deve ter no máximo 15 MB.');
    setFile(selected);
    setError('');
    setMessage('');
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    choose(event.target.files?.[0] ?? null);
    event.target.value = '';
  }
  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files?.[0] ?? null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setError('Selecione um boletim.');
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const body = new FormData();
      body.append('file', file);
      const result = await request<ImportResult>(
        `/market/import${replace ? '?replace=true' : ''}`,
        { method: 'POST', body },
      );
      setMessage(
        `${result.replaced ? 'Boletim substituído' : 'Boletim importado'} com ${result.records} registros em ${result.durationMs} ms.`,
      );
      setFile(null);
      setReplace(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao importar.');
    } finally {
      setUploading(false);
    }
  }

  const up = dashboard?.highlights.highestIncrease;
  const down = dashboard?.highlights.highestDecrease;

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <b>CEASAMINAS</b>
          <span>Administração</span>
        </div>
        <nav>
          <a href="/">Visão geral</a>
          <a href="/#editor">Notícias</a>
          <span>
            Licitações <small>Em breve</small>
          </span>
          <a className="active" href="/market">
            Mercado
          </a>
          <a href="/procurements">Licitações</a>
          <span>
            Transparência <small>Em breve</small>
          </span>
        </nav>
        <footer>● Ambiente local</footer>
      </aside>
      <main>
        <header>
          <div>
            <p>MERCADO</p>
            <h1>Boletins e preços</h1>
          </div>
          <div className="header-actions">
            <div className="user-menu">
              <div className="user-menu-copy">
                <strong>{user?.name}</strong>
                <small>{user?.role}</small>
              </div>
              <button className="secondary" onClick={() => void logout()}>
                Sair
              </button>
            </div>
            <button className="secondary" onClick={() => void load()} disabled={loading}>
              {loading ? 'Atualizando...' : 'Atualizar dados'}
            </button>
          </div>
        </header>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <section className="metrics market-metrics">
          <article>
            <span>Produtos no boletim</span>
            <strong>{dashboard?.summary.totalProducts ?? 0}</strong>
          </article>
          <article>
            <span>Data do boletim</span>
            <strong className="metric-date">{date(dashboard?.summary.bulletinDate)}</strong>
          </article>
          <article>
            <span>Maior alta</span>
            <strong className="metric-variation positive">
              {up ? variation(up.variation) : '—'}
            </strong>
            <small>{up?.productName ?? 'Sem histórico'}</small>
          </article>
          <article>
            <span>Maior queda</span>
            <strong className="metric-variation negative">
              {down ? variation(down.variation) : '—'}
            </strong>
            <small>{down?.productName ?? 'Sem histórico'}</small>
          </article>
        </section>
        <section className="panel">
          <div className="section-title">
            <div>
              <p>IMPORTAÇÃO</p>
              <h2>Novo boletim de preços</h2>
            </div>
            <span className="panel-note">XLS ou XLSX · máximo de 15 MB</span>
          </div>
          <form onSubmit={submit}>
            <div
              className={`market-dropzone${dragging ? ' dragging' : ''}${file ? ' selected' : ''}`}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <div className="drop-icon">⇧</div>
              <strong>{file?.name ?? 'Arraste o boletim para esta área'}</strong>
              <span>
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB selecionados`
                  : 'ou procure o arquivo no computador'}
              </span>
              <label className="file-button">
                {file ? 'Trocar arquivo' : 'Selecionar arquivo'}
                <input type="file" accept=".xls,.xlsx" onChange={onFile} />
              </label>
            </div>
            <div className="import-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={replace}
                  onChange={(e) => setReplace(e.target.checked)}
                />
                <span>
                  <b>Substituir boletim existente</b>
                  <small>Use apenas para corrigir a mesma data e mercado.</small>
                </span>
              </label>
              <button className="primary" disabled={!file || uploading}>
                {uploading ? 'Importando...' : 'Importar boletim'}
              </button>
            </div>
          </form>
        </section>
        <section className="panel">
          <div className="section-title">
            <div>
              <p>HISTÓRICO</p>
              <h2>Boletins importados</h2>
            </div>
          </div>
          {loading ? (
            <div className="empty">Carregando...</div>
          ) : imports.length === 0 ? (
            <div className="empty">Nenhum boletim importado.</div>
          ) : (
            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Arquivo</th>
                    <th>Mercado</th>
                    <th>Referência</th>
                    <th>Importação</th>
                    <th>Registros</th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <b>{item.sourceFile}</b>
                      </td>
                      <td>{item.market}</td>
                      <td>{date(item.referenceAt)}</td>
                      <td>{date(item.importedAt, true)}</td>
                      <td>{item._count?.prices ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="panel">
          <div className="section-title">
            <div>
              <p>COTAÇÕES</p>
              <h2>Preços do último boletim</h2>
            </div>
            <input
              className="search"
              placeholder="Buscar produto ou categoria"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="empty">Carregando...</div>
          ) : prices.length === 0 ? (
            <div className="empty">Nenhuma cotação encontrada.</div>
          ) : (
            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Unidade</th>
                    <th>Mínimo</th>
                    <th>Médio</th>
                    <th>Máximo</th>
                    <th>Variação</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((item, index) => (
                    <tr key={`${item.productName}-${item.unit}-${index}`}>
                      <td>
                        <b>{item.productName}</b>
                        <small>{item.category}</small>
                      </td>
                      <td>{item.unit}</td>
                      <td>{money(item.minPrice)}</td>
                      <td>
                        <b>{money(item.avgPrice)}</b>
                      </td>
                      <td>{money(item.maxPrice)}</td>
                      <td>
                        <span
                          className={`variation-pill ${item.variation > 0 ? 'up' : item.variation < 0 ? 'down' : 'stable'}`}
                        >
                          {variation(item.variation)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
