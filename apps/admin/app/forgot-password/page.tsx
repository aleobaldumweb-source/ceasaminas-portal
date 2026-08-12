'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { requestPasswordReset } from '../../lib/auth-client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await requestPasswordReset(email);
      setMessage('Se o e-mail estiver cadastrado e ativo, enviaremos um link de redefinição.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a solicitação.');
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
          <h1>Recupere seu acesso.</h1>
          <p>O link de segurança é individual, expira em 30 minutos e só pode ser usado uma vez.</p>
        </div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div>
            <p className="eyebrow">Recuperação de conta</p>
            <h2>Esqueci minha senha</h2>
            <p className="login-description">Informe seu e-mail institucional.</p>
          </div>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
          <button className="primary login-button" disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar link'}
          </button>
          <Link className="auth-link" href="/login">
            Voltar ao login
          </Link>
        </form>
      </section>
    </main>
  );
}
