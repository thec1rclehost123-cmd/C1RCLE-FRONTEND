import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { baseConfig } from './base.js';
import { APP_PACKAGE_PATTERN } from './constants.js';

/**
 * Configuration for anything that renders React.
 *
 * Accessibility rules are errors, not warnings: WCAG AA is a product
 * requirement, so a violation must fail the build like any other defect.
 */
export const reactConfig = defineConfig(
  ...baseConfig,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.serviceworker },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.strict,

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      /* React correctness */
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      /*
       * Redefines base's no-restricted-imports (rather than extending it) so
       * this package's own pattern set stays visible in one place — kept in
       * sync with base.ts and next.ts, which each redefine it too.
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
            {
              group: ['firebase', 'firebase/*'],
              message:
                'ARCHITECTURE: firebase is being removed from this repository. Auth goes through @c1rcle/auth.',
            },
          ],
        },
      ],

      /* Styling is Tailwind + design tokens only — never inline style objects. */
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
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            'STYLING: inline styles are forbidden. Use Tailwind utilities backed by the design tokens in @c1rcle/design-system.',
        },
      ],
    },
  },
);
