import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60000,
  use: { baseURL: 'http://localhost:8085', trace: 'retain-on-failure', screenshot: 'on' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'narrow-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: [{
    command: 'pnpm --filter @krok/api start',
    url: 'http://127.0.0.1:3002/healthz',
    reuseExistingServer: false,
    timeout: 60000,
    env: { API_DATA_MODE: 'synthetic', API_HOST: '127.0.0.1', API_PORT: '3002' },
  }, {
    command: 'pnpm exec expo start --web --localhost --port 8085 --max-workers 2',
    url: 'http://localhost:8085',
    reuseExistingServer: false,
    timeout: 180000,
    env: { CI: '1', EXPO_NO_TELEMETRY: '1', EXPO_PUBLIC_API_URL: 'http://127.0.0.1:3002' },
  }],
});
