'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type News = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  status: Status;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
type FormState = Omit<News, 'id' | 'createdAt' | 'updatedAt'>;

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';
const emptyForm: FormState = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  category: 'Institucional',
  status: 'DRAFT',
  publishedAt: null,
};
const labels: Record<Status, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Arquivada',
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(value),
      )
    : '—';
}
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const body = await response.json();
      message = Array.isArray(body.message) ? body.message.join(' ') : (body.message ?? message);
    } catch {}
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
function normalize(raw: any): News {
  return {
    id: String(raw.id),
    title: raw.title ?? '',
    slug: raw.slug ?? '',
    summary: raw.summary ?? raw.excerpt ?? '',
    content: raw.content ?? '',
    category: raw.category ?? 'Institucional',
    status: String(raw.status ?? 'DRAFT').toUpperCase() as Status,
    publishedAt: raw.publishedAt ?? null,
    createdAt: raw.createdAt ?? new Date(0).toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date(0).toISOString(),
  };
}

export default function AdminHome() {
  const [items, setItems] = useState<News[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data: any = await request('/news/admin', { cache: 'no-store' });
      const list = Array.isArray(data) ? data : (data.items ?? data.data ?? []);
      setItems(list.map(normalize));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar notícias.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const metrics = useMemo(
    () => ({
      total: items.length,
      published: items.filter((i) => i.status === 'PUBLISHED').length,
      drafts: items.filter((i) => i.status === 'DRAFT').length,
      archived: items.filter((i) => i.status === 'ARCHIVED').length,
    }),
    [items],
  );
  const filtered = items.filter((i) =>
    `${i.title} ${i.slug} ${i.category}`.toLowerCase().includes(query.toLowerCase()),
  );

  function edit(item: News) {
    setEditing(item.id);
    setForm({
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      content: item.content,
      category: item.category,
      status: item.status,
      publishedAt: item.publishedAt,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function reset() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = {
      ...form,
      slug: slugify(form.slug || form.title),
      publishedAt:
        form.status === 'PUBLISHED' ? (form.publishedAt ?? new Date().toISOString()) : null,
    };
    try {
      if (editing)
        await request(`/news/${editing}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await request('/news', { method: 'POST', body: JSON.stringify(payload) });
      setMessage(editing ? 'Notícia atualizada.' : 'Notícia criada.');
      reset();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }
  async function changeStatus(item: News, status: Status) {
    try {
      await request(`/news/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          publishedAt:
            status === 'PUBLISHED' ? (item.publishedAt ?? new Date().toISOString()) : null,
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao alterar status.');
    }
  }
  async function remove(item: News) {
    if (!confirm(`Excluir “${item.title}”?`)) return;
    try {
      await request(`/news/${item.id}`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao excluir.');
    }
  }

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <b>CEASAMINAS</b>
          <span>Administração</span>
        </div>
        <nav>
          <a className="active" href="#dashboard">
            Visão geral
          </a>
          <a href="#editor">Notícias</a>
          <span>
            Licitações <small>Em breve</small>
          </span>
          <span>
            Mercado <small>Em breve</small>
          </span>
          <span>
            Transparência <small>Em breve</small>
          </span>
        </nav>
        <footer>● Ambiente local</footer>
      </aside>
      <main>
        <header>
          <div>
            <p>AMBIENTE LOCAL</p>
            <h1>Painel administrativo</h1>
          </div>
          <button
            className="primary"
            onClick={() => {
              reset();
              document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Nova notícia
          </button>
        </header>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <section id="dashboard" className="metrics">
          <article>
            <span>Total de notícias</span>
            <strong>{metrics.total}</strong>
          </article>
          <article>
            <span>Publicadas</span>
            <strong>{metrics.published}</strong>
          </article>
          <article>
            <span>Rascunhos</span>
            <strong>{metrics.drafts}</strong>
          </article>
          <article>
            <span>Arquivadas</span>
            <strong>{metrics.archived}</strong>
          </article>
        </section>

        <section id="editor" className="panel editor">
          <div className="section-title">
            <div>
              <p>CONTEÚDO</p>
              <h2>{editing ? 'Editar notícia' : 'Nova notícia'}</h2>
            </div>
            {editing && (
              <button className="secondary" onClick={reset}>
                Cancelar edição
              </button>
            )}
          </div>
          <form onSubmit={submit}>
            <div className="grid2">
              <label>
                Título
                <input
                  required
                  minLength={5}
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: editing ? f.slug : slugify(e.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Slug
                <input
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </label>
            </div>
            <div className="grid2">
              <label>
                Categoria
                <input
                  required
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="PUBLISHED">Publicada</option>
                  <option value="ARCHIVED">Arquivada</option>
                </select>
              </label>
            </div>
            <label>
              Resumo
              <textarea
                required
                minLength={10}
                rows={3}
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </label>
            <label>
              Conteúdo
              <textarea
                required
                minLength={20}
                rows={10}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              />
            </label>
            <div className="form-actions">
              <button className="primary" disabled={saving}>
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar notícia'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel list">
          <div className="section-title">
            <div>
              <p>GERENCIAMENTO</p>
              <h2>Notícias</h2>
            </div>
            <input
              className="search"
              placeholder="Buscar notícia"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="empty">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="empty">Nenhuma notícia encontrada.</div>
          ) : (
            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Notícia</th>
                    <th>Status</th>
                    <th>Publicação</th>
                    <th>Atualização</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <b>{item.title}</b>
                        <small>
                          {item.category} · /{item.slug}
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${item.status.toLowerCase()}`}>
                          {labels[item.status]}
                        </span>
                      </td>
                      <td>{date(item.publishedAt)}</td>
                      <td>{date(item.updatedAt)}</td>
                      <td>
                        <div className="actions">
                          <button onClick={() => edit(item)}>Editar</button>
                          {item.status !== 'PUBLISHED' ? (
                            <button onClick={() => void changeStatus(item, 'PUBLISHED')}>
                              Publicar
                            </button>
                          ) : (
                            <button onClick={() => void changeStatus(item, 'ARCHIVED')}>
                              Arquivar
                            </button>
                          )}
                          <button className="danger" onClick={() => void remove(item)}>
                            Excluir
                          </button>
                        </div>
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
