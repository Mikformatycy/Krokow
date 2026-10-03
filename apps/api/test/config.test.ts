import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config';
import { createDatabaseProbe } from '../src/database';

describe('local runtime configuration', () => {
  it('starts on loopback with no implicit demo or database', () => {
    expect(readConfig({})).toMatchObject({ host: '127.0.0.1', port: 3001, dataMode: 'unavailable', database: undefined });
  });
  it('requires explicit synthetic mode', () => expect(readConfig({ API_DATA_MODE: 'synthetic' }).dataMode).toBe('synthetic'));
  it('requires explicit pilot mode for archived real data', () => expect(readConfig({ API_DATA_MODE: 'pilot' }).dataMode).toBe('pilot'));
  it.each(['', 'real'])('rejects unsupported mode %s', (API_DATA_MODE) => expect(() => readConfig({ API_DATA_MODE })).toThrow('Invalid API_DATA_MODE'));
  it.each(['0', '-1', '65536', '3e3', '3001.5', ''])('rejects invalid API port %s', (API_PORT) => expect(() => readConfig({ API_PORT })).toThrow('Invalid API_PORT'));
  it.each(['*', 'https://example.com/path', 'http://user:password@example.com', 'file:///tmp/a', 'null'])('rejects broad or malformed CORS configuration %s', (API_ALLOWED_ORIGINS) => expect(() => readConfig({ API_ALLOWED_ORIGINS })).toThrow('Invalid API_ALLOWED_ORIGINS'));
  it('preserves passwords as connection fields and limits pool/timeouts', () => {
    const config = readConfig({ POSTGRES_DB: 'local', POSTGRES_USER: 'local', POSTGRES_PASSWORD: 'public-test-@:/?&' });
    expect(config.database).toMatchObject({ password: 'public-test-@:/?&', host: '127.0.0.1', max: 2, statement_timeout: 1000 });
  });
  it('rejects partial credentials without including values in the exception', () => {
    expect(() => readConfig({ POSTGRES_PASSWORD: 'private-marker' })).toThrow('Incomplete database configuration');
  });
  it('contains missing or unavailable PostGIS', async () => {
    const absent = createDatabaseProbe(undefined);
    expect(await absent.ready()).toBe(false); await absent.close();
    const closed = createDatabaseProbe({ host: '127.0.0.1', port: 1, user: 'public-test', password: 'public-test', database: 'public-test', connectionTimeoutMillis: 100 });
    expect(await closed.ready()).toBe(false); await closed.close();
  });
});
