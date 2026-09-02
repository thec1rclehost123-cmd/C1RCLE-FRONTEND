# Sagar — App shell + CSP (Track 2)

**Branch:** `feat/app-shell-csp` (off `staging`)
**Lane:** `INTERN-TASKS-2026-08-27.md` → Track 2, plan Phase 5 Part A + Phase 8 CSP
**Date:** 2026-09-02

Track 2 minus the org bullets. `src/lib/org/**`, `src/lib/access/**` and
`partner/select-organization/page.tsx` are **Keshvi's** and are deliberately not
touched here.

---

## Issue

`staging` had no app shell for the V2 stack:

- **No `proxy.ts`.** Next 16 renamed `middleware.ts` → `proxy.ts`, and neither
  existed. Nothing sent a cookie-less visitor on `/venue` to `/login`, and no
  response carried a `Content-Security-Policy` header — Phase 8 CSP was unstarted.
- **No session bootstrap.** `@c1rcle/auth` was merged and exporting
  `getServerSession` / `setSession` / `refresh` / `logout`, but nothing in the app
  mounted it. The root layout was synchronous and rendered `{children}` bare, so
  the in-memory session store was never hydrated and no access token was ever
  obtained.
- **No browser API-client composition root.** `createApiClient` accepts
  `getToken` / `reauth` / `onUnauthorized`, but the app never composed them, so a
  401 had no silent-refresh path and no terminal redirect.
- **`next.config.ts` shipped 4 security headers, no HSTS.**
- **eslint-config did not know about any of this** — `src/proxy.ts` was missing
  from the App Router default-export allowlist (it would have linted as an
  error), `firebase` was banned nowhere, and `packages/auth` was free to persist
  the access token to `localStorage`.

## Solution

Three commits, cherry-picked from `feat/partner-gateway-auth-foundation` — the
Partner V3 branch that `INTERN-TASKS` §Track 2 names as the reference for this
lane — and reconciled onto `staging`. Original authorship (Anil Kumar) is
preserved.

### 1. `feat(security)` — App Bouncer proxy

`apps/partner-dashboard/src/proxy.ts` (new, 106 lines).

- Mints a fresh nonce per request, stamps `Content-Security-Policy` with the
  spec §11.3 directives: `connect-src 'self' <NEXT_PUBLIC_API_BASE_URL>`,
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`. `'unsafe-eval'` is added only when
  `NEXT_PUBLIC_ENVIRONMENT === 'development'` (React's dev error stacks).
- Auth redirect on `/venue`, `/host`, `/promoter`, `/onboard`, `/partner`,
  `/partner-network`: session cookie **absent** → `/login?next=<path>`.
- File header states it plainly: **UX redirect only — real auth is per-request at
  the gateway.** The edge cannot validate an httpOnly cookie (no secret), so it
  checks presence only.

> Note for Anil: `/onboard` is in `AUTH_GATED_PREFIXES` here because that is what
> this lane's spec says. Removing it is **delta 5 in `INTERN-TASKS`, your lane** —
> see `ONBOARDING-FLOW-SPEC-2026-09-01.md`. Keep `/onboard/:path*` in
> `config.matcher` when you do, so the CSP nonce still runs there.

### 2. `feat(auth)` — SessionProvider + apiClient composition root

- `src/components/providers/session-provider.tsx` (new, 100 lines) — `'use client'`,
  thin. Takes `initialUser` from `getServerSession()`, hydrates the store, then
  runs one `refresh()` to obtain the in-memory access token (the server bootstrap
  proves a session exists but cannot read the token). 30-minute idle timer →
  `logout()` + `/login`. Focus-refresh when `expiresAt` is within 5 minutes.
- `src/lib/api/client.ts` (new, 26 lines) — `getToken: getAccessToken`,
  `reauth: () => refresh()`, and a terminal `onUnauthorized` that clears the
  session and navigates to `/login` once (guarded against redirect loops).
- `src/app/layout.tsx` — **root only** — now `async`, awaits `getServerSession`
  and mounts `SessionProvider`.
- `package.json` — adds the `@c1rcle/api-client`, `@c1rcle/auth`,
  `@c1rcle/contracts` workspace deps the providers need (per the coordination
  note, this is the only deps-block edit in this lane).

### 3. `chore(security)` — HSTS + eslint firebase/storage bans

- `next.config.ts` — `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
  Existing 4 headers kept; **no CSP here** (it lives in `proxy.ts`) — verified
  exactly one CSP header on the wire.
- `packages/eslint-config/src/next.ts` — `src/proxy.ts` added to the
  default-export allowlist; `firebase` / `firebase/*` added to restricted imports.
- `packages/eslint-config/src/base.ts` — same firebase ban, plus a
  `localStorage` / `sessionStorage` `no-restricted-globals` ban **scoped to
  `packages/auth/**`** (the token stays in memory; other packages may legitimately
  use storage for UI prefs). The repo-wide `fetch` / `XMLHttpRequest` bans are
  re-stated in that scoped block so they are not dropped by the override.
- `tooling/scripts/src/check-boundaries.ts` — `firebase` added to `FORBIDDEN`.

`packages/eslint-config/src/react.ts` was **not** edited: unlike `base.ts` and
`next.ts` it does not redefine `no-restricted-imports`, so there was nothing to
add to.

---

## Files changed

```
apps/partner-dashboard/next.config.ts                            |   1 +
apps/partner-dashboard/package.json                              |   3 +
apps/partner-dashboard/src/app/layout.tsx                        |  13 +-
apps/partner-dashboard/src/components/providers/session-provider.tsx | 100 +
apps/partner-dashboard/src/lib/api/client.ts                     |  26 +
apps/partner-dashboard/src/proxy.ts                              | 106 +
packages/eslint-config/src/base.ts                               |  36 +
packages/eslint-config/src/next.ts                               |   3 +
pnpm-lock.yaml                                                   |   6 +
tooling/scripts/src/check-boundaries.ts                          |   1 +
10 files changed, 293 insertions(+), 2 deletions(-)
```

**Not touched** (per the lane's "Does NOT touch" list): `packages/auth`,
`src/app/api/auth`, `src/app/{login,signup,onboard,verify}`,
`DashboardAuthProvider.tsx`, studio route-group layouts, `src/lib/org/**`,
`src/lib/access/**`, `select-organization/page.tsx`, any backend repo.

The lane also asked for the raw `NEXT_PUBLIC_PARTNER_USE_REAL_API` /
`NEXT_PUBLIC_PARTNER_DEV_ORG_ID` reads to be deleted. `git grep` finds **zero**
occurrences on `staging` — as the doc itself predicted ("only in uncommitted
teammate WIP"). Nothing to remove.

---

## Gate results

| Gate | Result |
|---|---|
| `pnpm --filter @c1rcle/eslint-config build` | ✅ green |
| `pnpm --filter @c1rcle/app-partner-dashboard typecheck` | ✅ **0 errors** |
| `pnpm --filter @c1rcle/app-partner-dashboard build` | ✅ green — `ƒ Proxy (Middleware)` confirms `proxy.ts` is wired |
| `pnpm --filter @c1rcle/app-partner-dashboard test` | ✅ 174 passed / 49 files |
| `pnpm --filter @c1rcle/auth test` | ✅ 19 passed |
| `pnpm --filter @c1rcle/api-client test` | ✅ 14 passed |
| eslint on the 4 files in this lane | ✅ **clean** |
| `pnpm --filter @c1rcle/auth lint` (under the new storage ban) | ✅ clean |
| Manual: `/venue`, no cookie | ✅ `307` → `location: /login?next=%2Fvenue` |
| Manual: CSP nonce | ✅ `nonce-` present, **different value per request** |
| Manual: HSTS + no duplicate CSP | ✅ all 5 headers, exactly 1 CSP header |

The gate note says to expect "~151 pre-existing `@c1rcle/icons` errors" on
typecheck. There are **none** — they were stale-`dist` artifacts. Building the
workspace packages (`pnpm --filter @c1rcle/auth... build`) resolves them, and
typecheck is now fully clean. Anyone still seeing them just needs to build the
packages first.

### `pnpm boundaries` — 4 → 5

Measured against `staging` with the same rebuilt script:

- **Baseline: 4** — the pre-existing `fetch()` calls in `login/PageClient.tsx`,
  `onboard/PageClient.tsx`, `verify/PageClient.tsx`, `DashboardAuthProvider.tsx`.
  Anil's and Majid's deletions clear these.
- **Now: 5.** The one addition is `apps/partner-dashboard/package.json depends on
  "firebase"` — caused by adding `firebase` to `FORBIDDEN`, which this lane was
  explicitly assigned. **Intentional and expected.** It clears when Majid removes
  the `firebase` dep as the very last commit of the whole effort.

### Lint

The firebase import ban adds **7 new errors**, all in files scheduled for
deletion in Anil's and Majid's lanes:

| File | Errors | Cleared by |
|---|---|---|
| `src/app/login/PageClient.tsx` | 1 | Anil |
| `src/app/onboard/PageClient.tsx` | 2 | Majid |
| `src/app/verify/PageClient.tsx` | 2 | Majid |
| `src/components/providers/DashboardAuthProvider.tsx` | 2 | Keshvi (re-home) |

This is the deliberate ratchet described in the source commit: *"Temporary reds
until the firebase migration removes it."* The app's remaining ~1,190 lint
problems are pre-existing V1 issues (inline styles, import order) and are
untouched by this branch.

---

## For the people downstream

Merge order is **Sagar → Keshvi → Anil → Majid**, so this lands first.

- **Keshvi** — `SessionProvider` and `apiClient` are real now; drop your stubs.
  Import `apiClient` from `@/lib/api/client`. `getActiveOrgId` is still yours and
  is still the single source of the active-org id.
- **Anil** — `proxy.ts` exists and is lint-allowlisted. Your `/onboard` gate
  removal is a one-line edit to `AUTH_GATED_PREFIXES`. `SessionProvider` is
  mounted at the root, so `login/layout.tsx` does not need its own.
- **Majid** — the root layout already provides the session; `onboard/layout.tsx`
  only needs the `DashboardAuthProvider` → `SessionProvider` swap. Removing the
  `firebase` dep clears both the boundaries violation and the 7 lint errors above.

## Open / flagged

1. The `firebase` boundaries violation and 7 lint errors are **known reds by
   design** and only clear at the end of the migration. If CI gates on
   `pnpm boundaries` exiting 0, this branch will fail it — that needs a lead call
   (temporary allowlist, or land the eslint/boundaries commit last instead).
2. `next build` rewrites the generated `next-env.d.ts` between
   `.next/dev/types` and `.next/types` depending on whether `dev` or `build` ran
   last. It is reverted here to keep the diff clean; expect it to churn locally.
