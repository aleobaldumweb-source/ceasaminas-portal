'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../../components/auth-provider';
import { authenticatedRequest } from '../../lib/auth-client';
import type { UserRole } from '../../lib/auth-types';

type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
};

const roleLabel: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  JOURNALIST: 'Jornalista',
  AUDITOR: 'Auditor',
};
const statusLabel: Record<UserStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  BLOCKED: 'Bloqueado',
};

export default function UsersPage() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<ManagedUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('JOURNALIST');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setItems(await authenticatedRequest<ManagedUser[]>('/users', { cache: 'no-store' }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar usuários.');
    }
  }
  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.name} ${item.email} ${item.role}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await authenticatedRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });
      setName('');
      setEmail('');
      setPassword('');
      setRole('JOURNALIST');
      setMessage('Usuário criado com sucesso.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao criar usuário.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(item: ManagedUser, status: UserStatus) {
    setError('');
    setMessage('');
    try {
      await authenticatedRequest(`/users/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setMessage(`Status de ${item.name} atualizado.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao atualizar usuário.');
    }
  }

  if (user?.role !== 'ADMIN')
    return (
      <main className="standalone">
        <h1>Acesso restrito</h1>
        <p>Somente administradores podem gerenciar usuários.</p>
      </main>
    );

  return (
    <div className="layout">
      <aside>
        <div className="brand">
          <b>CEASAMINAS</b>
          <span>Administração</span>
        </div>
        <nav>
          <a href="/">Notícias</a>
          <a href="/market">Mercado</a>
          <a href="/procurements">Licitações</a>
          <a className="active" href="/users">
            Usuários
          </a>
        </nav>
        <footer>● Ambiente administrativo</footer>
      </aside>
      <main>
        <header>
          <div>
            <p>SEGURANÇA E ACESSO</p>
            <h1>Usuários</h1>
          </div>
          <div className="header-actions">
            <span>{user.name}</span>
            <button className="secondary" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </header>
        {error && <p className="feedback error">{error}</p>}
        {message && <p className="feedback success">{message}</p>}
        <section className="panel">
          <div className="section-title">
            <div>
              <p>NOVO ACESSO</p>
              <h2>Criar usuário</h2>
            </div>
          </div>
          <form onSubmit={submit} className="grid2">
            <label>
              Nome
              <input
                required
                minLength={3}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              E-mail
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              Senha temporária
              <input
                required
                minLength={10}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Perfil
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                {Object.entries(roleLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <button className="primary" disabled={saving}>
                {saving ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </section>
        <section className="panel">
          <div className="section-title">
            <div>
              <p>CONTROLE DE ACESSO</p>
              <h2>Usuários cadastrados</h2>
            </div>
            <input
              placeholder="Buscar usuário"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Último acesso</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <br />
                      <small>{item.email}</small>
                    </td>
                    <td>{roleLabel[item.role]}</td>
                    <td>
                      <span className={`status ${item.status.toLowerCase()}`}>
                        {statusLabel[item.status]}
                      </span>
                    </td>
                    <td>
                      {item.lastLoginAt
                        ? new Intl.DateTimeFormat('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }).format(new Date(item.lastLoginAt))
                        : 'Nunca'}
                    </td>
                    <td>
                      <select
                        aria-label={`Alterar status de ${item.name}`}
                        value={item.status}
                        disabled={item.id === user.id}
                        onChange={(e) => void updateStatus(item, e.target.value as UserStatus)}
                      >
                        {Object.entries(statusLabel).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
