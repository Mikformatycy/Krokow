import type { ClientConfig } from 'pg';

type Environment = Readonly<Record<string, string | undefined>>;

function required(env: Environment, key: string): string {
  const value = env[key];
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

/** Connection settings for the local F-01 checks, not the future API config. */
export function localDbConfig(env: Environment): ClientConfig {
  const host = env['POSTGRES_HOST'] ?? '127.0.0.1';
  if (host !== '127.0.0.1') {
    throw new Error('Local database checks require POSTGRES_HOST=127.0.0.1');
  }

  const rawPort = env['POSTGRES_PORT'] ?? '54329';
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('POSTGRES_PORT must be an integer from 1 to 65535');
  }

  return {
    host,
    port,
    database: required(env, 'POSTGRES_DB'),
    user: required(env, 'POSTGRES_USER'),
    password: required(env, 'POSTGRES_PASSWORD'),
    connectionTimeoutMillis: 5000,
    statement_timeout: 5000,
    application_name: 'krok-local-check',
  };
}
