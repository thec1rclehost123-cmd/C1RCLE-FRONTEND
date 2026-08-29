import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    /*
     * Test-only public env. Shipped code never hardcodes a base URL — it reads
     * NEXT_PUBLIC_API_BASE_URL through @c1rcle/config. This sentinel only lets
     * createApiClient() resolve *a* URL under test; it never reaches a build.
     * Same sentinel host @c1rcle/config's own env.test.ts uses.
     */
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'https://api.c1rcle.test',
      NEXT_PUBLIC_APP_NAME: 'Partner Dashboard',
      NEXT_PUBLIC_ENVIRONMENT: 'development',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'src/index.ts'],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
