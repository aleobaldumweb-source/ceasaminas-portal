'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminSidebar } from '../../components/admin-sidebar';
import { useAuth } from '../../components/auth-provider';
import { authenticatedRequest, setAccessToken } from '../../lib/auth-client';

type Session = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  current: boolean;
};

function describeAgent(value: string | null) {
  if (!value) return 'Dispositivo não identificado';
  if (/Edg\//.test(value)) return 'Microsoft Edge';
  if (/Chrome\//.test(value)) return 'Google Chrome';
  if (/Firefox\//.test(value)) return 'Mozilla Firefox';
  if (/Safari\//.test(value)) return 'Safari';
  return value.slice(0, 90);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export default function SessionsPage() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(await authenticatedRequest<Session[]>('/auth/sessions', { cache: 'no-store' }));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao carregar as sessões.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => void load(), [load]);

  async function revoke(session: Session) {
    setError('');
    setMessage('');
    try {
      await authenticatedRequest(`/auth/sessions/${session.id}`, { method: 'DELETE' });
      if (session.current) {
        setAccessToken(null);
        window.location.assign('/login');
        return;
      }
      setMessage('Sessão revogada com sucesso.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao revogar a sessão.');
    }
  }

  async function revokeOthers() {
    setError('');
    setMessage('');
    try {
      const result = await authenticatedRequest<{ count: number }>('/auth/sessions/others', {
        method: 'DELETE',
      });
      setMessage(`${result.count} sessão(ões) revogada(s).`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha ao revogar as sessões.');
    }
  }

  return (
    <div className="layout">
      <AdminSidebar active="sessions" role={user?.role} />
      <main>
        <header>
          <div>
            <p>SEGURANÇA DA CONTA</p>
            <h1>Minhas sessões</h1>
          </div>
          <div className="header-actions">
            <span>{user?.name}</span>
            <button type="button" className="secondary" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </header>
        {error && (
          <p className="feedback error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="feedback success" role="status">
            {message}
          </p>
        )}
        <section className="panel">
          <div className="section-title">
            <div>
              <p>DISPOSITIVOS CONECTADOS</p>
              <h2>Sessões ativas</h2>
            </div>
            <button
              type="button"
              className="secondary"
              disabled={sessions.length < 2}
              onClick={() => void revokeOthers()}
            >
              Encerrar as outras
            </button>
          </div>
          {loading ? (
            <p role="status">Carregando sessões...</p>
          ) : sessions.length === 0 ? (
            <p>Nenhuma sessão ativa encontrada.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dispositivo</th>
                    <th>Endereço</th>
                    <th>Última atividade</th>
                    <th>Expiração</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <strong>{describeAgent(session.userAgent)}</strong>
                        {session.current && (
                          <>
                            <br />
                            <small>Sessão atual</small>
                          </>
                        )}
                      </td>
                      <td>{session.ipAddress ?? 'Não informado'}</td>
                      <td>{formatDate(session.updatedAt)}</td>
                      <td>{formatDate(session.expiresAt)}</td>
                      <td>
                        <button
                          type="button"
                          className={session.current ? 'danger' : 'secondary'}
                          onClick={() => void revoke(session)}
                        >
                          Encerrar
                        </button>
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
