/**
 * Ambient declarations for ESLint plugins that do not ship TypeScript types.
 *
 * These are NOT type suppressions — they are the minimal honest surface we
 * consume. Delete a shim as soon as the upstream plugin ships its own types.
 */

declare module 'eslint-plugin-jsx-a11y' {
  import type { Linter } from 'eslint';

  const plugin: {
    readonly flatConfigs: {
      readonly recommended: Linter.Config;
      readonly strict: Linter.Config;
    };
  };

  export default plugin;
}
