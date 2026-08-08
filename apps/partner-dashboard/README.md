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

### Vercel

Create the project against the repository root, then set:

| Setting                    | Value                                               |
| -------------------------- | --------------------------------------------------- |
| Root Directory             | `apps/partner-dashboard`                            |
| Include files outside root | **enabled** — the build reaches up to the workspace |
| Framework Preset           | Next.js                                             |
| Build / Install Command    | leave blank — `vercel.json` supplies both           |
| Node.js Version            | 22.x or later (see root `engines`)                  |

Everything else comes from `vercel.json`, which runs the build through Turbo
from the workspace root so the shared packages are built first.

No environment variables are required to build or boot today: nothing in
`src/` reads `process.env`. Set the `.env.example` values anyway so the
contract is in place before the app starts calling a real API.

Two things worth knowing:

- `output: 'standalone'` is applied **only off Vercel**. The Dockerfile copies
  `.next/standalone`, but Vercel builds its own serverless output and does not
  consume it.
- `turbo.json` enables signed remote caching. It degrades to local-only when
  `TURBO_TOKEN` / `TURBO_TEAM` are absent, so the build does not depend on it.

### Before this is a real deployment

`src/lib/firebase/client.ts` is a **mock** that accepts any password, and the
routes under `src/app/api/` return fixtures. Both must be replaced with the
real Firebase client and gateway before this is exposed to anyone.
