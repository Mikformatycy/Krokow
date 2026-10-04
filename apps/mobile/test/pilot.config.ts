import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// Requires an existing pilot API (default 3003); a separate instance can be selected for testing.
const configuredApiUrl: unknown = process.env['PILOT_TEST_API_URL'];
const apiUrl = typeof configuredApiUrl === 'string' ? configuredApiUrl : 'http://127.0.0.1:3003';
export default defineConfig({
  testDir: './pilot', testMatch: '*.e2e.ts', workers: 1, retries: 0,
  outputDir: '../test-results/pilot',
  use: { baseURL: 'http://localhost:8085', trace: 'retain-on-failure', screenshot: 'on' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'narrow', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    cwd: resolve(__dirname, '..'),
    command: 'pnpm exec expo start --web --localhost --port 8085 --max-workers 2',
    url: 'http://localhost:8085', reuseExistingServer: false, timeout: 180000,
    env: { CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_PUBLIC_API_URL: apiUrl },
  },
});
