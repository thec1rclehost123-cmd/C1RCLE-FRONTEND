import { defineConfig } from 'eslint/config';

import { libraryConfig } from '@c1rcle/eslint-config/library';

export default defineConfig(
  ...libraryConfig,
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-globals': 'off',
      'no-restricted-syntax': 'off',
    },
  },
);
