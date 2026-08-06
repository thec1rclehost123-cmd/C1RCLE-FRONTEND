# C1RCLE Partner Dashboard

The venue-operator application. Manage venues, availability and bookings.

**Audience:** Authenticated partner staff.

This application **builds, runs, tests and deploys entirely on its own**. It shares
code with the other two applications only through `packages/*`, and it may never
import from `apps/*` — that is enforced by lint and by `pnpm boundaries`.

## Run it

```bash
cp .env.example .env.local     # then fill in the values
pnpm install                   # from the repository root
pnpm --filter @c1rcle/app_partner-dashboard dev
```

Dev server: <http://localhost:3001>

## Its scripts

| Command          | What it does                                |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Dev server on port 3001 (Turbopack)         |
| `pnpm build`     | Production build                            |
| `pnpm start`     | Serve the production build on port 3001     |
| `pnpm lint`      | ESLint, including the architecture rules    |
| `pnpm typecheck` | `tsc` with the shared strict config         |
| `pnpm test`      | Vitest unit and component tests             |
| `pnpm test:e2e`  | Playwright, against a real production build |

Build only this app and the packages it actually uses:

```bash
pnpm turbo run build --filter=@c1rcle/app_partner-dashboard
```

## Layout

```
src/
  app/          App Router — routes, layouts, loading and error boundaries
  components/   Components specific to THIS application
  features/     Feature modules (co-located UI, hooks and schemas)
  lib/          App-local helpers and identity (title, navigation)
e2e/            Playwright specs
```

If something here starts being useful to a second application, it moves into
`packages/` — it does not get copied.

## Environment

Every variable is declared in `packages/config/src/schema.ts` and validated at
startup. A missing or malformed value **fails the build** rather than producing a
half-working page. See `.env.example`.

## Deployment

Deployed independently of the other two applications. `vercel.json` pins the
build to this directory; `Dockerfile` is the portable equivalent. A failure in
this application cannot affect the others.
