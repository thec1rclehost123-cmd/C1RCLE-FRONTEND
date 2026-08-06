# C1RCLE Web — Architecture

This document is the contract. Tooling enforces it; this file explains _why_.

## Shape

```
apps/         Next.js applications. Leaves of the dependency graph.
packages/     Reusable libraries. Never depend on an application.
tooling/      Repository automation (boundary checks, codegen, CI helpers).
docs/         Architecture notes and ADRs.
```

## The three laws

1. **An application may depend on packages. Nothing may depend on an application.**
   Applications are leaves. If two apps need the same code, it moves into `packages/`.
2. **A package's public API is exactly its `exports` map.** Deep imports
   (`@c1rcle/ui/src/...`) are forbidden. This is enforced by the resolver _and_ by lint.
3. **No cycles.** Not between packages, not within one.

## Single owners

Some capabilities have exactly one owner in the repository. Every other module goes
through it. These are enforced as lint errors, not conventions.

| Capability            | Sole owner              | Everyone else                            |
| --------------------- | ----------------------- | ---------------------------------------- |
| Network / HTTP        | `@c1rcle/api-client`    | no `fetch`, no `axios`, no second client |
| Environment variables | `@c1rcle/config`        | no `process.env`                         |
| Design tokens / theme | `@c1rcle/design-system` | no inline styles, no ad-hoc palettes     |
| Icons                 | `@c1rcle/icons`         | no direct icon-library installs          |

## What the frontend is responsible for

Rendering, calling the backend, loading state, error state, caching server state, and
collecting input. **Business logic lives in the backend repository.** If a rule about
_what is true_ is being written in this repo, it is in the wrong repo.

## Security posture

This repository ships code to browsers. It therefore contains **no** backend SDKs, no
Firebase Admin, no database clients, and no secrets. Lint rules block those imports
outright so the mistake cannot reach review.

## Decision records

See [`adr/`](./adr/). Every non-obvious choice — especially ones that look like they
contradict "use the latest version" — is written down there with its revisit condition.
