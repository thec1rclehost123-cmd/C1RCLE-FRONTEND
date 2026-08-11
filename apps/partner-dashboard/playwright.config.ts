import { defineConfig, devices } from '@playwright/test';

// Keep browser tests isolated from the normal dashboard dev server (3001).
const PORT = 3211;
const baseURL = `http://127.0.0.1:${String(PORT)}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] === undefined ? 0 : 2,
  reporter:
    process.env['CI'] === undefined ? [['list']] : [['github'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm exec next start --port ${String(PORT)}`,
    url: baseURL,
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 120_000,
  },
});
