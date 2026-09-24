# ANIL_SECURITY-APP-SHELL

**Intern:** Anil
**Branch:** `codex/partner-v3-rebuild`
**Status:** Implemented, committed, gates verified
**Date:** 2026-08-30

Assignment: **Security & App Shell (Phase 5 Part A + Phase 8 CSP)**

1. **App Bouncer** — `src/proxy.ts` (Next 16 middleware) with a CSP nonce generator and the auth-redirect logic.
2. **Providers** — the `SessionProvider` wrapping the app, and the `apiClient` composition root (`src/lib/api/client.ts`).
3. **Config** — `next.config.ts` (HSTS) and the required `eslint-config` edits.

---

## 1. Issue

The frontend shipped without three security controls the auth-foundation spec (§9, §11.3, handoff §5) requires:

- **No CSP nonce.** The app had no Content-Security-Policy at all (prior-audit HIGH). Because any useful CSP for a Next app needs a per-request nonce on `script-src`, and Next 16 renamed `middleware.ts` to `proxy.ts`, the nonce had to live in a new `src/proxy.ts` (the old file is deprecated). The nonce forces dynamic rendering (no static/ISR/PPR).
- **No HSTS.** `next.config.ts` carried the static security headers but no `Strict-Transport-Security`.
- **No session bootstrap / single-owner HTTP client.** The root layout had no server-side session hydration (`getServerSession`), the app had no `SessionProvider` nor an `apiClient` composition root, so there was no single, owned path for tokens or backend requests.
- **No lint boundary for the token-freshness rules.** `firebase` and browser-storage APIs were not banned, so a future regression could persist the access token to `localStorage` or drag a backend SDK back in without failing CI.

---

## 2. Solution

### 2.1 App Bouncer — `apps/partner-dashboard/src/proxy.ts`

- Next 16 middleware (renamed `middleware.ts` → `proxy.ts`), default-exported.
- Mints a **CSP nonce per request** (Next's canonical nonce pattern, from `content-security-policy.md:34-133`): sets `x-nonce` on the request headers and the full CSP header on the response, so Next auto-applies the nonce to framework scripts. N

ote: the nonce forces dynamic rendering — pages may need `await connection()`.

- **Auth redirect (UX only):** for `/venue|/host|/promoter|/onboard|/partner|/partner-network`, if the session cookie is absent → `redirect('/login?next=…')`. Real auth is per-request at the gateway; this only prevents the logged-out flash.
- File header states: "_UX redirect only — real auth is per-request at the gateway._"
- Requires the new default-export allowlist entry `src/proxy.ts` in the eslint-config (see §2.3).

### 2.2 Providers

- **`SessionProvider`** (`apps/partner-dashboard/src/components/providers/session-provider.tsx`, `'use client'`): thin wrapper, props `initialUser: { user: User } | null`. On mount it seeds the in-memory store — `setSession(initialUser, null, 0)` since the server bootstrap has no access token (httpOnly-cookie-only server-side) — then calls `refresh()` once to obtain an in-memory token; if refresh fails it `markAnonymous()` and lets `proxy.ts` handle the next-nav redirect. Enforces a **30-min idle timeout** (`IDLE_TIMEOUT_MS`) → `logout()` + `router.replace('/login')`, and a **focus refresh** when the token nears expiry (`FOCUS_REFRESH_WINDOW_MS`, reads `useSessionStore.getState().expiresAt`). Returns `<>{children}</>`.
- **apiClient composition root** (`apps/partner-dashboard/src/lib/api/client.ts`): `createApiClient({ getToken: getAccessToken, reauth: () => refresh(), onUnauthorized: () => { if (!redirecting) { redirecting = true; clearSession(); window.location.assign(new URL('/login', window.location.origin).toString()); } } })`. `reauth` returns `Promise<boolean>`; `onUnauthorized` is the terminal give-up hook. The absolute-URL form is used because `@next/next/no-location-assign-relative-destination` rejects a relative `/login`.
- **Root layout** (`apps/partner-dashboard/src/app/layout.tsx`): made `async`; `getServerSession((await cookies()).toString())` and `<SessionProvider initialUser={session}>{children}</SessionProvider>`.

### 2.3 Config

- **`next.config.ts`** — added `Strict-Transport-Security: max-age=31536000; includeSubDomains` to `headers()`; kept the existing 4 headers; **no CSP here** (it lives in `proxy.ts`), so there is no duplicate CSP header.
- **eslint-config** (`packages/eslint-config/src/base.ts`, `src/next.ts`):
  - `'src/proxy.ts'` added to the default-export allowlist in `next.ts` (next to `src/middleware.ts`).
  - `firebase` / `firebase/*` added to the SECURITY `no-restricted-imports` group in **both** `base.ts` and `next.ts`. Note: `react.ts` does not redefine `no-restricted-imports` (it only overrides `no-restricted-syntax`), so `base.ts`'s group already covers react-library packages; `next.ts` redefines the rule wholesale for app `src/**` files, so it needs its own copy.
  - A `no-restricted-globals` block scoped to `packages/auth/**` bans `localStorage` / `sessionStorage` (the access token must live only in the in-memory store), re-stating the `fetch` / `XMLHttpRequest` bans so they are not dropped.
- **`tooling/scripts/src/check-boundaries.ts`** — added `'firebase'` to `FORBIDDEN`.
- **Workspace deps** — `apps/partner-dashboard/package.json` + `pnpm-lock.yaml`: added `@c1rcle/api-client`, `@c1rcle/auth`, `@c1rcle/contracts` (`workspace:*`), then `pnpm install` (unfrozen) to repair all workspace junctions and rebuild stale dists.

---

## 3. Files Changed

### New files

| File                                                                   | What                                                                                                                    |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `apps/partner-dashboard/src/proxy.ts`                                  | Next 16 App Bouncer: CSP nonce generator + auth redirect (UX only).                                                     |
| `apps/partner-dashboard/src/components/providers/session-provider.tsx` | `SessionProvider`: seeds store from `initialUser`, one refresh on mount, 30-min idle logout, focus refresh near expiry. |
| `apps/partner-dashboard/src/lib/api/client.ts`                         | apiClient composition root (`createApiClient` wiring: `getToken`, `reauth`, `onUnauthorized`).                          |

### Modified files

| File                                        | Change                                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `apps/partner-dashboard/src/app/layout.tsx` | `async`; `getServerSession((await cookies()).toString())`; wraps children in `<SessionProvider initialUser={session}>`.    |
| `apps/partner-dashboard/next.config.ts`     | Added `Strict-Transport-Security` header (kept the existing 4; no CSP here).                                               |
| `packages/eslint-config/src/base.ts`        | `firebase`/`firebase/*` in SECURITY restricted-imports; scoped `no-restricted-globals` storage ban for `packages/auth/**`. |
| `packages/eslint-config/src/next.ts`        | `src/proxy.ts` default-export allowlist; `firebase`/`firebase/*` in its SECURITY restricted-imports.                       |
| `tooling/scripts/src/check-boundaries.ts`   | `'firebase'` added to `FORBIDDEN`.                                                                                         |
| `apps/partner-dashboard/package.json`       | Added `@c1rcle/api-client`, `@c1rcle/auth`, `@c1rcle/contracts` deps.                                                      |
| `pnpm-lock.yaml`                            | Lockfile entries for the three added workspace deps.                                                                       |

---

## 4. Verification

- `@c1rcle/eslint-config` build + self-lint: clean.
- `@c1rcle/auth` build + typecheck + test: 19/19 pass. (One transient vitest forks-worker spawn timeout was worked around by retrying; `--pool=threads` reproduces the same green result.)
- App BFF tests (`--filter @c1rcle/app-partner-dashboard test -- src/app/api/auth`): 12/12 pass.
- Deliverable files individually lint-clean: `session-provider.tsx`, `lib/api/client.ts`, `layout.tsx`, `next.config.ts`, `proxy.ts`.
- App `tsc --noEmit`: passes except 2 pre-existing icon errors in `PromoterFinanceScreen.tsx` (not from this work).
- `pnpm boundaries`: exactly 5 pre-existing raw-`fetch` violations **+ 1 new intended** `frontend-only` violation (app depends on `firebase`).
- App `eslint .`: failures are limited to legacy firebase/BFF files (Track 3 removes them) plus the new intended `firebase/auth` & `firebase/storage` import bans.

---

## 5. Known caveats

- **Storage ban resolution:** the `packages/auth/**`-scoped `localStorage`/`sessionStorage` ban is **inert under per-package lint** — ESLint resolves `files` patterns relative to each member package's own cwd (e.g. `packages/auth`), so the repo-relative `packages/auth/**` path never matches. It will fire only under a future repo-root lint run. To make it enforceable today it would need to live in `packages/auth/eslint.config.ts` (Track 1-owned) or a repo-root config. A repo-wide ban is **not** safe: `localStorage` is legitimately used by the theme store (`packages/providers/src/theme-store.ts`), design-system token keys, and the app's `partner:last-route` memory.
- **Temporary reds:** the `firebase` eslint restricted-import bans and the `frontend-only` boundaries violation are real until Track 3 removes `firebase` from the app; they will go green with that migration.
