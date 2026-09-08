# Intern Tasks — Frontend ↔ API-Gateway Connection (partner-dashboard)

**Read before starting:**

- `docs/superpowers/specs/2026-08-27-frontend-gateway-auth-foundation-design.md` — the design.
- `docs/superpowers/plans/2026-08-27-auth-foundation-plan.md` — the phased plan. **Phase 0 (Allowed APIs) is your API reference. Do not call any endpoint not listed there.**
- `docs/superpowers/HANDOFF-2026-08-27-auth-foundation.md` — §6 (knowledge base), §7 (do's/don'ts). Read §6.5, §6.6, §6.7 in full.

**Repo:** `C1RCLE-FRONTEND` only, branch off `staging`. **You never touch `C1RCLE-BACKEND` or `thec1rcle`.**

---

## Prerequisite — Phase 2 — DONE (2026-08-29, `ebe1df8` on `origin/staging`)

`@c1rcle/contracts` is scaffolded, generated from the backend, and built.
`@c1rcle/api-client` re-exports it and has `reauth` + `Retry-After`. Root
`tsconfig.json` references are wired. `contract-parity.mjs` = 59/59.

**All three tracks can start now.** Branch off `staging` (which now includes
`ebe1df8`). Import wire schemas from `@c1rcle/contracts` / `@c1rcle/contracts/client`.
If a schema you need looks missing, check `packages/contracts/src/` first — it may
just not be re-exported from `client.ts` yet (that's a one-line Track-2 fix, ask
the lead). Never hand-edit `packages/contracts/src/**` — it is generated from the
backend.

---

## The three tracks (parallel, after Phase 2)

Each track = one branch off `staging`, one intern, one PR. **File ownership is strict — if you need a file outside your list, ask the lead, do not just edit it.**

### Track 1 — Auth package + BFF (plan Phases 3 + 4)

**Owns:**

- `packages/auth/**` — rebuild from the current source-consumed stub into a compiled react-library (copy `packages/hooks` scaffolding). Three modules:
  - `src/session-store.ts` — in-memory `{ session, accessToken, expiresAt, status }` via the **hand-rolled `useSyncExternalStore` pattern** (copy `packages/auth/index.ts:1-94`). `getAccessToken()` (plain fn, the TokenProvider), `setSession`, `clearSession`, `markAnonymous`, `useSession`.
  - `src/auth-client.ts` — `signup` / `login` / `refresh` / `logout` / `fetchSession`, each via `createApiClient()` against the **BFF paths** (`/api/auth/*`, same-origin, `credentials: 'include'`). Validate bodies against `signupRequestSchema` / `loginRequestSchema` first. Refresh-stampede guard (one in-flight promise). `login` failure → fixed generic message.
  - `src/server-session.ts` — `'server-only'`. `getServerSession()`: read the httpOnly cookie via `next/headers`, call `GET /api/v2/auth/session` server-side, return `{ user } | null`, never throw.
  - `src/index.ts` barrel. `server-session` is a separate entry (`@c1rcle/auth/server-session`).
  - Delete the `auth = { currentUser: null }` shim and the stale `dist/`.
- `apps/partner-dashboard/src/lib/bff/auth-proxy.ts` — shared helpers: `assertSameOrigin`, `assertCsrf` (constant-time), `stripProtoKeys`, `mintCsrfToken`, `forwardToGateway` (server-side fetch, **no body logging**), `rescopeSessionCookie` (re-emit the Better Auth Set-Cookie scoped to the FE origin — drop `Domain`).
- `apps/partner-dashboard/src/app/api/auth/{signup,login,refresh,logout,session}/route.ts` — the 5 BFF handlers. `signup`/`login`: Origin check → strip proto keys → forward → rescope cookie → set fresh `c1rcle.csrf` cookie → return `{user, accessToken, expiresAt}`. `refresh`/`logout`: Origin check → CSRF double-submit check → forward with cookie → rescope/clear. `session`: Origin check → forward → pass through.
- Tests for all of the above.

**Does NOT touch:** any other `apps/partner-dashboard/src` file, `packages/eslint-config`, `next.config.ts`, any backend repo, the studio layouts.

**Gate:** `pnpm --filter @c1rcle/auth {build,test,typecheck}` green; `pnpm --filter partner-dashboard test -- src/app/api/auth` green; `pnpm --filter guest-portal typecheck` + `pnpm --filter admin-console typecheck` still green (they consume `@c1rcle/auth`).

### Track 2 — App shell + integration (plan Phase 5 + Phase 8 CSP)

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

**May stub** `@c1rcle/auth`'s functions behind a local `type` until Track 1 merges; swap to the real import at integration.

**Gate:** `pnpm --filter partner-dashboard {build,test,typecheck}` green; `pnpm --filter @c1rcle/eslint-config build` green; `pnpm boundaries` green; manual: `/venue` with no cookie → redirect to `/login`; response has a `Content-Security-Policy` header with a `nonce-`.

### Track 3 — Screens + mock teardown (plan Phases 6 + 7)

**Owns:**

- `apps/partner-dashboard/src/app/login/**` — rebuild `LoginForm` on `auth.login()`. Remove Google / `signInWithPopup` / `signInWithCustomToken` / workspace-type picker. Generic error on 401; field errors on 422.
- `apps/partner-dashboard/src/app/signup/**` — **new route.** `SignupForm` on `auth.signup({ displayName, email, password })` → `/onboard`. `password` min 8, no `role` field.
- `apps/partner-dashboard/src/app/onboard/**` — rebuild the wizard to the V2-reduced flow (spec §10, handoff §6.6):
  - Step 1: `requestedType` (venue/host/promoter) + `plan` (basic/silver/diamond — **no gold**).
  - Step 2: profile — required `legalName`, `contactPerson`, `phone`, `city`; optional `area`, `website`, `capacity`, `instagram`, `bio`, `businessType`, `registrationNumber`, `entityType`. Autosave via `PATCH /api/v2/onboarding/applications/:id` (`onboardingProfileSchema.partial()`, no idempotency key).
  - Step 3: documents — render the honest **"Document upload will be enabled shortly"** state. No file inputs. (Backend signed-URL issuing is a deferred gap — a founder is closing it in parallel, see below. If `POST /api/v2/onboarding/applications/:id/documents/upload-url` is live by the time you reach this step, wire the real flow: request an upload URL, `PUT` the file straight to it, then `POST .../documents { label, storagePath }`. Otherwise ship the deferred state behind one `DOCUMENTS_UPLOAD_ENABLED` flag so the switch is a one-line change.)
  - Step 4: review + `POST .../submit` (idempotency key). It 4xx's "missing documents" until the gap closes — surface as a clear message.
  - Resume from `GET /api/v2/onboarding/me`. Poll for `approved` → `GET /organizations` → studio.
  - Optional `verify-document` affordance → render `"Format check passed — pending manual review"`, **never "Verified"**, no green tick.
- `apps/partner-dashboard/src/app/login/layout.tsx`, new `signup/layout.tsx`, `onboard/layout.tsx` — swap `DashboardAuthProvider` → nothing / `SessionProvider` (coordinate with Track 2 on the import).
- **Delete:** `src/lib/firebase/client.ts`, `src/lib/auth/getCachedFirebaseIdToken.ts`, `src/app/verify/**`, `src/app/api/auth/{me,partner-context,profile,check-email,check-availability,create-account,onboard,onboard-status,onboarding-progress}/route.ts`, `src/app/api/auth/otp/**`, `src/app/api/kyc/**`, and any `/auth/change-password` / `/forgot-password` links.
- `apps/partner-dashboard/src/components/providers/DashboardAuthProvider.tsx` — **re-home, don't delete.** ~40 components use `useDashboardAuth()`. Rename to `session-context.tsx`, keep a `useDashboardAuth` alias, re-implement its context on `@c1rcle/auth` + `useOrgAccess` (from Track 1 + Track 2). Map: `user` → `useSession().user`; `isApproved` → "an active org exists"; `signIn/signUp/signOut` → `auth.*`; `hasPermission/canDo` → `useOrgAccess().hasPermission`; `tabVisibility` → `useOrgAccess().tabVisibility`; `getIdToken` → `getAccessToken`; `switchPartner` → `setActiveOrg`. Drop `isBanned`, `kycStatus`, `entityType`, `subscriptionPlan`, `actionPermissions`, `piiPolicy`, `mustChangePassword`, the 30s polling — grep each consumer, replace with the nearest real signal or remove the branch.
- `apps/partner-dashboard/package.json` — remove `"firebase"` (**do this last**, after Tracks 1 + 2 merged).
- `apps/partner-dashboard/.env.example` — drop the two deleted `NEXT_PUBLIC_PARTNER_*` keys.

**Does NOT touch:** `packages/**`, `src/proxy.ts`, `next.config.ts`, root `layout.tsx`, `src/lib/{api,org,access}`, the studio route-group layouts (`src/app/{venue,host,promoter}/layout.tsx` and everything under those trees — that's a **later** spec), any backend repo.

**Depends on:** Track 1 (`@c1rcle/auth`) + Track 2 (`SessionProvider`, `useOrgAccess`, `setActiveOrg`) interfaces. Agree the interface signatures with those interns on day 1; stub locally until they merge.

**Gate:** `pnpm --filter partner-dashboard {build,test,typecheck}` green; `git grep -n "firebase" apps/partner-dashboard/src` empty; `git grep -n "/api/auth/me\|/api/auth/otp" apps/partner-dashboard/src` empty; login E2E: wrong password → generic message; signup → `/onboard`.

---

## Shared DO / DON'T (all three tracks)

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

1. ~~Phase 2 (contracts + api-client)~~ — **DONE, `ebe1df8` on `origin/staging`.**
2. Track 1 & Track 2 in parallel → merge to `staging` (Track 2 can land its stubs first).
3. Track 3 (needs 1 + 2) → merge to `staging`.
4. Phase 8: full journey E2E against a real Firestore-backed gateway + cross-repo `pnpm check`. One person, after all merged.

**Running in parallel (not your work — the two founders, in `C1RCLE-BACKEND`):**
backend Phase 5 completion + the onboarding document-upload gap. See
`FOUNDER-TASKS-2026-08-29.md`. The only overlap point is Track 3 step 3
(onboarding documents) — coded behind a flag so it flips on when the backend
endpoint lands, no rework. If they add a contract schema, they run
`export-contracts.mjs` and tell you; you `git pull` + rebuild `@c1rcle/contracts`.

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
