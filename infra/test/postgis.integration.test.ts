import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { localDbConfig } from '../src/local-db-config.js';

describe('local PostGIS with synthetic coordinates', () => {
  let client: pg.Client | undefined;

  beforeAll(async () => {
    client = new pg.Client(localDbConfig(process.env));
    await client.connect();
    await client.query('BEGIN READ ONLY');
  });

  afterAll(async () => {
    if (client !== undefined) {
      try {
        await client.query('ROLLBACK');
      } finally {
        await client.end();
      }
    }
  });

  it('has the PostGIS extension enabled in the configured database', async () => {
    if (client === undefined) throw new Error('Database not connected');
    const result = await client.query<{ extname: string }>(
      "SELECT extname FROM pg_extension WHERE extname = 'postgis'",
    );
    expect(result.rows).toEqual([{ extname: 'postgis' }]);
  });

  it('measures synthetic WGS84 geography in metres, not degrees', async () => {
    if (client === undefined) throw new Error('Database not connected');
    const result = await client.query<{ distance_m: number }>(
      `SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
      ) AS distance_m`,
      [0, 0, 0.001, 0],
    );
    const distance = result.rows[0]?.distance_m;
    expect(distance).toBeGreaterThan(110);
    expect(distance).toBeLessThan(112);
  });
});
