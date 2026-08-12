'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminSidebar } from '../../components/admin-sidebar';
import { useAuth } from '../../components/auth-provider';
import { authenticatedRequest } from '../../lib/auth-client';

type Status = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
type Item = {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  status: Status;
  sortOrder: number;
  publishedAt: string | null;
};
type Form = Omit<Item, 'id' | 'publishedAt'>;
const emptyForm: Form = {
  title: '',
  description: '',
  category: 'Institucional',
  url: '',
  status: 'DRAFT',
  sortOrder: 0,
};
const statusLabel: Record<Status, string> = {
  DRAFT: 'Rascunho',
  REVIEW: 'Em revisão',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

export default function TransparencyAdminPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Form>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const canEdit = user?.role === 'ADMIN' || user?.role === 'EDITOR';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await authenticatedRequest<Item[]>('/transparency/admin', { cache: 'no-store' }));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar os itens.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  function reset() {
    setForm(emptyForm);
    setEditingId(null);
  }
  function edit(item: Item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      url: item.url,
      status: item.status,
      sortOrder: item.sortOrder,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await authenticatedRequest(editingId ? `/transparency/${editingId}` : '/transparency', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(form),
      });
      setMessage(editingId ? 'Item atualizado com sucesso.' : 'Item criado com sucesso.');
      reset();
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao salvar o item.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Item) {
    if (!window.confirm(`Excluir “${item.title}”?`)) return;
    setError('');
    setMessage('');
    try {
      await authenticatedRequest(`/transparency/${item.id}`, { method: 'DELETE' });
      setMessage('Item excluído.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao excluir o item.');
    }
  }

  return (
    <div className="layout">
      <AdminSidebar active="transparency" role={user?.role} />
      <main>
        <header>
          <div>
            <p>GOVERNANÇA E INFORMAÇÃO</p>
            <h1>Transparência</h1>
          </div>
          <div className="header-actions">
            <span>{user?.name}</span>
            <button type="button" className="secondary" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </header>
        {error && (
          <p role="alert" className="feedback error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="feedback success">
            {message}
          </p>
        )}
        {canEdit && (
          <section className="panel">
            <div className="section-title">
              <div>
                <p>CONTEÚDO PÚBLICO</p>
                <h2>{editingId ? 'Editar item' : 'Novo item'}</h2>
              </div>
            </div>
            <form className="grid2" onSubmit={submit}>
              <label>
                Título
                <input
                  required
                  minLength={3}
                  maxLength={160}
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                />
              </label>
              <label>
                Categoria
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                />
              </label>
              <label className="full">
                Descrição
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                />
              </label>
              <label className="full">
                URL oficial
                <input
                  required
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => update('url', e.target.value)}
                />
              </label>
              <label>
                Status
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value as Status)}
                >
                  {Object.entries(statusLabel).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Ordem
                <input
                  required
                  type="number"
                  min={0}
                  max={10000}
                  value={form.sortOrder}
                  onChange={(e) => update('sortOrder', Number(e.target.value))}
                />
              </label>
              <div className="full row-actions">
                <button className="primary" disabled={saving}>
                  {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Criar item'}
                </button>
                {editingId && (
                  <button type="button" className="secondary" onClick={reset}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </section>
        )}
        <section className="panel">
          <div className="section-title">
            <div>
              <p>PUBLICAÇÃO</p>
              <h2>Itens cadastrados</h2>
            </div>
            <span>{items.length} item(ns)</span>
          </div>
          {loading ? (
            <p role="status">Carregando itens...</p>
          ) : items.length === 0 ? (
            <p>Nenhum item cadastrado.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ordem</th>
                    <th>Item</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.sortOrder}</td>
                      <td>
                        <strong>{item.title}</strong>
                        <br />
                        <small>{item.description}</small>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <span className={`status ${item.status.toLowerCase()}`}>
                          {statusLabel[item.status]}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {canEdit && (
                            <button type="button" className="secondary" onClick={() => edit(item)}>
                              Editar
                            </button>
                          )}
                          {user?.role === 'ADMIN' && (
                            <button
                              type="button"
                              className="danger"
                              onClick={() => void remove(item)}
                            >
                              Excluir
                            </button>
                          )}
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
