import { defineConfig } from 'eslint/config';

import { libraryConfig } from './src/library.js';

/*
 * The lint config lints itself with its own rules — from source, not from
 * dist, so it never needs to be built before it can be checked.
 */
export default defineConfig(...libraryConfig, {
  files: ['src/**/*.ts'],
  rules: {
    /* Flat configs are plain data; typed-boundary annotations add nothing. */
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
});
