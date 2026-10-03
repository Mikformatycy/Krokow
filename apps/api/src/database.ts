import pg from 'pg';
import type { PoolConfig } from 'pg';

export function createDatabaseProbe(config: PoolConfig | undefined) {
  const pool = config ? new pg.Pool(config) : undefined;
  // Idle connection failures are contained; never serialize pg errors or credentials.
  pool?.on('error', () => undefined);
  return {
    async ready(): Promise<boolean> {
      if (!pool) return false;
      try {
        await pool.query('SELECT PostGIS_Version()');
        return true;
      } catch { return false; }
    },
    async close(): Promise<void> { await pool?.end(); },
  };
}
