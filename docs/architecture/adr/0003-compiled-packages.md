# ADR-0003: Shared packages are compiled, not consumed as source

- **Status:** Accepted
- **Date:** 2026-08-06
- **Deciders:** Platform / Architecture

## Context

A Turborepo can share code between apps in two ways:

- **Just-in-time packages** — the package's `exports` point at `src/*.ts`, and each app
  transpiles it via Next's `transpilePackages`. Zero build step, fastest local loop.
- **Compiled packages** — each package runs `tsc -b`, emits `dist/` with `.d.ts`, and apps
  consume the built output.

## Decision

Use **compiled packages**, with TypeScript **composite projects and project references**.

## Rationale

- **The public API becomes real.** An app can only reach what the `exports` map exposes.
  With source-consumed packages, `@c1rcle/ui/src/internal/thing` resolves happily; here it
  cannot. The boundary is enforced by the module resolver, not just by a lint rule.
- **Type errors surface at the package that caused them**, not in three apps at once.
- **Turbo caches package builds.** Three apps that depend on `@c1rcle/ui` build it once.
- **`.d.ts` emission proves each package type-checks in isolation**, which is exactly the
  "shared packages compile" done-criterion.
- Project references make incremental builds genuinely incremental.

## Consequences

- `pnpm dev` must build packages before apps start; `turbo run dev` handles this via
  `dependsOn: ["^build"]`, and each package exposes `dev: tsc -b --watch`.
- Every new package must be added to the root solution `tsconfig.json` `references` array.
  The boundary checker in `tooling/scripts` fails CI if a workspace member is missing.
- Packages emit `jsx: react-jsx`, so apps receive plain JS and no `transpilePackages`
  configuration is needed.
- `dist/` is generated and git-ignored. The "no JavaScript files" rule applies to authored
  source, not to build output.
