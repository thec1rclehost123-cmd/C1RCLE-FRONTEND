import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { reactConfig } from './react.js';

/**
 * Configuration for the three Next.js applications.
 *
 * Applications are leaves of the dependency graph: they may consume packages,
 * but nothing may consume them.
 */
export const nextConfig = defineConfig(
  ...reactConfig,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },

  /*
   * The App Router is convention-driven: these files must default-export.
   * This is the only place the no-default-export rule is relaxed.
   */
  {
    files: [
      'src/app/**/page.tsx',
      'src/app/**/layout.tsx',
      'src/app/**/template.tsx',
      'src/app/**/loading.tsx',
      'src/app/**/error.tsx',
      'src/app/**/not-found.tsx',
      'src/app/**/global-error.tsx',
      'src/app/**/default.tsx',
      'src/app/**/route.ts',
      'src/app/**/opengraph-image.tsx',
      'src/app/**/icon.tsx',
      'src/app/**/sitemap.ts',
      'src/app/**/robots.ts',
      'src/app/**/manifest.ts',
      'src/middleware.ts',
      'src/instrumentation.ts',
      'next.config.ts',
    ],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },

  /*
   * Build tooling that runs in Node, outside the application bundle.
   *
   * Playwright and Next config files legitimately read the real environment:
   * they are not shipped to a browser, and @c1rcle/config exists to protect
   * *runtime* code from unvalidated values, not to police the test runner.
   */
  {
    files: ['playwright.config.ts', 'next.config.ts', 'e2e/**/*.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },

  /*
   * PostCSS is the one config Next requires in plain JS — it has no
   * TypeScript loader for it. It contains no logic, so it is not linted.
   */
  { ignores: ['postcss.config.mjs'] },

  /*
   * Applications never install icon libraries or duplicate a design system.
   * They consume @c1rcle/icons and @c1rcle/ui.
   */
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@c1rcle/app-*', '@c1rcle/app-*/**'],
              message:
                'ARCHITECTURE: applications are leaves. An application may never import another application.',
            },
            {
              group: ['@c1rcle/*/src/*', '@c1rcle/*/dist/*', '@c1rcle/*/*/*'],
              message: 'ARCHITECTURE: deep imports are forbidden. Import the package root only.',
            },
            {
              group: ['lucide-react', 'react-icons', 'react-icons/*', '@heroicons/*'],
              message:
                'ARCHITECTURE: applications never install icon libraries. Import icons from @c1rcle/icons.',
            },
            {
              group: ['axios', 'axios/*', 'got', 'node-fetch', 'superagent', 'ky'],
              message: 'ARCHITECTURE: every backend request goes through @c1rcle/api-client.',
            },
            {
              group: [
                'firebase-admin',
                'firebase-admin/*',
                'pg',
                'mysql2',
                'mongodb',
                '@prisma/client',
              ],
              message: 'SECURITY: backend SDKs and database clients are never allowed here.',
            },
          ],
        },
      ],
    },
  },
);
