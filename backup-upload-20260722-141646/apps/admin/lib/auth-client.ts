import type { AuthResponse } from './auth-types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/api/v1';
const ACCESS_TOKEN_KEY = 'ceasa_access_token';

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(' ')
      : (body.message ?? 'Não foi possível concluir a solicitação.');
  } catch {
    return 'Não foi possível concluir a solicitação.';
  }
}

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(await parseError(response));
  const data = (await response.json()) as AuthResponse;
  setAccessToken(data.accessToken);
  return data;
}

export async function refreshSession() {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    setAccessToken(null);
    throw new Error('Sessão não encontrada.');
  }
  const data = (await response.json()) as AuthResponse;
  setAccessToken(data.accessToken);
  return data;
}

export async function logout() {
  const token = getAccessToken();
  await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).catch(() => undefined);
  setAccessToken(null);
}

export async function authenticatedRequest<T>(
  path: string,
  init?: RequestInit,
  retry = true,
): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(init?.headers);
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, credentials: 'include', headers });
  if (response.status === 401 && retry) {
    await refreshSession();
    return authenticatedRequest<T>(path, init, false);
  }
  if (!response.ok) throw new Error(await parseError(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
