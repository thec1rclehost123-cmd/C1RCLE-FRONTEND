import { defineConfig, devices } from '@playwright/test';

/**
 * Post-deploy verification config — points the EXACT SAME spec files at
 * `e2e/` against a real, already-deployed Vercel URL instead of a locally
 * built-and-served instance. No `webServer`: there is nothing to build here,
 * the thing under test already exists in production.
 *
 *   SMOKE_URL=https://www.thec1rcle.com pnpm playwright test --config playwright.prod.config.ts
 *
 * Used by the `verify-admin-console-deploy` CI job (`.github/workflows/ci.yml`)
 * after `wait-for-vercel-deploy.mjs` confirms the new commit is live — never
 * run this against a URL you have not already confirmed serves the commit
 * under test, or a pass just proves the PREVIOUS build still works.
 */
// Bracket access, not dot access: `noPropertyAccessFromIndexSignature` is on
// in this repo, so `process.env.SMOKE_URL` is a TS4111 build error. Matches
// `playwright.config.ts`.
const baseURL = process.env['SMOKE_URL'];
if (!baseURL) {
  throw new Error('playwright.prod.config.ts requires SMOKE_URL to point at the live deployment.');
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 2,
  reporter: [['github'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
});
