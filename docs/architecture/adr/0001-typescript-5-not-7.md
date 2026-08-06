# ADR-0001: Pin TypeScript to 5.9.x rather than the latest 7.x

- **Status:** Accepted
- **Date:** 2026-08-06
- **Deciders:** Platform / Architecture

## Context

The repository mandate says "TypeScript — latest stable". At the time of bootstrapping,
`typescript@latest` is **7.0.2** (the native compiler rewrite).

However, `typescript-eslint@8.66.0` — the latest release, and the only supported way to
run ESLint against TypeScript — declares:

```
"peerDependencies": { "typescript": ">=4.8.4 <6.1.0" }
```

TypeScript 6.0 is still `beta`. So the newest version compatible with the lint toolchain
is 5.9.3.

## Decision

Pin TypeScript to **5.9.3** across the workspace.

## Consequences

We deliberately trade "newest compiler" for "enforceable architecture", because this
repository's boundaries are enforced by **type-aware** ESLint rules. Choosing TS 7 today
would mean losing:

- `@typescript-eslint/no-floating-promises`, `no-misused-promises`
- the `no-unsafe-*` family (the rules that actually keep `any` out)
- `switch-exhaustiveness-check`, `consistent-type-imports`
- every boundary rule that needs type information

That is not a speed-vs-architecture trade we are willing to make. A slightly older
compiler is a temporary cost; an unenforceable architecture is permanent.

## Revisit when

`typescript-eslint` ships a release whose peer range includes TypeScript 7. At that point
this is a one-line version bump plus a full `pnpm check`.

## Enforcement

The version is pinned exactly (`save-exact=true` in `.npmrc`) in every workspace manifest,
so a drifting transitive upgrade cannot happen silently.
