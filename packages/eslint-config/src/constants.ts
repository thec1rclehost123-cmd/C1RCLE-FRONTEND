/** Paths no linter should ever walk into. */
export const IGNORED_PATHS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/out/**',
  '**/build/**',
  '**/coverage/**',
  '**/.turbo/**',
  '**/playwright-report/**',
  '**/test-results/**',
  '**/*.tsbuildinfo',
] as const;

/** Workspace scope for every package and application in this monorepo. */
export const WORKSPACE_SCOPE = '@c1rcle';

/**
 * Applications are named `@c1rcle/app-*`. Nothing — no app, no package —
 * may ever import one. Applications are leaves of the dependency graph.
 */
export const APP_PACKAGE_PATTERN = `${WORKSPACE_SCOPE}/app-*`;

/**
 * Only these packages are allowed to talk to the network directly.
 * Every other workspace member must go through `@c1rcle/api-client`.
 */
export const NETWORK_OWNER_PACKAGES = ['@c1rcle/api-client'] as const;

/**
 * Only this package may read `process.env`. Everything else consumes the
 * validated, typed environment exported by `@c1rcle/config`.
 */
export const ENV_OWNER_PACKAGES = ['@c1rcle/config'] as const;
