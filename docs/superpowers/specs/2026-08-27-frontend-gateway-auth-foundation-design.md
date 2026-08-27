# Frontend ↔ Gateway Auth Foundation — Design

**Date:** 2026-08-27
**Status:** Draft for review
**Scope:** Sub-projects A (`@c1rcle/auth`) + B (data-access convention), delivered as one vertical slice: the complete critical-path journey **signup → login → onboarding/KYC → select organization → land in the correct partner studio**, fully de-mocked, on real `/api/v2`.
**Base branch:** `C1RCLE-FRONTEND` @ `staging`. Companion changes land in `C1RCLE-BACKEND` @ `main`.
**Out of scope (later specs):** studio screen data (venue/host/promoter dashboards) = spec C; guest-portal de-mock = spec D; admin-console = spec E; backend Phase 5 completion = track G.

---

## 1. Why this slice

`C1RCLE-FRONTEND` `partner-dashboard` authenticates entirely against a **mock Firebase client** (`src/lib/firebase/client.ts`, accepts any credentials) and 14 static Next.js route handlers under `src/app/api/**`. `@c1rcle/api-client` is now a real, well-built HTTP client, but nothing wires a token to it and no screen calls `/api/v2`. `@c1rcle/auth` is an in-memory session store with no network layer.

The backend `/api/v2` surface is materially complete for this journey: `POST /api/v2/auth/{signup,login,refresh,logout}`, `GET /api/v2/auth/session`, the full `/api/v2/onboarding/*` set, `/api/v2/organizations` + `/api/v2/organizations/:id/access`. It requires `STORAGE_DRIVER=firestore` and Better Auth (httpOnly cookie + `bearer()` plugin).

This slice replaces the mock auth engine with a real one, establishes the single data-access convention every later screen migration follows, and deletes the mock auth/KYC routes.

---

## 2. Conflict resolutions (authoritative)

The frozen V2 planning docs (`thec1rcle/docs/V2-Partners_Frontend/{route-manifest.ts, API_V2_ROUTE_MANIFEST.md, Middleware_documentation.docx}`) and the live backend diverge. Per the V2 master prompt §3 ("explicitly record important conflicts before making destructive changes"), each is resolved here. Live code + `C1RCLE-BACKEND/docs/architecture/decisions.md` win where they are newer and more specific.

| # | Concern | Frozen planning doc | Live backend + backend `decisions.md` | Resolution |
|---|---|---|---|---|
| C-1 | Session/auth routes | `/api/v2/session`, `/session/sync`, `/session/logout` — all **DEFERRED** | `/api/v2/auth/{signup,login,refresh,logout}` + `GET /api/v2/auth/session` — **live, tested** (D-001, phase-00) | **Use `/api/v2/auth/*`.** The frozen `session.*` names are superseded. |
| C-2 | Success envelope | `{ data, meta }` | **bare DTO** (`eventDtoSchema` etc.) / `{ items, pageInfo }` for lists | **Bare DTO.** Both `@c1rcle/contracts` and `@c1rcle/api-client` already implement it. |
| C-3 | Error envelope | flat `{ code, message, ..., requestId }` | flat `{ code, message, status, requestId, fieldErrors? }` | **Agree.** From every path including 404 and unhandled 5xx (D-009). |
| C-4 | Identity mechanism | "Firebase ID-token verification" (manifest) vs "Better Auth" (middleware doc) — self-contradictory | Better Auth: httpOnly cookie + `bearer()` plugin; access token = Better Auth session token via `set-auth-token` header, **not a minted JWT** | **Better Auth** (D-001, open-q3 resolved). |
| C-5 | Middleware chain | global `onRequest`: tracing → auth → cache-bookkeeping; per-route `preHandler`: `rateLimit → validateV2 → requirePermission → cached → handler` | identical | **Agree.** The frontend cooperates with this exact order (§4). |
| C-6 | Rate-limit classes | 4 (middleware doc) vs 9 (manifest); burst numbers disagree | 4: `PUBLIC_READ` 120 / `AUTH_READ` 240 / `STANDARD_COMMAND` 60 / `SENSITIVE_COMMAND` 10, per 60s; auth routes = `SENSITIVE_COMMAND` | **4-class model.** Frontend handles `429` + `Retry-After`. |
| C-7 | CSRF | "**frontend / thin-BFF concern, not the gateway**" (PLAN:125 lists cookies + CSRF as an approved Next.js BFF use case); gateway has none | gateway relies on Bearer + CORS-credentials + SameSite; prod cross-domain "needs revisit" (D-001) | **A minimal Next.js BFF owns the cookie/CSRF surface** (§8). Doc-sanctioned; also fixes the unresolved prod cross-domain cookie problem. |
| C-8 | Idempotency key | "one key per user **intent**, not per network retry" (RM:407, PLAN:293) | current partial FE wiring mints a fresh UUID per HTTP call — wrong | **Key minted at the user-action call site**, stable across the client's internal retries (§7). |
| C-9 | Runtime route truth | `route-manifest.ts` doc says only 3 ACTIVE routes | ~80 routes registered; `apps/api-gateway/src/routes/v2/route-manifest.ts` + route files are truth | **The code manifest is truth.** The doc manifest is stale. |
| C-10 | `role` on the user | V1 role soup (`user`/`onboarding`/`partner`/`venue`/`host`/`promoter`/…) | V2 `role ∈ {guest, partner, admin}`, server-set; `/auth/signup` forces `partner` | **`{guest, partner, admin}`.** Per-org capability/role is a **separate** concern resolved from `GET /organizations/:id/access`, never from the token. |

Record these in `C1RCLE-BACKEND/docs/architecture/decisions.md` as a new decision entry (D-024) when the backend punch-list lands.

---

## 3. Architecture and module boundaries

### 3.1 Target layering

```
Server Component (page.tsx / layout.tsx)
  └─ reads: server session bootstrap + one gateway call; passes typed props down
       │
Client island ('use client')
  └─ interaction only; mutations via a repository method (which owns the Idempotency-Key)
       │
Repository  (src/lib/<domain>/ — one per domain)
  └─ calls the transport; parses every response with a @c1rcle/contracts schema;
     maps DTO → UI model via an explicit toUiModel(); maps ApiClientError → typed query state
       │
@c1rcle/api-client   ── the ONLY module that calls fetch ──
  └─ getToken() (from @c1rcle/auth), reauth() (401 → refresh → retry once), x-request-id, timeout, backoff
       │
   ┌───┴────────────────────────────┐
   │                                │
Data reads/mutations           Cookie/CSRF-bearing auth calls
→ direct to gateway            → Next.js BFF (app/api/auth/*) → gateway
  (Authorization: Bearer,        (Origin check + double-submit CSRF +
   CSRF-immune)                   httpOnly cookie re-scoped to FE origin)
       │
Fastify /api/v2  (backend decides everything)
```

### 3.2 Single-owner packages (lint-enforced — `no-restricted-imports` / `no-restricted-syntax`)

| Capability | Sole owner | Everyone else |
|---|---|---|
| Network / HTTP | `@c1rcle/api-client` | no `fetch`, no `axios`, no second client |
| Session / access token | `@c1rcle/auth` | no ad-hoc token storage, no `firebase/auth` |
| Environment variables | `@c1rcle/config` | no `process.env` outside it |
| Wire contracts (zod + types) | `@c1rcle/contracts` (backend-owned, mirrored to FE) | no hand-written response schemas or decoders |

These four rules already exist in `C1RCLE-FRONTEND/docs/architecture/README.md`; this slice adds `@c1rcle/auth` and `@c1rcle/contracts` to the enforced set and makes them true in `partner-dashboard`.

### 3.3 Modular-monolith conformance

The modular-monolith rule (V2 master prompt §5) governs the **backend**. The two backend changes in this slice stay within existing module boundaries:

- `packages/contracts` build + `scripts/export-contracts.mjs` — tooling, no module touched.
- `buildActorContext` fix in `packages/core/src/infrastructure/utils.ts` — infrastructure layer importing `UnauthorizedError` from `packages/core/src/domain/errors.ts` (dependency points inward — allowed).

The **frontend** equivalent — feature modules with clear boundaries, single-owner packages, data access only through repositories — is the whole point of §3.1. The current `DashboardAuthProvider.tsx` (618 lines: mock Firebase + raw `fetch` + 30s polling + routing + permission derivation) is itself a boundary violation. This slice decomposes it into five focused units (§9), each independently testable, each answering "what does it do, how do you use it, what does it depend on".

---

## 4. The request pipeline the frontend cooperates with

Per C-5, every authenticated `/api/v2` request passes: global `onRequest` (mint/echo `x-request-id` → resolve Better Auth session + membership into `request.actor` → cache bookkeeping) then per-route `preHandler`: `rateLimit → validateV2 → requirePermission → cached → handler`.

Frontend obligations that fall out of this:

1. **`Authorization: Bearer <accessToken>`** on every authenticated call (from `@c1rcle/auth.getAccessToken()`).
2. **`X-Organization-Id: <opaqueId>`** on every org-scoped route, and it **must equal the `:organizationId` path segment**. The path is authoritative for tenant; a mismatch is `403`. The transport asserts `path === header` before sending.
3. **`X-Request-Id`** — already minted per attempt by `@c1rcle/api-client`. Never carries a token or PII.
4. **`Idempotency-Key`** on writes the route marks required — one per user intent (C-8).
5. **`If-Match: <version>`** on the 5 versioned PATCH/PUT routes (org update, venue update, venue profile, venue menu, event update). The version comes from the last read DTO's `version` field.
6. **Content-Type: `application/json`** on writes only; reads send no body.
7. **Error handling by code**: `422 validation` (+ `fieldErrors`) → form field errors; `401 unauthorized` → reauth flow; `403 forbidden` → "not permitted" state (identical whether the resource exists — no oracle); `404 not_found` → typed missing state; `409 conflict` → refetch + retry (version) or "already done" (idempotency); `429 rate_limited` → honor `Retry-After`; `>=500 server` → generic "something went wrong, retry" (backend already strips internals).
8. **Never** fall back to a fixture after any of the above. Render a typed empty / unavailable / retry state.

---

## 5. `@c1rcle/contracts` distribution

### Decision

The V2 docs (D-003, T-series rule 2 / T01, `chatgpt_response.md`) specify: contracts are backend-owned; the end state is a **published versioned package**; the interim mechanism is `scripts/contract-parity.mjs` locking the frontend copy. Neither repo has CI yet, so:

- **New FE workspace package `@c1rcle/contracts`** — *generated*, never hand-edited. `C1RCLE-BACKEND/scripts/export-contracts.mjs` copies `packages/contracts/src/**` into `C1RCLE-FRONTEND/packages/contracts/src/**`, adds the FE package scaffolding (`package.json`, `tsconfig.build.json`, build to JS + `.d.ts` — Next does not transpile workspace TS, per `C1RCLE-FRONTEND` ADR-0003), and a `GENERATED — do not edit` header on every file.
- **`scripts/contract-parity.mjs`** (already exists in the backend) is wired into both repos' `pnpm check` and pre-push hook. It parses shared fixtures through both repos' schemas and asserts identical accept/reject + identical status→code map. Drift → non-zero exit → hook fails.
- `@c1rcle/api-client/src/schemas.ts` becomes **re-exports** from `@c1rcle/contracts` (`pageInfoSchema`, `paginatedSchema`, `roleSchema`, `userSchema`, `sessionSchema`, `noContentSchema`). `@c1rcle/types`' overlapping types (`ApiError`, `ApiErrorCode`, `Role`, `Session`, `User`, `PageInfo`, `Paginated`) become `import type` re-exports of the `@c1rcle/contracts` inferred types, so there is exactly one definition.
- The 16 hand-written partner decoders in `src/lib/partner/api-partner-decoders.ts` are **deleted** in spec C. This slice only needs the auth/onboarding/organization schemas, consumed via `schema.parse()`.

### Upgrade path (not this slice)

Once either repo has CI: publish `@c1rcle/contracts` to GitHub Packages (private) on contract change; the frontend swaps the generated workspace package for a pinned dependency. Same source, one-line distribution change. Tracked, not done here.

---

## 6. `@c1rcle/auth` — the rebuild

Restore the shape the stale `packages/auth/dist/session-store.d.ts` already documents, add the network layer. Split into three files under `packages/auth/src/`:

### 6.1 `session-store.ts` — in-memory state only

```ts
type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface SessionState {
  session: { user: User } | null;   // User from @c1rcle/contracts (id, email, displayName, role, avatarUrl)
  accessToken: string | null;        // in memory ONLY — never localStorage/sessionStorage/IndexedDB/cookie-readable
  expiresAt: number | null;          // epoch ms (matches authBridgeResponseSchema)
  status: SessionStatus;
}
```

- `useSessionStore` (zustand, matching the documented `.d.ts`), `useSession()` → `{ isAuthenticated, isLoading, user }`.
- `getAccessToken(): string | null` — **not a hook**; this is the `TokenProvider` handed to `@c1rcle/api-client`.
- `setSession(session, accessToken, expiresAt)`, `clearSession()`, `markAnonymous()`.
- Delete the `auth = { currentUser: null }` Firebase-shim export.

### 6.2 `auth-client.ts` — network actions

Each uses `createApiClient()` and goes **through the BFF** (`/api/auth/*` on the FE origin, §8), not directly to the gateway, because they set or rely on the httpOnly cookie.

| Action | BFF route → gateway | On success | On failure |
|---|---|---|---|
| `signup({ email, password, displayName })` | `POST /api/auth/signup` → `POST /api/v2/auth/signup` | `setSession(user, accessToken, expiresAt)` | throw typed `ApiClientError` (422 → field errors) |
| `login({ email, password })` | `POST /api/auth/login` → `POST /api/v2/auth/login` | `setSession(...)` | generic message on 401 (no account-existence oracle) |
| `refresh()` | `POST /api/auth/refresh` → `POST /api/v2/auth/refresh` | `setSession(...)` with new token | `clearSession()`, return `false` |
| `logout()` | `POST /api/auth/logout` → `POST /api/v2/auth/logout` | `clearSession()` | `clearSession()` anyway (best-effort) |
| `fetchSession()` | `GET /api/auth/session` → `GET /api/v2/auth/session` | `setSession(user, currentToken, expiresAt)` | `markAnonymous()` |

- `signup` / `login` request bodies are validated client-side against `signupRequestSchema` / `loginRequestSchema` from `@c1rcle/contracts` **before** send. Neither schema has a `role` field — the FE must never send one.
- Response bodies parsed against `authBridgeResponseSchema` (`signup`/`login`/`refresh`) or `sessionSchema` (`GET session`).

### 6.3 `server-session.ts` — server-only bootstrap

- `getServerSession(): Promise<{ user: User } | null>` — a `'server-only'` module. Reads the httpOnly session cookie from `next/headers`, calls `GET /api/v2/auth/session` server-side (Node fetch, no browser), returns the identity for first paint. Returns `null` on 401 without throwing.
- Used by the partner-dashboard root layout to hydrate `SessionProvider` so the first HTML is correct (no logged-out flash).

### 6.4 Refresh-stampede guard

`refresh()` holds a module-level `inFlight: Promise<boolean> | null`. Concurrent callers await the same promise. Cleared in `finally`.

---

## 7. `@c1rcle/api-client` — changes

Minimal, additive, in the single network-owner module:

1. **`reauth?: () => Promise<boolean>`** config hook. On a `401` response: if `reauth` is set and the request is not already a reauth retry, `await reauth()`; if it returns `true`, replay the request **once** (flag set to prevent recursion); else surface `ApiClientError { code: 'unauthorized' }`. `onUnauthorized` stays for the terminal side effect (redirect to `/login`).
2. **Honor `Retry-After`.** On `429` (and `503` with the header), if `Retry-After` is present and parseable, wait that long (capped, e.g. 30s) instead of the exponential-backoff default. Existing jitter applies on top for the header-absent case.
3. No other behavior change. `isRetryable`, timeout, `x-request-id`, zod parse stay as-is.

Wiring (in `partner-dashboard`, once, at the composition root):

```ts
createApiClient({
  getToken: getAccessToken,
  reauth: () => auth.refresh(),                 // returns Promise<boolean>
  onUnauthorized: () => { auth.clearSession(); redirectToLogin(); },
});
```

---

## 8. The auth BFF (Next.js Route Handlers)

`app/api/auth/{signup,login,refresh,logout,session}/route.ts` in `partner-dashboard` — the **only** app-local API routes that survive this slice, justified by the FE architecture README ("app/api routes allowed only as ... approved BFFs") and PLAN:125 (cookies + CSRF = a Next.js BFF concern).

Each handler:

1. **Origin / Sec-Fetch-Site check.** Reject if `Origin` is present and not the app's own origin, or `Sec-Fetch-Site` is `cross-site`. (`login`/`signup` are exempt from the CSRF-token check below but still get this.)
2. **Double-submit CSRF** (on `refresh`, `logout`, and any future cookie-authed mutation): a non-httpOnly `c1rcle.csrf` cookie is set on `login`/`signup` success (random 32-byte base64url, `SameSite=Strict`, `Secure` in prod, `Path=/`). These handlers require a matching `x-csrf-token` request header. Mismatch → `403`.
3. **Prototype-pollution guard.** Strip `__proto__`, `constructor`, `prototype` keys from the parsed JSON body before forwarding.
4. **Forward to the gateway** server-side with the incoming httpOnly session cookie (`refresh`/`logout`/`session`) or the JSON body (`login`/`signup`). No body logging, ever.
5. **Re-scope the cookie.** Take the gateway's `Set-Cookie` (Better Auth session), and re-emit it scoped to the **frontend origin** (`Domain` omitted → host-only, `HttpOnly`, `SameSite=Lax`, `Secure` in prod, `Path=/`, `Max-Age` from the gateway). Result: the browser only ever does cookie business with the frontend origin — this closes the unresolved prod cross-domain `SameSite` gap (C-7).
6. **Return the access token in the JSON body** (`signup`/`login`/`refresh`) for the client to hold in memory. `logout` returns `204`. `session` returns `{ user, expiresAt }`.

Data reads and business mutations do **not** go through the BFF — they call the gateway directly with `Authorization: Bearer`, which is inherently CSRF-safe (a cross-site page cannot read the in-memory token to forge the header).

---

## 9. App integration (`partner-dashboard`)

### 9.1 `DashboardAuthProvider` → five units

| Unit | File | Responsibility |
|---|---|---|
| Session state + network | `@c1rcle/auth` | §6 |
| Server bootstrap | `@c1rcle/auth/server-session` | §6.3 |
| Edge redirect | `src/middleware.ts` | §9.2 |
| Permission read | `src/lib/access/use-org-access.ts` | §9.4 |
| React provider | `src/components/providers/session-provider.tsx` | thin: hydrate from server bootstrap, expose `useSession`, run the idle timer (§9.5), wire `createApiClient` once |

Delete: `src/lib/firebase/client.ts`, `src/lib/auth/getCachedFirebaseIdToken.ts`, all `firebase/auth` + `firebase/storage` imports, the `firebase` dependency in `package.json`. Delete the `/auth/change-password` and `/forgot-password` dead references (password reset is a later slice — Better Auth supports it; no route in this slice).

### 9.2 `middleware.ts` — UX redirect only

Runs on `/venue/:path*`, `/host/:path*`, `/promoter/:path*`, `/verify/:path*`. If the httpOnly session cookie is **absent**, redirect to `/login?next=<path>`. It **cannot** validate the cookie (no secret at the edge) — this is a fast UX redirect, not a security boundary. Real enforcement is per-request at the gateway (`401`/`403`). Documented as such in the file header.

### 9.3 Organization selection

- After login, `GET /api/v2/organizations` (paginated `organizationDtoSchema`). Zero orgs → route to `/onboard`. One → auto-select. Many → `/partner/select-organization`.
- The active org id is stored in a **server-readable, non-httpOnly cookie** `c1rcle.active-org` (`SameSite=Lax`, `Secure` in prod, `Path=/`). An org id is not a secret; a tampered value just yields `403` from the gateway (the actor's membership is re-checked server-side every request — the path `:organizationId` is authoritative).
- Org-scoped routes take the id from this cookie (server) or the route segment (client), and send it as **both** the `:organizationId` path segment and the `X-Organization-Id` header.
- Switching org: set the cookie, call `auth.refresh()` (rotates the token — closes the documented session-fixation-on-privilege-change gap), invalidate any cached server data (`revalidateTag('org')`), navigate.

### 9.4 `useOrgAccess(organizationId)` — permissions, never computed client-side

- Calls `GET /api/v2/organizations/:id/access` → `partnerAccessDtoSchema` = `{ organizationId, userId, partnerType, role, permissions[] (18-verb vocab), tabVisibility (nullable — null means "show all") }`.
- Drives: which studio to render (`partnerType` → `/venue` | `/host` | `/promoter`), nav/tab visibility (`tabVisibility`), and action gating (`permissions.includes('MANAGE_STAFF')` etc.).
- **No `actionPermissions`, no `piiPolicy`, no `isSuspended`** on the V2 DTO (the current `DashboardAuthProvider` reads all three). `canDo()` is replaced by permission checks against the 18-verb list. Suspension surfaces as a `403` from the gateway with an explicit "access suspended" state — fail closed.
- A visible link or an enabled button is **never** an authorization decision; the gateway authorizes every request regardless.

### 9.5 Session lifecycle

- **Idle timeout:** 30 minutes of no user interaction → `clearSession()` + redirect to `/login`. Any pointer/key/visibility event resets the timer.
- **Expiry:** if `expiresAt` is within a threshold on any focus event, call `auth.refresh()` proactively.
- **Reauth:** any `401` from any call → `@c1rcle/api-client`'s `reauth` → `auth.refresh()` → retry once → on failure `clearSession()` + `/login`.

---

## 10. The onboarding journey (V2-reduced)

V1 collected ~40 fields across 6–7 wizard steps with email OTP, phone OTP, entity-type branching, and full KYC (identity + business + signatory + bank). **V2 deliberately reduces this to a 4-string profile + 3 ID images.** The current `onboard/PageClient.tsx` (2791 lines) and `verify/PageClient.tsx` (1203 lines) are rebuilt to the V2 shape.

### 10.1 The V2 flow

| Step | Call | Body | Notes |
|---|---|---|---|
| 1. Account | `POST /api/auth/signup` (BFF → `POST /api/v2/auth/signup`) | `{ email, password, displayName }` | Separate prerequisite, not part of the application. `role` never sent (backend forces `partner`). |
| 2. Start application | `POST /api/v2/onboarding/applications` | `{ requestedType: 'venue'\|'host'\|'promoter', plan: 'basic'\|'silver'\|'diamond', profile }` | `profile` required minimum = **`legalName`, `contactPerson`, `phone`, `city`**. Optional: `area`, `website`, `capacity` (number\|null), `instagram`, `bio`, `businessType` (free string), `registrationNumber`, `entityType` (free string, drives nothing server-side). `Idempotency-Key` required. |
| 3. Autosave | `PATCH /api/v2/onboarding/applications/:id` | `onboardingProfileSchema.partial().strict()` | Not idempotency-keyed (autosave). Wizard step is **client state only** — V2 does not persist `onboardingStep`. Unknown key → `422`. |
| 4. Documents ×3 | `POST /api/v2/onboarding/applications/:id/documents` | `{ label, storagePath }` | Labels: **`id_front`, `id_back`, `selfie`** only. Re-uploading a label replaces it. `Idempotency-Key` required. **See §10.3 — upload deferred this slice.** |
| 5. (optional) format check | `POST /api/v2/onboarding/verify-document` | `{ documentType, documentNumber, holderName? }` | Provider = `format-check`. Returns `{ passed, provider, reason, referenceId }`. **UI renders "format check passed — pending manual review", never "verified", no green tick** (D-018). ≤5 attempts per applicant. |
| 6. Submit | `POST /api/v2/onboarding/applications/:id/submit` | — | Hard-blocks until the 3 required documents are present. `Idempotency-Key` required. |
| 7. Poll status | `GET /api/v2/onboarding/me` | — | Returns `{ request: onboardingRequestDtoSchema \| null }`. Status values: `draft \| submitted \| changes_requested \| approved \| rejected`. On `approved` → `GET /api/v2/organizations` (the provisioned org now exists) → land in studio. |

### 10.2 Fields cut from the current wizard (no V2 home)

Removed from the UI entirely: `password` as a wizard step (it's step 1, `/auth/signup`); plan option `gold` (V2 = `basic|silver|diamond`); host-category `role`; `association`, `associatedHostId`; `upcomingEventsText`, `pastEventsText`; email OTP + phone OTP steps and `/api/auth/otp/*`, `/api/auth/check-email`, `/api/auth/check-availability` (**V2 has no phone verification at all**; Better Auth owns email); entity-type branching logic (`entityType` is a free string that gates nothing); KYC business block (`pan`, `cin`, `gst`, `registrationCert`); KYC signatory block; `bank_setup` step (payouts = later phase); the entire post-approval "Verification Hub" (`verify/PageClient.tsx`, `/api/kyc` GET/PATCH — a dead proxy with no V2 backend). `mustChangePassword` and the `/auth/change-password` redirect are removed (no V2 field).

### 10.3 KYC document upload — deferred this slice

The backend `POST /onboarding/applications/:id/documents` expects the client to have already uploaded the file to storage and to pass a `storagePath`. Backend signed-URL issuing is a **deferred Phase 2 item** (`C1RCLE-BACKEND/docs/roadmap/phase-02-kyc-onboarding.md`), and a client-side Firebase Storage upload contradicts "no Firebase in the frontend" (FE architecture README, D-023).

**Resolution:** the wizard collects everything else and reaches step 6 minus documents. The document step renders an honest **"Document upload will be enabled shortly"** product state (not a mock, not a fixture — a real not-yet-available state). Submit is disabled with a clear reason. Added to the **backend punch list**: signed-URL issuing (`POST /onboarding/applications/:id/documents/upload-url` → `{ uploadUrl, storagePath, expiresAt }`). When it lands, a follow-up slice wires the upload (a plain `PUT` to the signed URL from `@c1rcle/api-client`, then the existing `documents` POST). This is the one place the journey is not fully end-to-end, and it is flagged, not hidden.

### 10.4 `/verify` IFSC lookup

`verify/PageClient.tsx:715` calls `https://ifsc.razorpay.com/:ifsc` directly. No external `fetch` from the client (FE arch README). Bank setup is out of scope (payouts = Phase 6). The IFSC field and the whole `/verify` route are removed in this slice; bank details become a Phase 6 concern with a backend-owned lookup.

---

## 11. Security requirements

Every item below is traceable to `thec1rcle/{SECURITY_HARDENING.md, docs/threat-model.md, docs/credential-checklist.md, docs/04-SECURITY-AUDITS.md, PAYMENT_TICKET_CODE_REVIEW.md}`, `Circle1/SECURITY_AUDIT_PARTNER_DASHBOARD.md`, `C1RCLE-BACKEND/docs/architecture/{README.md §5, decisions.md}`, or a listed past incident.

### 11.1 Token & session

- Access token **in memory only** — never `localStorage`, `sessionStorage`, `IndexedDB`, or a JS-readable cookie. Lint rule (`no-restricted-properties` on `localStorage`/`sessionStorage` in the auth package + a repo-wide grep gate).
- Durable credential = backend-owned **httpOnly** cookie, re-scoped to the FE origin by the BFF (§8). `SameSite=Lax`, `Secure` in prod, `Path=/`, host-only.
- **Token rotation on privilege change / org switch** — `auth.refresh()` when `useOrgAccess` resolves a role that differs from the last known one, and on every org switch (closes the documented session-fixation gap, `SECURITY_AUDIT_PARTNER_DASHBOARD.md` Phase 3 #11).
- Logout **revokes the server session** (Better Auth `signOut`), not just drops the cookie.
- **Refresh-stampede guard** — concurrent `401`s share one in-flight `refresh()` (§6.4).
- **Reauth-recursion guard** — a replayed request is flagged; a second `401` on it does not loop (§7).
- 30-minute idle timeout (§9.5).
- Suspended user → `403` from the gateway → explicit "access suspended" state, **fail closed** (threat-model P3: default DENY on any security-check failure).

### 11.2 CSRF

- Cookie-bearing calls (`refresh`, `logout`) go through the BFF with an **Origin/Sec-Fetch-Site check + double-submit CSRF token** (§8). Closes `SECURITY_AUDIT_PARTNER_DASHBOARD.md` Critical #1 ("CSRF protection MISSING").
- Business mutations use `Authorization: Bearer` on the in-memory token — structurally CSRF-immune (a cross-site page cannot read it).
- `login`/`signup` carry no ambient credential, so they need only the Origin check.

### 11.3 XSS / CSP / headers

- **Full-document `Content-Security-Policy`** added to `partner-dashboard/next.config.ts` (currently absent — `SECURITY_AUDIT_PARTNER_DASHBOARD.md` #10): `default-src 'self'`; `script-src 'self' 'nonce-<per-request>'` (or `'strict-dynamic'`); `connect-src 'self' <NEXT_PUBLIC_API_BASE_URL>`; `img-src 'self' data: https:`; `style-src 'self' 'unsafe-inline'`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `upgrade-insecure-requests`.
- Add **`Strict-Transport-Security: max-age=31536000; includeSubDomains`** (missing). Keep the existing `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- **Zero `dangerouslySetInnerHTML`**, no `eval`/`Function`. Existing empty-`catch {}` ban applies.
- The in-memory token is the XSS-mitigation for credential theft; the CSP is the defense that keeps injected script out in the first place.

### 11.4 CORS

- The gateway already has an explicit origin allowlist + `credentials: true`. With the BFF pattern, browser→gateway calls carry only `Bearer` (no cookie), so `credentials` is not required for those; the allowlist stays as-is for defense in depth.

### 11.5 Rate limiting

- Auth routes are `SENSITIVE_COMMAND` (10 / 60s) at the gateway. The BFF does not add its own limiter (per-instance limiters fail in serverless — `SECURITY_AUDIT_PARTNER_DASHBOARD.md` §6); it forwards and surfaces `429` + `Retry-After` (§7).
- The mock `/api/auth/check-email` and `/api/auth/check-availability` (email/phone enumeration surface) are **deleted, not replaced** — signup handles a duplicate with a generic message.

### 11.6 PII

- Money as integer **paise**, timestamps as **ISO-8601 strings** — except `Session.expiresAt` and `AdminAuditRecord.occurredAt` which are **epoch ms** (per `@c1rcle/contracts`). Format only in the presentation layer.
- The BFF **never logs request or response bodies** (CWE-532 — `thec1rcle/docs/Majid/Request_Body_PII_Logging_Fix.md`). No `console.log` in committed code anywhere.
- No token, OTP, password, email, or document number in any URL, query string, or `x-request-id`.
- KYC / Aadhaar values live in client state only for the active step, never persisted client-side, never logged.
- `verify-document` result never rendered as "verified" (§10.1, D-018).
- Onboarding/dashboard responses: the FE renders only the allowlisted DTO fields the backend returns; it does not attempt to reconstruct dropped V1 fields (`isBanned`, `subscriptionPlan`, org `verified`/`completion`, etc.).

### 11.7 Error disclosure

- Login failure → one generic message ("Incorrect email or password"), identical for unknown-account and wrong-password (no enumeration oracle). Verify the backend `forwardAuthErrorResponse` message is generic; if not, that is a backend punch-list item.
- `403` responses are rendered identically whether or not the resource exists (IDOR-safe, D-012).
- The gateway already strips 5xx internals; the FE shows a generic retry state and logs nothing sensitive.

### 11.8 Mass assignment / prototype pollution

- The BFF strips `__proto__`/`constructor`/`prototype` from bodies (§8, `SECURITY_AUDIT_PARTNER_DASHBOARD.md` #2).
- All request bodies are built from explicit typed objects, never spread from user-controlled maps. `@c1rcle/contracts` request schemas are `.strict()` — the second layer at the gateway.
- **`role` is never present in any auth or onboarding request body.** The backend sets it server-side; `onboardingProfileSchema` strips it (`sanitizeApplicantProfile` allow-list).

### 11.9 Frontend posture (existing rules, made true here)

- No backend SDKs, no Firebase Admin, no database clients, no secrets in the repo. `firebase` dependency deleted.
- No `fetch` outside `@c1rcle/api-client`; no `process.env` outside `@c1rcle/config` (delete the raw `NEXT_PUBLIC_PARTNER_USE_REAL_API` / `NEXT_PUBLIC_PARTNER_DEV_ORG_ID` reads — add any needed keys to `clientEnvSchema`).
- Initial reads in Server Components; client components for interaction only.
- No fixture / mock fallback after an API error — typed empty / unavailable / retry state.
- Zod validation (`@c1rcle/contracts`) on every response entering the app.

---

## 12. Mock teardown (this slice)

**Delete:**
- `apps/partner-dashboard/src/lib/firebase/client.ts`
- `apps/partner-dashboard/src/lib/auth/getCachedFirebaseIdToken.ts`
- `apps/partner-dashboard/src/app/api/auth/{me,partner-context,profile,check-email,check-availability,create-account,onboard,onboard-status,onboarding-progress}/route.ts`
- `apps/partner-dashboard/src/app/api/auth/otp/{send,verify}/route.ts`
- `apps/partner-dashboard/src/app/api/kyc/{route.ts,upload/route.ts,verify-aadhaar/route.ts}`
- `apps/partner-dashboard/src/app/verify/**` (bank/KYC-hub — no V2 backend)
- `firebase` from `apps/partner-dashboard/package.json`
- all `firebase/auth`, `firebase/storage` imports

**Add:** `apps/partner-dashboard/src/app/api/auth/{signup,login,refresh,logout,session}/route.ts` (the BFF, §8) — the only surviving app-local API routes.

**Net:** 14 mock routes → 5 real BFF routes; ~4000 lines of mock auth/wizard code → focused units.

---

## 13. Backend punch list (`C1RCLE-BACKEND` @ `main`)

Small, in-layer, part of this slice's plan:

1. **`packages/contracts` build + `scripts/export-contracts.mjs`** (§5). Wire `contract-parity.mjs` into `pnpm check` + pre-push both repos.
2. **`buildActorContext` (`packages/core/src/infrastructure/utils.ts`)** — throw `UnauthorizedError` (code `unauthorized`), not a generic `Error`, when no actor is resolved on the firestore driver. Fixes routes without `requirePermission` (onboarding, admin) returning `500` instead of `401` when unauthenticated.
3. **Verify `forwardAuthErrorResponse` (`routes/v2/auth/index.ts`)** emits a generic, non-enumerating message on login failure. Adjust if it leaks account existence.
4. **Confirm Better Auth cookie flags** — `httpOnly`, `SameSite`, `Secure`-in-prod, rotation enabled, `trustedOrigins` includes the FE origins. Adjust config if needed.
5. **Record D-024** in `docs/architecture/decisions.md` — the §2 conflict resolutions.

Deferred (tracked, not this slice): **signed-URL issuing for onboarding documents** (`POST /onboarding/applications/:id/documents/upload-url`). Blocks §10.3.

---

## 14. Testing

### Unit
- `@c1rcle/auth`: `login`/`signup`/`refresh`/`logout`/`fetchSession` store transitions; refresh-stampede (N concurrent → 1 network call); no token in any storage (spy on `localStorage`/`sessionStorage` — asserted zero writes).
- `@c1rcle/api-client`: `reauth` — 401 → reauth true → one retry → success; reauth false → `unauthorized` surfaced; a retried request that 401s again does not loop; `Retry-After` honored on 429.
- BFF handlers: Origin check rejects cross-site; CSRF double-submit mismatch → 403; prototype-pollution keys stripped; cookie re-scoped to FE origin; no body logging (spy on console).
- `useOrgAccess`: maps `partnerAccessDtoSchema` → studio + tab visibility; `tabVisibility: null` → all tabs.

### Contract
- `contract-parity.mjs` green both directions in `pnpm check`.
- Every response the auth/onboarding repositories parse has a `@c1rcle/contracts` schema (no `z.unknown()`).

### Integration / E2E (`apps/partner-dashboard/e2e`, Playwright)
- Full journey against a real gateway on `STORAGE_DRIVER=firestore`: signup → start application → autosave → (documents step shows deferred state) → submit blocked without docs → seed an approved application via an admin call → `GET /onboarding/me` returns `approved` → `GET /organizations` → land in `/venue/overview` (or host/promoter) with a real session.
- Assert: zero requests to any deleted `/api/auth/*` or `/api/kyc/*` route; every `/api/v2` request carries `Authorization: Bearer` and (for org-scoped) matching `X-Organization-Id` + path; a forced 401 mid-session triggers exactly one refresh + retry.
- Security: CSP header present and correct; no token in `localStorage`/`sessionStorage` at any point; login with a wrong password shows the generic message.

### Local dev setup (documented in the plan)
- `C1RCLE-BACKEND/apps/api-gateway/.env.local` with `STORAGE_DRIVER=firestore` + the `thec1rcle-india` Firebase credentials (already the documented dev sandbox, D-008).
- `C1RCLE-FRONTEND` `.env.local` with `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`.
- `NODE_OPTIONS=--dns-result-order=ipv4first` for backend commands (phase-00 Session Log — this sandbox has no IPv6 route).

---

## 15. Slice order (for the implementation plan)

Each is one builder subagent, distinct files, its own tests, verified before the next starts.

1. **Backend foundation** — `packages/contracts` build + `export-contracts.mjs`; `buildActorContext` → `UnauthorizedError`; parity wired; D-024 recorded. Gate: `pnpm check` green in `C1RCLE-BACKEND`; parity green.
2. **FE `@c1rcle/contracts` + `@c1rcle/api-client`** — generate the FE package; `api-client/schemas.ts` re-exports; `@c1rcle/types` overlap collapsed; add `reauth` + `Retry-After`. Gate: `@c1rcle/api-client` tests green; typecheck green.
3. **FE `@c1rcle/auth`** — `session-store.ts` (zustand), `auth-client.ts`, `server-session.ts`, refresh-stampede guard; delete the Firebase shim. Gate: unit tests green.
4. **FE auth BFF** — the 5 route handlers, Origin check, CSRF double-submit, prototype-pollution strip, cookie re-scope. Gate: handler tests green.
5. **FE app integration** — `session-provider.tsx`, `middleware.ts`, `createApiClient` wiring, idle timer, org-selection + `c1rcle.active-org` cookie, `use-org-access.ts`. Gate: provider tests green; app boots.
6. **FE `/login` + `/signup`** — rebuilt against `@c1rcle/auth`; delete the mock auth routes + Firebase client. Gate: login/signup E2E green; grep confirms no `/api/auth/{me,...}` calls remain.
7. **FE `/onboard`** — rebuilt to the V2 4-string-profile + deferred-documents flow; delete the KYC mock routes + `/verify`; delete the `firebase` dependency. Gate: onboarding E2E green (through submit-blocked-without-docs).
8. **CSP + headers + full E2E + parity** — `next.config.ts` CSP/HSTS; the full journey E2E; security assertions; `pnpm check` green in both repos.

---

## 16. Open questions

1. **Approved-application seeding for E2E** — does an admin endpoint exist to approve an onboarding application in a test run (`POST /api/v2/admin/onboarding/applications/:id/approve` needs a platform-admin session)? The plan needs a seed path. Fallback: a backend seed script.
2. **`displayName` at signup vs `legalName` in the profile** — the wizard collects a person's name at signup and a legal/entity name in the application. Confirm these are distinct fields the UI should ask for separately (they are, per the DTOs).
3. **Password reset** — out of this slice. Better Auth supports it; a `/forgot-password` route + `POST /api/v2/auth/*` reset endpoints are a small follow-up. Confirm the backend exposes them or add to the punch list.
4. **`c1rcle.active-org` cookie vs URL** — the spec uses the cookie as the source of truth with the URL segment as an override. Confirm this matches how the studio routes are structured (they are currently `/venue/*` with no org segment).

---

## 17. Appendix — V1 → V2 field delta (surfaces touched by this slice)

Full delta in the investigation notes; the load-bearing parts:

**User DTO** (`userSchema`, 5 fields): `id` (was `uid`), `email`, `displayName`, `role` (`guest|partner|admin`, was role-soup), `avatarUrl` (was `photoURL`/`avatar`). **Dropped:** `phone`, `isApproved` (now derived: a provisioned org exists), `isBanned`, `onboardingComplete`/`onboardingStatus`/`onboardingStep`, `entityType`, `mustChangePassword`, `subscriptionPlan`/`tier`, `venueId`/`partnerId` (derived from membership).

**Session:** `GET /auth/session` → `{ user, expiresAt (epoch ms) }`. `signup`/`login`/`refresh` → `{ user, accessToken, expiresAt }`. **Dropped:** the V1 `/me` bootstrap blob — `memberships[]`, `activeMembership`, `onboarding` block, `csrfToken`, `profile`. Those are now separate endpoints (`GET /onboarding/me`, `GET /organizations`, `GET /organizations/:id/access`).

**OnboardingProfile** (`onboardingProfileSchema`, `.strict()`, `role` stripped): required `legalName` (was `name`), `contactPerson`, `phone`, `city`; optional `area`, `website`, `capacity` (number|null, was string), `instagram`, `bio`, `businessType` (free string), `registrationNumber`, `entityType` (free string). **Dropped:** `role` (host category), `plan` (moved to the request), `association`, `associatedHostId`, `upcomingEventsText`, `pastEventsText`, `email`, `password`.

**OnboardingRequest:** `requestedType` (was `type`), `status` (`draft|submitted|changes_requested|approved|rejected`), `plan` (`basic|silver|diamond` — **no `gold`**), `profile`, `documents[]`, `missingDocuments[]` (derived), `reviewNote` (merged `rejectionReason` + `changeRequestMessage`), `provisionedOrganizationId`, `version`. Timestamps ISO-8601.

**Documents:** `{ label, storagePath, uploadedAt }`. Required labels: `id_front`, `id_back`, `selfie` only. **Dropped:** all structured KYC (`kyc_identity`/`kyc_business`/`kyc_signatory` field bags), `bank_setup`, per-step review vocab, `kycStatus`.

**Organization DTO:** `{ id, name, slug, role (caller's role in the org), status (active|suspended|archived), version, createdAt, updatedAt }`. `provisionedOrganizationDtoSchema` adds `ownerId`, `platformFeePercent` (whole-number percent, **not paise**). **Dropped from the DTO:** `isVerified`, `city`/`area`/`capacity` (→ venue), `bio`/`tagline`/`hostType`/images/`socialLinks`/contact (profile write surface is a follow-up).

**OrganizationMember DTO:** `{ userId, role (owner|admin|manager|member), capabilities: (host|venue|promoter)[], joinedAt (ISO), invitedBy? }`. **Dropped:** `partnerId`/`partnerName`/`membershipId`, `status`, `isActive`, stored `permissions[]` (derived server-side).

**PartnerAccess DTO:** `{ organizationId, userId, partnerType, role, permissions[] (18-verb vocab), tabVisibility (nullable, null = show all) }`. **Dropped:** `actionPermissions`, `piiPolicy`, `isSuspended`.
