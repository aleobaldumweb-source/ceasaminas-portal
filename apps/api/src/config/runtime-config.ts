const DEFAULT_API_PREFIX = 'api/v1';
const DEFAULT_API_PORT = 3333;
const DEFAULT_PORTAL_ORIGIN = 'http://localhost:3000';
const DEFAULT_ADMIN_ORIGIN = 'http://localhost:3001';

export function apiPrefix(environment: NodeJS.ProcessEnv = process.env) {
  const prefix = (environment.API_PREFIX ?? DEFAULT_API_PREFIX).trim().replace(/^\/+|\/+$/g, '');
  if (!prefix) throw new Error('API_PREFIX deve possuir ao menos um segmento.');
  return prefix;
}

export function authCookiePath(environment: NodeJS.ProcessEnv = process.env) {
  return `/${apiPrefix(environment)}/auth`;
}

export function apiPublicUrl(environment: NodeJS.ProcessEnv = process.env) {
  const configured = environment.API_PUBLIC_URL?.trim().replace(/\/+$/, '');
  if (!configured) {
    if (environment.NODE_ENV === 'production') {
      throw new Error('API_PUBLIC_URL é obrigatória em produção.');
    }
    return `http://localhost:${apiPort(environment)}`;
  }
  return validateHttpOrigin(configured, 'API_PUBLIC_URL');
}

export function apiPort(environment: NodeJS.ProcessEnv = process.env) {
  const rawPort = environment.API_PORT?.trim() || String(DEFAULT_API_PORT);
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('API_PORT deve ser um número inteiro entre 1 e 65535.');
  }
  return port;
}

export function corsOrigins(environment: NodeJS.ProcessEnv = process.env) {
  const configured = environment.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const origins = configured?.length
    ? configured
    : [environment.ADMIN_ORIGIN ?? DEFAULT_ADMIN_ORIGIN, DEFAULT_PORTAL_ORIGIN];

  return [...new Set(origins.map(validateOrigin))];
}

function validateOrigin(origin: string) {
  return validateHttpOrigin(origin, 'Origem CORS');
}

function validateHttpOrigin(origin: string, label: string) {
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new Error(`${label} inválida: ${origin}`);
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(`${label} inválida: ${origin}`);
  }
  return parsed.origin;
}
