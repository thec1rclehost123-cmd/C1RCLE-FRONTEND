import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['e2e/**', 'node_modules/**'],
    /*
     * Test-only public env. Shipped code never hardcodes a base URL — it reads
     * NEXT_PUBLIC_API_BASE_URL through @c1rcle/config. This sentinel only lets
     * the auth-BFF proxy resolve a gateway URL under test; it never reaches a
     * build. Same sentinel host @c1rcle/config's own env.test.ts uses.
     */
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'https://api.c1rcle.test',
      NEXT_PUBLIC_APP_NAME: 'Partner Dashboard',
      NEXT_PUBLIC_ENVIRONMENT: 'development',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.*', 'src/app/**/layout.tsx'],
    },
  },
});
