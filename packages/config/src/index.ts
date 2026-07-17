export type RuntimeEnvironment = 'development' | 'test' | 'production';

export function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function readPort(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) return fallback;

  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Environment variable ${name} must be a valid TCP port.`);
  }

  return port;
}
