# Frontend ↔ API-Gateway Integration — Team Tasks (partner-dashboard)

<!-- filename kept as INTERN-TASKS-2026-08-27.md for existing links; this covers the whole team. -->


**Read before starting:**
- `docs/superpowers/specs/2026-08-27-frontend-gateway-auth-foundation-design.md` — the design.
- `docs/superpowers/plans/2026-08-27-auth-foundation-plan.md` — the phased plan. **Phase 0 (Allowed APIs) is your API reference. Do not call any endpoint not listed there.**
- `docs/superpowers/HANDOFF-2026-08-27-auth-foundation.md` — §6 (knowledge base), §7 (do's/don'ts). Read §6.5, §6.6, §6.7 in full.

**Repo:** `C1RCLE-FRONTEND` only, branch off `staging`. **You never touch `C1RCLE-BACKEND` or `thec1rcle`.**

---

## Done already — Phases 2, 3, 4 (on `origin/staging`)

| Phase | Commit | What shipped |
|---|---|---|
| 2 — contracts + api-client | `ebe1df8` | `@c1rcle/contracts` (generated from backend), `@c1rcle/api-client` `reauth` + `Retry-After` |
| 3 — `@c1rcle/auth` | `3911c4c` | compiled session package (below) |
| 4 — auth BFF | `ef27e1f` | `src/lib/bff/auth-proxy.ts` + 5 `src/app/api/auth/*` handlers |

Branch off `staging` (≥ `f531d0d`). Import wire schemas from `@c1rcle/contracts`
/ `@c1rcle/contracts/client` — never hand-edit `packages/contracts/src/**`.

### `@c1rcle/auth` — the surface you consume (don't touch the package)

```ts
import {
  useSession,            // () => { isAuthenticated, isLoading, user }
  getAccessToken,        // () => string | null   (plain fn, the api-client TokenProvider)
  setSession, clearSession, markAnonymous,
  useSessionStore,       // hook + { getState, setState, subscribe }
  signup,                // ({ email, password, displayName }) => Promise<void>   → sets session
  login,                 // ({ email, password }) => Promise<void>   → throws Error('Authentication failed') on 400/401
  refresh,               // () => Promise<boolean>   (stampede-guarded)
  logout,                // () => Promise<void>   (best-effort, never rejects)
  fetchSession,          // () => Promise<void>
} from '@c1rcle/auth';
import { getServerSession } from '@c1rcle/auth/server-session';
// getServerSession(cookieHeader: string) => Promise<{ user } | null>
//   root layout calls: await getServerSession((await cookies()).toString())
```

`auth-client` points `baseUrl` at `window.location.origin` (the BFF is
same-origin, NOT the gateway) and attaches `x-csrf-token` from the
`c1rcle.csrf` cookie on `refresh`/`logout`.

### The auth BFF — `POST /api/auth/{signup,login,refresh,logout,session}`

Same-origin. `signup`/`login` → `{ user, accessToken, expiresAt }` + a fresh
non-httpOnly `c1rcle.csrf` cookie + the session cookie re-scoped host-only.
`refresh`/`logout` need the `x-csrf-token` header (double-submit). Gateway
error envelopes pass through unchanged (login oracle already suppressed
server-side). **These 5 routes exist — do not recreate them; Phase 7 deletes
the *other* mock `app/api/auth/*` routes.**

---

## Who's on what — assignment 2026-08-29

The original 3-track split (Track 1 = Phases 3+4, done above) is superseded.
Lanes are drawn by area of focus and by keeping each PR a coherent, isolated
slice — not by any ranking of people. Each lane = one branch off `staging`,
one PR. **File ownership is strict — need a file outside your list, ask
Shriyash (lead).**

| Person | Lane | Plan phase(s) | Section below |
|---|---|---|---|
| **Sagar** | App shell + CSP — `proxy.ts` + CSP nonce, `SessionProvider`, `src/lib/api/client.ts`, `next.config.ts` HSTS, all `packages/eslint-config` + `check-boundaries` edits, root `layout.tsx` | 5 Part A + Phase 8 CSP | **"Track 2"** minus the org bullets |
| **Keshvi** | Org access + context migration — `src/lib/org/**`, `src/lib/access/use-org-access.ts`, `partner/select-organization/page.tsx`, and the `DashboardAuthProvider` → `session-context.tsx` re-home (~40 consumers) | 5 Part B + Phase 6 (context half) | **"Track 2"** org bullets + **"Track 3"** `DashboardAuthProvider` bullet |
| **Anil** | Auth screens + mock-auth teardown — `/login` + `/signup` rebuilt on `auth.*`, delete `src/lib/firebase/client.ts` + the 12 mock `app/api/auth/*` routes (NOT the 5 real BFF routes) | 6 | **"Track 3"** login/signup + delete bullets |
| **Majid** | Onboarding + KYC teardown — `/onboard` V2 wizard (the 3-step upload flow is fully spec'd below), delete `/verify` + `app/api/kyc/**`, remove `firebase` from `package.json` (**last commit of the whole effort**) | 7 | **"Track 3"** `/onboard` + `/verify` bullets |
| **Shriyash** (lead) | Backend Founder Task A2 + Phase 8 E2E + reviews every PR | Track G + Phase 8 | `FOUNDER-TASKS-2026-08-29.md` |
| **Ayush** (founder) | Backend Founder Task B | Track G | `FOUNDER-TASKS-2026-08-29.md` |

**Merge order** (see "Integration order" at the bottom): Sagar → Keshvi → Anil →
Majid. Everyone after Sagar imports his `SessionProvider` + `src/lib/api/client.ts`
— stub the two behind a local `type` until his PR lands. Anil's post-login route
decision and Majid's approved→studio hop both call Keshvi's `getActiveOrgId()` —
stub that too.

**Coordination:** `apps/partner-dashboard/package.json` — Sagar adds the
`@c1rcle/auth` dep his providers need; Majid removes `firebase` as the very last
commit; nobody else edits the deps block. Layouts: Sagar owns root, Anil owns
`login`/`signup`, Majid owns `onboard`, nobody touches studio layouts.

The in-flight `codex/partner-v3-rebuild` branch (early app-shell exploration) →
Sagar picks it up as a reference for his lane; Anil's lane is `/login` + `/signup`.

### Track 2 — App shell + integration  (plan Phase 5 + Phase 8 CSP)

**Split:** **Sagar** owns everything here **except** `src/lib/org/**`,
`src/lib/access/**`, and `select-organization/page.tsx` — those three go to
**Keshvi** (they belong with the login/org flow). The `repositories.ts` /
`gateway-partner-transport.ts` env cleanup (last bullet) is Sagar's — but note
those raw `process.env` reads are **only in uncommitted teammate WIP, not on
`staging`**, so on a fresh branch there is nothing to delete; just make sure
`getActiveOrgId()` (Keshvi) is the single source of the active-org id.

**Owns:**
- `apps/partner-dashboard/src/proxy.ts` — **NOT `middleware.ts`** (Next 16 renamed it). Per-request CSP nonce (copy the pattern in `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:34-133`); CSP directives per spec §11.3 (`connect-src 'self' <NEXT_PUBLIC_API_BASE_URL>`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`). Auth redirect: on `/venue|/host|/promoter|/onboard|/partner|/partner-network`, if the session cookie is **absent** → `redirect('/login?next=…')`. File header: "UX redirect only — real auth is per-request at the gateway."
- `apps/partner-dashboard/next.config.ts` — add `Strict-Transport-Security: max-age=31536000; includeSubDomains`; keep the existing 4 headers; **no CSP here** (it's in `proxy.ts`). Confirm no duplicate CSP header.
- `apps/partner-dashboard/src/components/providers/session-provider.tsx` — `'use client'`, thin. Props `initialUser` from `getServerSession()`. On mount: hydrate + one `auth.refresh()` to get the in-memory token. 30-min idle timer → `auth.logout()` + `/login`. Focus-refresh when `expiresAt` near.
- `apps/partner-dashboard/src/lib/api/client.ts` — the browser `createApiClient` composition root: `{ getToken: getAccessToken, reauth: () => refresh(), onUnauthorized: () => { clearSession(); location.assign('/login'); } }`.
- `apps/partner-dashboard/src/lib/org/**` — `active-org.ts` (`getActiveOrgId` / `setActiveOrg` — the `c1rcle.active-org` server-readable cookie; `setActiveOrg` also calls `auth.refresh()` for token rotation), `org-repository.ts` (`GET /api/v2/organizations`, parse `paginatedSchema(organizationDtoSchema)`).
- `apps/partner-dashboard/src/lib/access/use-org-access.ts` — `GET /api/v2/organizations/:id/access` → `partnerAccessDtoSchema`; returns `{ partnerType, role, permissions, tabVisibility, isLoading, error }`; `hasPermission(p)` = `permissions.includes(p)`; `tabVisible(t)` = `tabVisibility === null || tabVisibility[t] !== false`; 403 → `{ suspended: true }`. Plain `useEffect` fetch (no TanStack Query this slice).
- `apps/partner-dashboard/src/app/layout.tsx` — **root only** — mount `SessionProvider` with `await getServerSession()`.
- `apps/partner-dashboard/src/app/partner/select-organization/page.tsx` — server component: list orgs, zero → `/onboard`, one → set active + studio, many → picker.
- `packages/eslint-config/**` — **all eslint-config edits belong to Track 2.** Add `'src/proxy.ts'` to the default-export allowlist in `src/next.ts` (near where `src/middleware.ts` is listed). Add `firebase` / `firebase/*` to the restricted-imports patterns in `src/base.ts` **and** `src/react.ts` **and** `src/next.ts` (they each redefine the rule). Add a `localStorage`/`sessionStorage` ban scoped to `packages/auth/**`. Also add `firebase` to `tooling/scripts/src/check-boundaries.ts` `FORBIDDEN`.
- Delete the raw `process.env['NEXT_PUBLIC_PARTNER_USE_REAL_API']` / `['NEXT_PUBLIC_PARTNER_DEV_ORG_ID']` reads (in `src/lib/partner/repositories.ts` / `gateway-partner-transport.ts`) — `USE_REAL_API` becomes unconditional `true`; dev-org comes from `getActiveOrgId()`.

**Does NOT touch:** `packages/auth`, `src/app/api/auth`, `src/app/{login,signup,onboard,verify}`, `DashboardAuthProvider.tsx`, the studio route-group layouts (`src/app/{venue,host,promoter}/layout.tsx`), any backend repo.

`@c1rcle/auth` is **already merged** — import it directly (surface listed at the top of this doc). No stubbing needed.

**Gate:** `pnpm --filter @c1rcle/app-partner-dashboard build` + your own tests green; `pnpm --filter @c1rcle/eslint-config build` green; `pnpm boundaries` adds **no new** violation beyond the ~4 pre-existing mock-auth `fetch()` ones that Intern 2/3's deletions clear; `pnpm --filter @c1rcle/app-partner-dashboard typecheck` — your files clean (~151 pre-existing `@c1rcle/icons` errors in studio components are not yours, ignore them); manual: `/venue` with no cookie → redirect to `/login`; a response carries a `Content-Security-Policy` header with a `nonce-`.

### Track 3 — Screens + mock teardown  (plan Phases 6 + 7)

**Split:**
- **Anil** — `/login`, `/signup`, their layouts, delete `src/lib/firebase/client.ts` + `src/lib/auth/getCachedFirebaseIdToken.ts` + the 12 mock `app/api/auth/*` routes (**not** the 5 real BFF routes) + the `/auth/change-password` / `/forgot-password` links.
- **Keshvi** — the `DashboardAuthProvider` → `session-context.tsx` re-home only (it pairs with her `useOrgAccess`).
- **Majid** — `/onboard` wizard, delete `src/app/verify/**` + `src/app/api/kyc/**`, remove `firebase` from `package.json` + `.env.example` cleanup (last).

**Owns:**
- `apps/partner-dashboard/src/app/login/**` — rebuild `LoginForm` on `auth.login()`. Remove Google / `signInWithPopup` / `signInWithCustomToken` / workspace-type picker. Generic error on 401; field errors on 422.
- `apps/partner-dashboard/src/app/signup/**` — **new route.** `SignupForm` on `auth.signup({ displayName, email, password })` → `/onboard`. `password` min 8, no `role` field.
- `apps/partner-dashboard/src/app/onboard/**` — rebuild the wizard to the V2-reduced flow (spec §10, handoff §6.6):
  - Step 1: `requestedType` (venue/host/promoter) + `plan` (basic/silver/diamond — **no gold**).
  - Step 2: profile — required `legalName`, `contactPerson`, `phone`, `city`; optional `area`, `website`, `capacity`, `instagram`, `bio`, `businessType`, `registrationNumber`, `entityType`. Autosave via `PATCH /api/v2/onboarding/applications/:id` (`onboardingProfileSchema.partial()`, no idempotency key).
  - Step 3: documents — **the backend endpoint is now LIVE** (`C1RCLE-BACKEND` `2a9a4b3`, contracts on `staging` `fb45fc1`). Wire the real flow per label (`id_front`, `id_back`, `selfie`):
    1. `POST /api/v2/onboarding/applications/:id/documents/upload-url` with `{ label, contentType }` (`contentType` ∈ `image/jpeg | image/png | image/webp`) → `documentUploadUrlDtoSchema` `{ uploadUrl, method: 'PUT', headers, storagePath, expiresAt }`.
    2. `PUT` the `File` straight to `uploadUrl` with **exactly** the returned `headers` (content-type + `x-goog-content-length-range`). This one `fetch`/`PUT` is to a Google Storage URL, not the gateway — put it behind a tiny `uploadToSignedUrl(grant, file)` helper in `src/lib/onboarding/` and add an eslint-disable with a comment (it is not a gateway call, `@c1rcle/api-client` can't do an opaque cross-origin PUT). Max 5 MiB, images only — validate client-side before requesting the URL.
    3. `POST /api/v2/onboarding/applications/:id/documents` with `{ label, storagePath }` (the `storagePath` from step 1).
    Re-picking a label just repeats 1–3; the key is deterministic so it overwrites. On memory-driver dev the `uploadUrl` is a non-routable `memory://…` — detect that prefix and skip the PUT so local dev without a bucket still completes.
  - Step 4: review + `POST .../submit` (idempotency key). Now succeeds once the 3 documents are recorded; still 4xx "missing documents" before that — surface as a clear inline message, not an error toast.
  - Resume from `GET /api/v2/onboarding/me`. Poll for `approved` → `GET /organizations` → studio.
  - Optional `verify-document` affordance → render `"Format check passed — pending manual review"`, **never "Verified"**, no green tick.
- `login/layout.tsx` + new `signup/layout.tsx` (Anil), `onboard/layout.tsx` (Majid) — swap `DashboardAuthProvider` → `SessionProvider` (Sagar's import).
- **Delete (Anil):** `src/lib/firebase/client.ts`, `src/lib/auth/getCachedFirebaseIdToken.ts`, `src/app/api/auth/{me,partner-context,profile,check-email,check-availability,create-account,onboard,onboard-status,onboarding-progress}/route.ts`, `src/app/api/auth/otp/**`, the `/auth/change-password` / `/forgot-password` links. **Delete (Majid):** `src/app/verify/**`, `src/app/api/kyc/**`.
- `apps/partner-dashboard/src/components/providers/DashboardAuthProvider.tsx` (**Keshvi**) — **re-home, don't delete.** ~40 components use `useDashboardAuth()`. Rename to `session-context.tsx`, keep a `useDashboardAuth` alias, re-implement its context on `@c1rcle/auth` (merged) + your own `useOrgAccess`. Map: `user` → `useSession().user`; `isApproved` → "an active org exists"; `signIn/signUp/signOut` → `auth.*`; `hasPermission/canDo` → `useOrgAccess().hasPermission`; `tabVisibility` → `useOrgAccess().tabVisibility`; `getIdToken` → `getAccessToken`; `switchPartner` → `setActiveOrg`. Drop `isBanned`, `kycStatus`, `entityType`, `subscriptionPlan`, `actionPermissions`, `piiPolicy`, `mustChangePassword`, the 30s polling — grep each consumer, replace with the nearest real signal or remove the branch.
- `apps/partner-dashboard/package.json` — remove `"firebase"` (**Majid, the very last commit** — after Sagar/Keshvi/Anil have merged and `git grep -n firebase apps/partner-dashboard/src` is empty).
- `apps/partner-dashboard/.env.example` — drop `NEXT_PUBLIC_PARTNER_USE_REAL_API` / `NEXT_PUBLIC_PARTNER_DEV_ORG_ID` if present (Sagar).

**Does NOT touch:** `packages/**`, `src/proxy.ts`, `next.config.ts`, root `layout.tsx`, `src/lib/{api,org,access}`, the studio route-group layouts (`src/app/{venue,host,promoter}/layout.tsx` and everything under those trees — that's a **later** spec), any backend repo.

**Depends on:** `@c1rcle/auth` (merged — import directly) + Sagar's `SessionProvider` + `src/lib/api/client.ts` + Keshvi's `getActiveOrgId` / `useOrgAccess`. Stub Sagar's two behind a local `type` and Keshvi's `getActiveOrgId` behind a `() => document.cookie…` shim until those PRs land.

**Gate:** `pnpm --filter @c1rcle/app-partner-dashboard {build,test}` green **for your files** (the app has ~151 pre-existing `@c1rcle/icons` typecheck errors in studio components — ignore those, don't fix them); `git grep -n "firebase" apps/partner-dashboard/src` empty (after Majid); `git grep -n "/api/auth/me\|/api/auth/otp" apps/partner-dashboard/src` empty (after Anil); login E2E: wrong password → generic message; signup → `/onboard`.

---

## Shared DO / DON'T (all tracks)

### DO
- Branch off `staging`. Small commits. PR back to `staging`. Rebase, don't merge-commit.
- `pnpm --filter <your-package> {test,typecheck,lint}` **and** `pnpm boundaries` green before every commit.
- Import wire types/schemas **only** from `@c1rcle/contracts`. Network **only** via `@c1rcle/api-client`. Env **only** via `@c1rcle/config`.
- Parse every gateway response with a `@c1rcle/contracts` zod schema. The success body is a **bare DTO** (or `{ items, pageInfo }` for lists) — there is no `{ data, meta }` wrapper.
- Money is integer **paise**. Timestamps are **ISO-8601 strings** — except `Session.expiresAt` which is **epoch ms**.
- Initial reads in Server Components (`page.tsx` / `layout.tsx`); `'use client'` only for interaction.
- On an API error, render a typed empty / unavailable / retry state. Never a fixture.
- Distinguish `401` (reauth) / `403` (not permitted — identical whether the resource exists) / `404` (missing) before rendering.
- If you think you need a gateway endpoint that isn't in the plan's Phase 0 list — **write it down and give it to the backend lead.** Do not add it yourself.
- Ask the lead before editing any file outside your track's ownership list.

### DON'T
- **No `C1RCLE-BACKEND` / `thec1rcle` edits. Ever.** Not "to make it easier", not "just a small fix". Hand backend needs to the backend lead.
- No `middleware.ts` — it's `proxy.ts` in Next 16.
- No `zustand` — it is not installed. Use the hand-rolled `useSyncExternalStore` pattern.
- No access token in `localStorage` / `sessionStorage` / `IndexedDB` / a JS-readable cookie / a URL / a query string / `x-request-id`.
- No `role` field in any auth or onboarding request body — the backend sets it.
- No `console.log` (or `console.error`) of request bodies, tokens, or cookies — especially in the BFF.
- No `firebase` — no dependency, no import, no `firebase/auth`, no `firebase/storage`. It is being deleted.
- No rendering a `verify-document` result as "Verified" — it is a format check only, pending human review.
- No fixture / mock-data fallback after an API failure.
- No `git commit --no-verify`. No `git push --force`.
- No computing permissions client-side from `role` — call `GET /organizations/:id/access`.
- No touching the venue/host/promoter **studio screens** (dashboard data, `components/venue/*-model.ts`, etc.) — that is a separate, later effort.
- No `git stash` / rebase that would disturb another track's branch.

---

## Integration order

1. ~~Phase 2 (contracts + api-client), Phase 3 (`@c1rcle/auth`), Phase 4 (auth BFF)~~ — **DONE, on `origin/staging` (`ebe1df8` / `3911c4c` / `ef27e1f`).**
2. **Sagar** (app shell: `proxy.ts`, `SessionProvider`, `src/lib/api/client.ts`, CSP, eslint) → merge first — everyone layers on it.
3. **Keshvi** (`src/lib/org/**`, `useOrgAccess`, `select-organization`, `DashboardAuthProvider` re-home) → merge. Needs Sagar's `apiClient`.
4. **Anil** (`/login`, `/signup`, mock `api/auth/*` + firebase-client deletion) → merge. Needs `auth.*` (have) + Sagar's `SessionProvider` + Keshvi's `getActiveOrgId`.
5. **Majid** (`/onboard` rebuild, `/verify` + `api/kyc` teardown) → merge. The `firebase` `package.json` removal is the very last commit, once `git grep firebase apps/partner-dashboard/src` is clean.
6. **Phase 8** (Shriyash, after all merged): full journey E2E against a real Firestore-backed gateway + cross-repo check.

**Running in parallel (not your work — the two founders, in `C1RCLE-BACKEND`):**
backend Phase 5 completion. See `FOUNDER-TASKS-2026-08-29.md`. The onboarding
document-upload gap is **CLOSED** (`2a9a4b3` backend / `fb45fc1` contracts on
`staging`) — Intern 3's onboard step 3 above is the real flow now, no flag
needed. If a founder adds another contract schema they run `export-contracts.mjs`
and tell you; you `git pull staging` + `pnpm --filter @c1rcle/contracts build`.

## Local dev

```bash
# backend (someone runs this so the interns have a gateway to hit)
cd C1RCLE-BACKEND/apps/api-gateway
# .env.local: STORAGE_DRIVER=firestore + the thec1rcle-india Firebase creds
#   (creds: thec1rcle/apps/api-gateway/.env.development — a disposable dev sandbox)
NODE_OPTIONS=--dns-result-order=ipv4first pnpm dev      # :8080

# frontend
cd C1RCLE-FRONTEND
# .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
pnpm --filter partner-dashboard dev                     # :3001
```
