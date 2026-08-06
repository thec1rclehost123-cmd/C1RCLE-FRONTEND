# ADR-0002: ESLint 9 (not 10), and `eslint-plugin-import-x` (not `eslint-plugin-import`)

- **Status:** Accepted
- **Date:** 2026-08-06
- **Deciders:** Platform / Architecture

## Context

Two independent constraints in the lint toolchain:

1. **ESLint 10 vs accessibility.** `eslint@10.8.0` is the latest release, but
   `eslint-plugin-jsx-a11y@6.10.2` peer-caps at `eslint: ^9`. Every other plugin we need
   (`typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-unused-imports`,
   `eslint-plugin-import-x`) already supports 10.
2. **`eslint-plugin-import` vs ESLint 9+.** The classic `eslint-plugin-import@2.32.0`
   peer-caps at `eslint: ^9` too, and its flat-config support lags badly.

WCAG AA conformance is an explicit product requirement of this platform, and the way we
make it real is by failing the build on a11y violations — not by asking reviewers to
remember.

## Decision

- Pin **ESLint 9.39.5** (with `@eslint/js@9.39.1`).
- Use **`eslint-plugin-import-x`** for all import-graph rules (`no-cycle`, `order`,
  `no-relative-packages`, `no-default-export`, …). It is the maintained fork, is
  flat-config native, and supports ESLint 8/9/10.

## Consequences

- The a11y ruleset stays enabled at `strict`, as errors.
- Migrating to ESLint 10 later is a version bump plus a `pnpm check`, because
  `import-x` already spans both majors — the only blocker is `jsx-a11y`.
- `eslint-import-resolver-typescript` peers on _both_ `eslint-plugin-import` and
  `eslint-plugin-import-x`. Since we install only the latter, `pnpm-workspace.yaml`
  carries an explicit `peerDependencyRules.ignoreMissing` entry for
  `eslint-plugin-import`. This is intentional and documented rather than silently
  suppressed by loosening `strict-peer-dependencies`.

## Rejected alternative

`eslint-plugin-boundaries` for the app/package boundary rules. It is capable, but it
requires a parallel "element type" taxonomy that must be kept in sync with the real
folder layout — a second source of truth that drifts. We instead encode boundaries with
`no-restricted-imports` patterns keyed off the package **name** convention
(`@c1rcle/app-*`), backed by a standalone graph checker in `tooling/scripts` that CI runs
independently of ESLint.
