'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isPublicAuthPage = ['/login', '/forgot-password', '/reset-password'].includes(pathname);

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicAuthPage) {
      router.replace('/login');
    } else if (user && isPublicAuthPage) {
      router.replace('/');
    }
  }, [isPublicAuthPage, loading, router, user]);

  if (loading) {
    return (
      <main className="auth-loading">
        <div className="loader" />
        <p>Validando sessão...</p>
      </main>
    );
  }

  if ((!user && !isPublicAuthPage) || (user && isPublicAuthPage)) {
    return null;
  }

  return children;
}
