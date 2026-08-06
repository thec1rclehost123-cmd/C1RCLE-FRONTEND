import { defineConfig } from 'eslint/config';

import { nextConfig } from '@c1rcle/eslint-config/next';

export default defineConfig(...nextConfig, {
  ignores: ['.next/**', 'next-env.d.ts'],
});
