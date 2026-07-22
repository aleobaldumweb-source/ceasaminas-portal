'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../components/auth-provider';
import { authenticatedRequest as request } from '../lib/auth-client';

type Status = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
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
  REVIEW: 'Em revisão',
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

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—';
}

function normalize(raw: Record<string, unknown>): News {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    slug: String(raw.slug ?? ''),
    summary: String(raw.summary ?? raw.excerpt ?? ''),
    content: String(raw.content ?? ''),
    category: String(raw.category ?? 'Institucional'),
    status: String(raw.status ?? 'DRAFT').toUpperCase() as Status,
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    createdAt: String(raw.createdAt ?? new Date(0).toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? new Date(0).toISOString()),
  };
}

export default function AdminHome() {
  const { user, logout } = useAuth();
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
      const data = await request<News[] | { items?: News[]; data?: News[] }>('/news/admin', {
        cache: 'no-store',
      });

      const list = Array.isArray(data) ? data : (data.items ?? data.data ?? []);

      setItems(list.map((item) => normalize(item as unknown as Record<string, unknown>)));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar notícias.');
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
      published: items.filter((item) => item.status === 'PUBLISHED').length,
      drafts: items.filter((item) => item.status === 'DRAFT').length,
      archived: items.filter((item) => item.status === 'ARCHIVED').length,
    }),
    [items],
  );

  const filtered = items.filter((item) =>
    `${item.title} ${item.slug} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      if (editing) {
        await request(`/news/${editing}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await request('/news', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setMessage(editing ? 'Notícia atualizada.' : 'Notícia criada.');
      reset();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Falha ao salvar.');
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
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Falha ao alterar status.');
    }
  }

  async function remove(item: News) {
    if (!confirm(`Excluir “${item.title}”?`)) return;

    try {
      await request(`/news/${item.id}`, { method: 'DELETE' });
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Falha ao excluir.');
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

          <div className="header-actions">
            <div className="user-menu">
              <div className="user-menu-copy">
                <strong>{user?.name}</strong>
                <small>{user?.role}</small>
              </div>
              <button className="secondary" onClick={() => void logout()} type="button">
                Sair
              </button>
            </div>

            <button
              className="primary"
              onClick={() => {
                reset();
                document.getElementById('editor')?.scrollIntoView({ behavior: 'smooth' });
              }}
              type="button"
            >
              Nova notícia
            </button>
          </div>
        </header>

        {error ? <div className="alert error">{error}</div> : null}
        {message ? <div className="alert success">{message}</div> : null}

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
            {editing ? (
              <button className="secondary" onClick={reset} type="button">
                Cancelar edição
              </button>
            ) : null}
          </div>

          <form onSubmit={submit}>
            <div className="grid2">
              <label>
                Título
                <input
                  required
                  minLength={5}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                      slug: editing ? current.slug : slugify(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Slug
                <input
                  required
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid2">
              <label>
                Categoria
                <input
                  required
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as Status,
                    }))
                  }
                >
                  <option value="DRAFT">Rascunho</option>
                  <option value="REVIEW">Em revisão</option>
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
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              Conteúdo
              <textarea
                required
                minLength={20}
                rows={10}
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    content: event.target.value,
                  }))
                }
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
              onChange={(event) => setQuery(event.target.value)}
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
                      <td>{formatDate(item.publishedAt)}</td>
                      <td>{formatDate(item.updatedAt)}</td>
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
