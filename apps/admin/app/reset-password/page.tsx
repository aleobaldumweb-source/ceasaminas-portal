'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import { resetPassword } from '../../lib/auth-client';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => setToken(new URLSearchParams(window.location.search).get('token') ?? ''), []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!token) {
      setError('Link de redefinição inválido.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas informadas não coincidem.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setMessage('Senha redefinida. Todas as sessões anteriores foram encerradas.');
      setPassword('');
      setConfirmation('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível redefinir a senha.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-brand-content">
          <span className="login-seal">C</span>
          <p className="eyebrow">CEASAMINAS Digital</p>
          <h1>Defina uma nova senha.</h1>
          <p>Ao concluir, todas as sessões anteriores serão encerradas.</p>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">Segurança da conta</p>
            <h2>Redefinir senha</h2>
            <p className="login-description">Use ao menos 12 caracteres.</p>
          </div>
          <div className="field">
            <label htmlFor="password">Nova senha</label>
            <input
              id="password"
              required
              minLength={12}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirmation">Confirmar senha</label>
            <input
              id="confirmation"
              required
              minLength={12}
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>
          {message && (
            <div className="alert success" role="status">
              {message}
            </div>
          )}
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          <button className="primary login-button" disabled={submitting || Boolean(message)}>
            {submitting ? 'Salvando...' : 'Redefinir senha'}
          </button>
          <Link className="auth-link" href="/login">
            Voltar ao login
          </Link>
        </form>
      </section>
    </main>
  );
}
