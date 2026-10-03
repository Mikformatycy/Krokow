import { defineConfig } from '@playwright/test';

// Pure logic tests: no API, Metro, browser or occupied phone ports.
export default defineConfig({
  testDir: '.', testMatch: ['simulation.spec.ts', 'simulation-speech.spec.ts', 'speech-coordinator.spec.ts', 'simulation-summary.spec.ts'], workers: 1, fullyParallel: false,
  outputDir: '../test-results/simulation',
});
