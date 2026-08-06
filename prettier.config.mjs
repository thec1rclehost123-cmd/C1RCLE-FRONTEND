/**
 * Single shared Prettier configuration for the entire monorepo.
 * Applications and packages must NOT define their own.
 *
 * @type {import("prettier").Config}
 */
const config = {
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  arrowParens: 'always',
  bracketSpacing: true,
  bracketSameLine: false,
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  overrides: [
    {
      files: ['*.json', '*.jsonc', '*.yaml', '*.yml'],
      options: { singleQuote: false },
    },
    {
      files: '*.md',
      options: { proseWrap: 'preserve' },
    },
  ],
};

export default config;
