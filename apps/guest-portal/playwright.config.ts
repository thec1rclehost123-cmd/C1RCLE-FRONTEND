import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
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
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    reuseExistingServer: process.env['CI'] === undefined,
    timeout: 120_000,
  },
});
