import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { baseConfig } from './base.js';
import { APP_PACKAGE_PATTERN } from './constants.js';

/**
 * Configuration for the Expo/React Native scanner app.
 *
 * Extends `baseConfig` directly, NOT `reactConfig` — `reactConfig` bans
 * inline `style={}` JSX attributes to force Tailwind on the web apps, which
 * would incorrectly flag React Native's idiomatic `style={}`/`StyleSheet`
 * usage (there is no Tailwind/DOM here). Everything else architectural in
 * `baseConfig` (module boundaries, no-raw-fetch, no-raw-process.env) still
 * applies unchanged.
 */
export const reactNativeConfig = defineConfig(
  ...baseConfig,

  {
    languageOptions: {
      globals: { ...globals.node, __DEV__: 'readonly' },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  reactHooks.configs.flat['recommended-latest'],

  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.config.ts', '**/*.config.mts'],
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      /*
       * Redefines base's no-restricted-imports (same pattern base.ts/react.ts/
       * next.ts each follow) so this file's own set stays visible in one place.
       */
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
                'firebase',
                'firebase/*',
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

      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'ARCHITECTURE: direct process.env access is forbidden. Import the validated, typed environment from this app\'s own env module (Expo uses EXPO_PUBLIC_* — @c1rcle/config is Next.js-only).',
        },
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            'ARCHITECTURE: raw fetch() is forbidden. Use @c1rcle/api-client for all backend communication.',
        },
      ],
    },
  },

  /*
   * Expo Router route files under app/ must default-export the screen
   * component — this is the file-based-routing contract, not a style choice.
   * Scoped narrowly so every other file in the app still bans default export.
   * Path is relative to this consuming app's own eslint.config.ts (flat
   * config resolves `files` relative to the config file's directory).
   */
  {
    files: ['app/**/*.tsx'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },

  /*
   * app.config.ts reads raw process.env to populate Expo's `extra` block —
   * @types/node's index-signature return here resolves loosely enough to
   * trip the type-aware "unsafe assignment" family of rules. Turn off just
   * that family for this one file rather than disabling type-checking
   * outright (unlike babel/metro.config.js, this file IS a real member of
   * the tsconfig project and benefits from the rest of the strict rules).
   */
  {
    files: ['app.config.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },

  /*
   * Env ownership: this app's src/config/env.ts is its ONE env-owner module
   * (Expo's EXPO_PUBLIC_* + expo-constants, not Next's NEXT_PUBLIC_*, so
   * @c1rcle/config cannot own this instead) — plus app.config.ts itself,
   * which MUST read raw process.env to populate Expo's `extra` block in the
   * first place (env.ts then reads it back out via expo-constants).
   */
  {
    files: ['src/config/env.ts', 'app.config.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  /*
   * Untyped tooling config (Metro/Babel) — plain CommonJS, outside every
   * tsconfig `include`, so no type-aware rule can run against it. Disabled
   * individually rather than via `tseslint.configs.disableTypeChecked`
   * (a tseslint-`config()`-shaped preset, not a plain rule-off object —
   * mixing it into `defineConfig`'s array would silently do the wrong thing).
   */
  {
    files: ['babel.config.js', 'metro.config.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.commonjs },
      parserOptions: { projectService: false, project: false },
    },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/no-require-imports': 'off',
      'import-x/no-default-export': 'off',
    },
  },
);
