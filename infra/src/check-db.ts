import pg from 'pg';
import { localDbConfig } from './local-db-config.js';

async function main(): Promise<void> {
  const client = new pg.Client(localDbConfig(process.env));
  try {
    await client.connect();
    await client.query('SELECT PostGIS_Full_Version()');
    console.info('Local PostgreSQL connection and PostGIS query: OK');
  } finally {
    await client.end();
  }
}

try {
  await main();
} catch {
  // Never print the driver error or connection settings: they may contain credentials.
  console.error('Local database check failed. Check .env and run pnpm db:up.');
  process.exitCode = 1;
}
