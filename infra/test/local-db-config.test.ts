import { describe, expect, it } from 'vitest';
import { localDbConfig } from '../src/local-db-config.js';

const exampleEnv = {
  POSTGRES_DB: 'synthetic_test',
  POSTGRES_USER: 'synthetic_user',
  POSTGRES_PASSWORD: 'synthetic_password',
};

describe('local database configuration', () => {
  it('uses the same loopback host and default port as local Compose', () => {
    expect(localDbConfig(exampleEnv)).toMatchObject({
      host: '127.0.0.1', port: 54329, database: 'synthetic_test',
    });
  });

  it('accepts a custom port without changing a password containing special characters', () => {
    const password = 'synthetic:p@ss/word?#&';
    expect(localDbConfig({ ...exampleEnv, POSTGRES_PORT: '15432', POSTGRES_PASSWORD: password }))
      .toMatchObject({ port: 15432, password });
  });

  it.each(['0', '-1', '65536', '1.5', '1e3', 'NaN', '', ' 5432 '])('rejects invalid port %j', (port) => {
    expect(() => localDbConfig({ ...exampleEnv, POSTGRES_PORT: port })).toThrow('POSTGRES_PORT');
  });

  it.each(['POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'])('requires %s without echoing credentials', (key) => {
    expect(() => localDbConfig({ ...exampleEnv, [key]: ' ' })).toThrow(`Missing environment variable: ${key}`);
    expect(() => localDbConfig({ ...exampleEnv, [key]: undefined })).toThrow(`Missing environment variable: ${key}`);
  });

  it('rejects remote hosts without disclosing their values', () => {
    expect(() => localDbConfig({ ...exampleEnv, POSTGRES_HOST: 'private.example.invalid' }))
      .toThrow(/^Local database checks require POSTGRES_HOST=127\.0\.0\.1$/);
  });
});
