'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (loading) return;

    if (!user && !isLoginPage) {
      router.replace('/login');
    }

    if (user && isLoginPage) {
      router.replace('/');
    }
  }, [isLoginPage, loading, router, user]);

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="loader" />
        <p>Validando sessão...</p>
      </main>
    );
  }

  if ((!user && !isLoginPage) || (user && isLoginPage)) {
    return null;
  }

  return children;
}
