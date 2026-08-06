import { defineConfig } from 'eslint/config';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { baseConfig } from './base.js';

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
