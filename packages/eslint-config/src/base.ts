import eslintJs from '@eslint/js';
import { defineConfig } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import turboPlugin from 'eslint-plugin-turbo';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { APP_PACKAGE_PATTERN, IGNORED_PATHS } from './constants.js';

/**
 * The base configuration every workspace member extends.
 *
 * It is deliberately strict: this repository is expected to live for years and
 * to be edited by many engineers (and coding agents). Rules that encode
 * architecture are marked ARCHITECTURE and must never be disabled locally.
 */
export const baseConfig = defineConfig(
  { ignores: [...IGNORED_PATHS] },

  eslintJs.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.es2023 },
      parserOptions: {
        /*
         * Every linted file must belong to a real TypeScript project. Each
         * workspace member's `tsconfig.json` is the lint/editor project and
         * covers src, tests and config files; `tsconfig.build.json` is the
         * narrower one that emits. A parsing error here means a file was
         * added outside both — fix the tsconfig, do not widen this.
         */
        projectService: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: {
      'import-x': importX,
      'unused-imports': unusedImports,
      turbo: turboPlugin,
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      /* ---------------------------------------------------------------
       * TypeScript discipline — no escape hatches.
       * ------------------------------------------------------------ */
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-ignore': true,
          'ts-nocheck': true,
          'ts-check': false,
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 20,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      /* ---------------------------------------------------------------
       * Dead code.
       * ------------------------------------------------------------ */
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      /* ---------------------------------------------------------------
       * ARCHITECTURE — module graph integrity.
       * ------------------------------------------------------------ */
      'import-x/no-cycle': ['error', { maxDepth: Infinity, ignoreExternal: true }],
      'import-x/no-self-import': 'error',
      'import-x/no-relative-packages': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-mutable-exports': 'error',
      'import-x/no-default-export': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          pathGroups: [{ pattern: '@c1rcle/**', group: 'internal', position: 'before' }],
          /*
           * Type-only imports are kept out of the workspace path group so
           * they collect in the trailing `type` group instead of being
           * interleaved with value imports from the same package.
           */
          pathGroupsExcludedImportTypes: ['builtin', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      /* ---------------------------------------------------------------
       * ARCHITECTURE — boundary enforcement.
       *
       * Deep imports are forbidden: a package's public API is exactly what
       * its `exports` map declares. Applications are leaves and may never be
       * imported by anything.
       * ------------------------------------------------------------ */
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [APP_PACKAGE_PATTERN, `${APP_PACKAGE_PATTERN}/**`],
              message:
                'ARCHITECTURE: applications are leaves. Nothing may import an application. Move the shared code into packages/.',
            },
            {
              group: ['@c1rcle/*/src/*', '@c1rcle/*/dist/*', '@c1rcle/*/*/*'],
              message:
                'ARCHITECTURE: deep imports are forbidden. Import the package root and let its `exports` map define the public API.',
            },
            {
              group: ['axios', 'axios/*', 'got', 'node-fetch', 'superagent', 'ky'],
              message:
                'ARCHITECTURE: every backend request goes through @c1rcle/api-client. Do not add another HTTP client.',
            },
            {
              group: [
                'firebase-admin',
                'firebase-admin/*',
                'pg',
                'mysql2',
                'mongodb',
                'prisma',
                '@prisma/client',
              ],
              message:
                'SECURITY: this is a frontend-only repository. Backend SDKs and database clients are never allowed here.',
            },
          ],
        },
      ],

      /* ---------------------------------------------------------------
       * ARCHITECTURE — the network and the environment have single owners.
       * Overridden to `off` inside @c1rcle/api-client and @c1rcle/config.
       * ------------------------------------------------------------ */
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'ARCHITECTURE: raw fetch() is forbidden. Use @c1rcle/api-client, which owns base URL, auth, retries, timeouts and typed errors.',
        },
        {
          name: 'XMLHttpRequest',
          message: 'ARCHITECTURE: use @c1rcle/api-client for all backend communication.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'ARCHITECTURE: direct process.env access is forbidden. Import the validated, typed environment from @c1rcle/config.',
        },
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            'ARCHITECTURE: raw fetch() is forbidden. Use @c1rcle/api-client for all backend communication.',
        },
      ],

      /* ---------------------------------------------------------------
       * General hygiene.
       * ------------------------------------------------------------ */
      'no-console': 'error',
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],
      'object-shorthand': 'error',
      'no-implicit-coercion': 'error',
      'turbo/no-undeclared-env-vars': 'error',
    },
  },

  /* Test files relax exactly two things and nothing else. */
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/test/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  /*
   * Ambient declaration files must mirror the shape of the module they
   * describe, including its default export.
   */
  {
    files: ['**/*.d.ts'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },

  /* Config files are the one place a default export is correct. */
  {
    files: ['**/*.config.ts', '**/*.config.mts', '**/eslint.config.ts'],
    rules: {
      'import-x/no-default-export': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  /* Prettier must always win the formatting argument. Keep last. */
  prettierConfig,
);
