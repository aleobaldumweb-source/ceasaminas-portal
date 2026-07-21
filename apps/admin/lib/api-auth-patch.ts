/*
Substitua o helper request() de apps/admin/lib/api.ts por esta versão.
Ela injeta o access token e tenta renovar a sessão uma única vez em caso
de resposta 401.
*/

import { getAccessToken, refreshSession } from './auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';

export async function authenticatedRequest<T>(
  path: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 401 && retry) {
    await refreshSession();
    return authenticatedRequest<T>(path, init, false);
  }

  if (!response.ok) {
    let message = `A API respondeu com status ${response.status}.`;

    try {
      const body = (await response.json()) as {
        message?: string | string[];
      };

      message = Array.isArray(body.message) ? body.message.join(' ') : (body.message ?? message);
    } catch {}

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
