import { defineConfig } from 'eslint/config';

import { baseConfig } from './base.js';

/**
 * Configuration for non-React shared packages.
 *
 * A package is a reusable library. It may never reach "upward" into an
 * application, and it may never assume which application is consuming it.
 */
export const libraryConfig = defineConfig(...baseConfig, {
  files: ['src/**/*.ts'],
  rules: {
    /*
     * A library's public API is its index. Everything it exports is a
     * long-lived contract, so it must be explicitly typed.
     */
    '@typescript-eslint/explicit-module-boundary-types': 'error',
  },
});
