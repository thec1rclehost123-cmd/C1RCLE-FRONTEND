import { defineConfig } from 'eslint/config';

import { libraryConfig } from '@c1rcle/eslint-config/library';

export default defineConfig(...libraryConfig, {
  // src/** is generated verbatim from C1RCLE-BACKEND/packages/contracts by
  // scripts/export-contracts.mjs. Don't lint generated code — fix it upstream.
  ignores: ['src/contracts/**', 'src/client.ts', 'src/index.ts'],
});
