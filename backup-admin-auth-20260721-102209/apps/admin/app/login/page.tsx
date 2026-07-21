'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '../../components/auth-provider';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Não foi possível entrar.');
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
          <h1>Gestão institucional segura.</h1>
          <p>
            Ambiente administrativo para publicação de notícias, transparência e serviços digitais.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Acesso restrito</p>
            <h2>Entrar no painel</h2>
            <p className="login-description">Use suas credenciais institucionais.</p>
          </div>

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              autoComplete="username"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nome@ceasaminas.com.br"
              required
              type="email"
              value={email}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              autoComplete="current-password"
              id="password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <div className="feedback feedback-error" role="alert">
              {error}
            </div>
          ) : null}

          <button
            className="button button-primary login-button"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>

          <small className="security-note">
            Sessão protegida por token de curta duração e renovação segura.
          </small>
        </form>
      </section>
    </main>
  );
}
