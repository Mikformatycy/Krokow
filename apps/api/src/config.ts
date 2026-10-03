import type { PoolConfig } from 'pg';

type Environment = Readonly<Record<string, string | undefined>>;
export interface ApiConfig {
  host: string;
  port: number;
  dataMode: 'unavailable' | 'synthetic' | 'pilot';
  allowedOrigins: string[];
  database: PoolConfig | undefined;
}
function port(raw: string, name: string): number {
  if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > 65535) throw new Error(`Invalid ${name}`);
  return Number(raw);
}

export function readConfig(env: Environment): ApiConfig {
  const host = env['API_HOST'] ?? '127.0.0.1';
  if (!['127.0.0.1', '0.0.0.0', '::1'].includes(host)) throw new Error('Invalid API_HOST');
  const dataMode = env['API_DATA_MODE'] ?? 'unavailable';
  if (dataMode !== 'synthetic' && dataMode !== 'unavailable' && dataMode !== 'pilot') throw new Error('Invalid API_DATA_MODE');
  const allowedOrigins = (env['API_ALLOWED_ORIGINS'] ?? 'http://localhost:8081,http://localhost:8085').split(',').filter(Boolean);
  for (const origin of allowedOrigins) {
    let url: URL;
    try { url = new URL(origin); } catch { throw new Error('Invalid API_ALLOWED_ORIGINS'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || url.username || url.password) throw new Error('Invalid API_ALLOWED_ORIGINS');
  }
  const keys = ['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'] as const;
  const hasDatabase = keys.some((key) => env[key] !== undefined);
  let database: PoolConfig | undefined;
  if (hasDatabase) {
    if (keys.some((key) => !env[key]?.trim())) throw new Error('Incomplete database configuration');
    if ((env['POSTGRES_HOST'] ?? '127.0.0.1') !== '127.0.0.1') throw new Error('B-01 requires local PostgreSQL');
    database = {
      host: '127.0.0.1', port: port(env['POSTGRES_PORT'] ?? '54329', 'POSTGRES_PORT'),
      database: env['POSTGRES_DB']!, user: env['POSTGRES_USER']!, password: env['POSTGRES_PASSWORD']!,
      max: 2, connectionTimeoutMillis: 1000, statement_timeout: 1000, query_timeout: 1200,
      application_name: 'krok-api',
    };
  }
  return { host, port: port(env['API_PORT'] ?? '3001', 'API_PORT'), dataMode, allowedOrigins, database };
}
