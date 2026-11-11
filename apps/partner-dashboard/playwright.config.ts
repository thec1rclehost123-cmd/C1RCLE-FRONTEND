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
    command:
      'mkdir -p .next/standalone/apps/partner-dashboard/.next/static .next/standalone/apps/partner-dashboard/public && cp -R .next/static/. .next/standalone/apps/partner-dashboard/.next/static/ && cp -R public/. .next/standalone/apps/partner-dashboard/public/ && node .next/standalone/apps/partner-dashboard/server.js',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORT: String(PORT),
      NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:8080',
      NEXT_PUBLIC_APP_NAME: 'C1RCLE Partner Dashboard',
      NEXT_PUBLIC_ENVIRONMENT: 'development',
      NEXT_PUBLIC_APP_ID: 'partner',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'e2e-firebase-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'e2e.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'e2e',
    },
  },
});
