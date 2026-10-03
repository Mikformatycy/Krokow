import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.integration.test.ts'],
    setupFiles: ['test/setup-db.ts'],
    hookTimeout: 10000,
    testTimeout: 10000,
  },
});
