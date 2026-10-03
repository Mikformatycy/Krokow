import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

// B owns the real pilot API on 3003. This runner never starts or stops it.
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
    env: { CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3003' },
  },
});
