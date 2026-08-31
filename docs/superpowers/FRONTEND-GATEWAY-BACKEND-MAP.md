# Frontend → API Gateway → Backend — the whole map

One reference from a `partner-dashboard` pixel to a Firestore document. Written
2026-08-31 from the live code (`C1RCLE-BACKEND` `main` `2a9a4b3`, `C1RCLE-FRONTEND`
`staging` `0b0cc51`). Where a contract detail is inferred rather than re-read,
it is marked **⚠verify** — check `C1RCLE-BACKEND/docs/reference/API_ROUTE_CATALOG.generated.md`
and the schema in `packages/contracts/src/contracts/*.ts`.

Governing docs: the master prompt (`docs/reference/V2 Backend Engineering …`) for
process + the non-negotiables; `C1RCLE-BACKEND/docs/architecture/decisions.md`
(D-001…D-024) is the authority where it is newer/more specific; the frontend
design spec `specs/2026-08-27-frontend-gateway-auth-foundation-design.md` §2 is
the conflict-resolution table. `chatgpt_response.md` is architecture *advice*,
not a binding spec — see §8 below for where it diverges from the build.

---

## 1. The layered pipeline

```
┌─ partner-dashboard (Next.js 16, app router) ───────────────────────────────────┐
│                                                                               │
│  Server Component (page.tsx / layout.tsx)                                      │
│    • first paint: await getServerSession((await cookies()).toString())         │
│    • one gateway read per page, passes typed props down                        │
│         │                                                                      │
│  Client island ('use client')  — interaction only                             │
│         │                                                                      │
│  src/lib/<domain>/  — one repository per domain  (spec §3.1)                   │
│    • calls the transport                                                       │
│    • parses EVERY response with a @c1rcle/contracts zod schema (bare DTO)      │
│    • DTO → UI model via an explicit toUiModel()                                │
│    • maps ApiClientError → typed { data | empty | unavailable | retry } state  │
│    • owns the Idempotency-Key for its own mutations (one per user intent)      │
│         │                                                                      │
│  @c1rcle/api-client  — THE ONLY module that calls fetch                        │
│    • getToken() from @c1rcle/auth  → Authorization: Bearer <in-memory token>   │
│    • x-request-id per attempt · timeout · exponential backoff + jitter         │
│    • reauth(): 401 → @c1rcle/auth.refresh() → replay once (recursion-guarded)  │
│    • honours Retry-After on 429/503 (capped 30s)                               │
│         │                                                                      │
│    ┌────┴──────────────────────────────┐                                       │
│    │                                   │                                       │
│  data / business calls          cookie / CSRF auth calls                       │
│  → DIRECT to the gateway        → Next BFF: app/api/auth/{signup,login,        │
│    (Bearer, CSRF-immune —         refresh,logout,session}/route.ts             │
│     a cross-site page can't       → src/lib/bff/auth-proxy.ts                  │
│     read the in-memory token)       • Origin / Sec-Fetch-Site check           │
│                                     • double-submit CSRF (c1rcle.csrf cookie   │
│                                       vs x-csrf-token header) on refresh/logout│
│                                     • strip __proto__/constructor/prototype    │
│                                     • forward server-side, no body logging     │
│                                     • re-scope Better Auth Set-Cookie to the   │
│                                       FE origin (Domain dropped, HttpOnly,     │
│                                       SameSite=Lax, Secure in prod)            │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │  HTTPS
┌─ Fastify API gateway  (apps/api-gateway) ─────────────────────────────────────┐
│                                                                               │
│  global onRequest hook (plugins/):                                            │
│    mint/echo x-request-id  →  resolve Better Auth session → request.user      │
│    →  resolve org membership (if X-Organization-Id) → request.authContext     │
│    →  cache bookkeeping                                                        │
│         │   (memory driver: fabricates a full-access dev actor, never 401)    │
│         │   (firestore driver: real Better Auth; no session → 401 downstream) │
│  per-route preHandler chain:                                                  │
│    rateLimit(<class>)  →  validateV2({params,query,headers,body})             │
│    →  requirePermission(<verb>)  →  cached(<policy>)  →  handler              │
│         │                                                                      │
│  route file (routes/v2/**)  — THIN: validate → auth → policy →               │
│    ONE services.<x>.<method>() call → validateV2Response → reply.send         │
│    (no .collection(), no business logic, no process.env — guardrail-enforced) │
│         │                                                                      │
│  @c1rcle/core  application service  (packages/core/src/application/**)         │
│    • business rules, cross-aggregate orchestration                            │
│    • requireOrgAccess(actor, orgId)  — tenant guard, throws ForbiddenError    │
│    • emits domain events to the outbox in the same unit of work               │
│         │                                                                      │
│  domain model  (packages/core/src/domain/models/**)  — pure                   │
│    • invariants, finite state machines (event lifecycle, scan ledger, …)      │
│    • value objects: money = integer paise, opaque IDs ≤64 chars               │
│         │                                                                      │
│  domain/ports/*  — repository & provider INTERFACES  (dependency inversion)   │
│    repositories.ts · verification.ts · object-storage.ts · payment-provider.ts│
│    · outbox.ts · audit.ts · idempotency.ts                                    │
│         │                                                                      │
│  infrastructure  (packages/core/src/infrastructure/**)                        │
│    STORAGE_DRIVER=memory  → Memory*Repository        (pnpm test, CI, local)   │
│    STORAGE_DRIVER=firestore → Firestore*Repository   (pnpm dev, staging, prod)│
│    the route/service layer never knows which                                  │
│         │                                                                      │
│  Firestore  — collections prefixed  v2_*  (never shared with V1 `thec1rcle`)  │
│                                                                               │
│  outbox → InProcessEventBus → audit consumer + projection consumer (no-op yet)│
└───────────────────────────────────────────────────────────────────────────────┘
```

**Dependency direction (inward only):** infrastructure → ports ← domain ← application ← routes.
`packages/core` never imports Fastify, `process.env`, or `firebase-admin`
(exception: `infrastructure/firestore/` is the one place `firebase-admin` is
allowed — `scripts/check-boundaries.mjs` Rule 3).

---

## 2. Contract flow (backend owns, frontend imports)

```
C1RCLE-BACKEND/packages/contracts/src/contracts/*.ts   ← SINGLE SOURCE OF TRUTH
        │  scripts/export-contracts.mjs --frontend ../C1RCLE-FRONTEND
        ▼
C1RCLE-FRONTEND/packages/contracts/src/**   (GENERATED — never hand-edit;
        │                                     every file carries a GENERATED header)
        │  tsc -b  →  dist/  (Next does not transpile workspace TS — FE ADR-0003)
        ▼
  @c1rcle/contracts        →  domain schemas + types (auth, onboarding,
  @c1rcle/contracts/client     organization, partner, event, checkout, phase5, shared)
        │
  @c1rcle/api-client/src/schemas.ts  re-exports the shared primitives
        ▼
  apps import wire schemas ONLY from @c1rcle/contracts — no hand-written decoders
```

**Backstop:** `C1RCLE-BACKEND/scripts/contract-parity.mjs --frontend ../C1RCLE-FRONTEND`
parses shared fixtures through both repos' schemas and asserts identical
accept/reject + status→code map. 59 checks, run in both repos' `pnpm check`.
Drift → non-zero exit.

**End state (not yet):** publish a versioned `@c1rcle/contracts` to a private
registry; the frontend pins it instead of vendoring the generated copy. Same
source, one-line distribution change (D-003 / spec §5).

---

## 3. The wire contract (what every call obeys)

### Success envelope — **bare DTO**
The response body *is* the DTO (`organizationDtoSchema`, `onboardingRequestDtoSchema`, …),
or `{ items, pageInfo }` for lists, or `204` with no body. **No `{ data, meta }`
wrapper** (spec C-2, D-004). `@c1rcle/api-client` validates it against the schema
the caller passes; a mismatch throws `ApiClientError { code: 'parse' }`.

### Error envelope — **flat**, from every path incl. 404 and unhandled 5xx (D-009)
```jsonc
{ "code": "<ApiErrorCode>", "message": "<safe string>", "status": <int>,
  "requestId": "<uuid>", "fieldErrors": { "<field>": ["<msg>"] } }   // fieldErrors only on 422
```
`ApiErrorCode` (lowercase): `validation` (400/422) · `unauthorized` (401) ·
`forbidden` (403) · `not_found` (404) · `conflict` (409) · `rate_limited` (429) ·
`server` (≥500) · plus client-only `network` / `timeout` / `parse` / `unknown`
from `@c1rcle/api-client`. Backend never leaks stack traces / SQL / paths.

### Headers the frontend sends
| Header | When | Notes |
|---|---|---|
| `Authorization: Bearer <token>` | every authenticated call | Better Auth **session token** (via `bearer()` plugin's `set-auth-token`), NOT a minted JWT (D-001, C-4). In-memory only — never localStorage/cookie/URL. |
| `X-Organization-Id: <opaqueId>` | every org-scoped route | **must equal the `:organizationId` path segment** — the path is authoritative; mismatch → 403. The transport asserts `path === header` before sending. |
| `X-Request-Id: <uuid>` | every attempt | minted by `@c1rcle/api-client`; never carries token or PII. |
| `Idempotency-Key: <key>` | writes the route marks required | one key per **user intent**, stable across the client's internal retries (C-8) — minted at the action call site, not per fetch. |
| `If-Match: <version>` | the 5 versioned PATCH/PUT (org update, venue update, venue profile, venue menu, event update) | value = `version` from the last read DTO. `409 conflict` on mismatch. |
| `Content-Type: application/json` | writes only | reads send no body. |
| `x-csrf-token` | BFF `refresh` / `logout` only | double-submit vs the non-httpOnly `c1rcle.csrf` cookie. |

### Rate classes (4, per 60s window — spec C-6)
`PUBLIC_READ` 120 · `AUTH_READ` 240 · `STANDARD_COMMAND` 60 · `SENSITIVE_COMMAND` 10.
Auth routes (`/auth/signup`, `/auth/login`) = `SENSITIVE_COMMAND`. `429` carries
`Retry-After`; `@c1rcle/api-client` honours it (capped 30s).

### Types
Timestamps = ISO-8601 strings **except** `Session.expiresAt` and
`AdminAuditRecord.occurredAt` = epoch ms. Money = integer **paise** (except
`platformFeePercent` = whole-number percent). Opaque IDs, `^[A-Za-z0-9][A-Za-z0-9_-]*$`, ≤64.

### Auth model (D-001)
Better Auth: httpOnly session cookie + in-memory bearer. **Real auth only on
`STORAGE_DRIVER=firestore`** — the memory driver fabricates a full-access dev
actor (prod-safe: gated on the env, documented). Session cookie name
`better-auth.session_token` (`__Secure-` prefix in prod). `role ∈ {guest,
partner, admin}`, server-set; `/auth/signup` forces `partner`. Per-org
capability/role comes from `GET /organizations/:id/access`, **never** the token
(C-10).

---

## 4. partner-dashboard surface → gateway endpoint → backend chain

Legend — **Status**: 🟢 LIVE (route + service real, firestore driver) ·
🟡 route real but the UI needs fields/rollups the bare DTO doesn't carry (needs a
read model) · 🔴 no backend at all (BLOCKED — not registered) · 🟠 registered but
returns honest 501.

### 4.1 Auth & onboarding journey  (Sagar / Anil / Majid own the FE)

| FE surface | FE calls | route | hop | `/api/v2` endpoint | service.method | domain / repo | Status |
|---|---|---|---|---|---|---|---|
| `/signup` form | `auth.signup()` | — | BFF | `POST /auth/signup` | Better Auth `signUpEmail` + `runAuthFlow` | `v2_auth_*` | 🟢 (firestore only) |
| `/login` form | `auth.login()` | — | BFF | `POST /auth/login` | Better Auth `signInEmail` | " | 🟢 |
| `SessionProvider` mount, idle-refresh | `auth.refresh()` | — | BFF (CSRF) | `POST /auth/refresh` | re-validate cookie | " | 🟢 |
| logout / idle timeout | `auth.logout()` | — | BFF (CSRF) | `POST /auth/logout` | revoke session | " | 🟢 |
| root layout first paint | `getServerSession(cookie)` | server | direct | `GET /auth/session` | `getSession` | " | 🟢 → `{ user, expiresAt }` |
| `/onboard` resume | `onboardingRepo.getMine()` | server | direct | `GET /onboarding/me` | `OnboardingService.getMine` | `OnboardingRequest` / `onboarding` repo | 🟢 → `{ request \| null }` |
| `/onboard` step 1 submit | `onboardingRepo.start()` | client | direct | `POST /onboarding/applications` (Idem-Key) | `.start` | createOnboardingRequest | 🟢 |
| `/onboard` step 2 autosave | `onboardingRepo.saveProgress()` | client | direct | `PATCH /onboarding/applications/:id` (no Idem-Key, `.strict()` → 422 on unknown key) | `.saveProgress` | updateOnboardingProfile + `sanitizeApplicantProfile` | 🟢 |
| `/onboard` step 3 upload ×3 | `uploadUrlRepo` → PUT → `addDocument` | client | direct → GCS → direct | `POST …/documents/upload-url` → `PUT` (Google Storage) → `POST …/documents` (Idem-Key) | `.issueDocumentUploadUrl` → `.addDocument` | `ObjectStoragePort` (`EchoObjectStorage` memory / `FirebaseObjectStorage` v4 signed PUT) | 🟢 (shipped `2a9a4b3`) |
| `/onboard` step 4 submit | `onboardingRepo.submit()` | client | direct | `POST …/submit` (Idem-Key) | `.submit` | submitOnboardingRequest (blocks < 3 docs) | 🟢 |
| `/onboard` optional ID format check | `onboardingRepo.verifyDocument()` | client | direct | `POST /onboarding/verify-document` | `.verifyDocument` | `FormatCheckVerificationProvider` — **render "format check passed", never "Verified"** (D-018) | 🟢 |
| `/partner/select-organization` | `orgRepo.list()` | server | direct | `GET /organizations` | `OrganizationService.list…` | `organizations` repo (membership-filtered) | 🟢 → `{ items: OrganizationDto[], pageInfo }` |
| studio shell — permissions/tabs | `useOrgAccess(orgId)` | client | direct | `GET /organizations/:id/access` | resolve `partnerType` + `permissions[]` + `tabVisibility` | membership + role | 🟢 → `partnerAccessDtoSchema` |

### 4.2 Organizations / members / invitations  (Keshvi's `src/lib/org/**` + later specs)

| FE surface | endpoint | method | perm | rate | Status |
|---|---|---|---|---|---|
| org list / picker | `GET /organizations` | GET | `organization.read` | AUTH_READ | 🟢 |
| org detail / settings header | `GET /organizations/:organizationId` | GET | `organization.read` | AUTH_READ | 🟢 (cached) |
| create org (rare — onboarding normally provisions) | `POST /organizations` (Idem-Key, **no `requirePermission`**) | POST | — | STANDARD | 🟢 |
| org settings save | `PATCH /organizations/:organizationId` (If-Match) | PATCH | `organization.update` | STANDARD | 🟢 |
| `/venue/settings` staff list | `GET /organizations/:organizationId/members` | GET | `organization.read` | AUTH_READ | 🟢 |
| add staff | `POST /organizations/:organizationId/members` | POST | `staff.manage` | STANDARD | 🟢 |
| invitations list | `GET /organizations/:organizationId/invitations` | GET | `staff.manage` | AUTH_READ | 🟢 |
| send invite | `POST /organizations/:organizationId/invitations` | POST | `staff.manage` | STANDARD | 🟢 |
| revoke / accept invite | `POST /invitations/:invitationId/{revoke,accept}` | POST | `staff.manage` / — | STANDARD | 🟢 |

### 4.3 Venues  (`/venue/*` studio — LATER spec, not this slice)

`GET/POST /organizations/:organizationId/venues` · `GET/PATCH /venues/:venueId`
(If-Match) · `GET/PATCH /venues/:venueId/profile` (If-Match) ·
`GET /venues/:venueId/calendar` · `GET/PATCH /venues/:venueId/menu` (If-Match) ·
`GET /venues/:venueId/availability` · `GET/POST /venues/:venueId/slot-requests`.
Perms: `venue.read` / `venue.create` / `venue.manage`. **All 🟢 route+service**,
but the `/venue/overview` and `/venue/settings` *screens* want composite
dashboards (`HostOverview`-style) the bare `VenueDto` doesn't provide → 🟡 see §5.

### 4.4 Events + catalog  (`/venue|/host|/promoter events/*` — LATER spec)

Events: `GET/POST /organizations/:organizationId/events` · `GET /events/:eventId` ·
`PATCH /events/:eventId` (If-Match) · `GET /events/:eventId/previews` ·
`POST /events/:eventId/cancel` · `POST /events/:eventId/…` state actions (publish /
pause-sales / resume-sales — **⚠verify exact paths**, the FSM is
`packages/core/src/domain/models/event*.ts`). Perms `event.read/create/update/cancel`.
Catalog: `GET/POST /events/:eventId/{ticket-tiers,promo-codes,table-packages,promoter-assignments}`
+ `POST /promoter-assignments/:assignmentId/end`. Perms `event.read` / `event.update`.
**All 🟢 route+service.** Event-*summary* screens (ticketsSold, checkIns, gross)
→ 🟡 §5.

### 4.5 Analytics · partnerships · promoter connections · referral links

| endpoint | perm | Status |
|---|---|---|
| `GET /organizations/:organizationId/analytics/overview` | `organization.read` | 🟢 → `organizationOverviewDtoSchema` |
| `GET /events/:eventId/analytics` | `event.read` | 🟢 → `eventAnalyticsDtoSchema` |
| `GET /organizations/:organizationId/partnerships` · `POST /partnerships` · resolve | `organization.read` / `venue.manage` | 🟢 |
| `GET /organizations/:organizationId/promoter-connections` · `POST /promoter-connections` · resolve | `organization.read` | 🟢 |
| `GET/POST /events/:eventId/referral-links` · `POST /referral-links/:id/deactivate` | `event.read` / `event.update` | 🟢 |

The partner-dashboard `HostRepository` / `PromoterRepository` interfaces
(`src/lib/partner/contracts.ts`) — `getOrganizations`, `getOverview`, `getEvents`,
`getEvent`, `getEventAnalytics`, `getPartners`, `getFinance`, `getProfile`,
`getLinks`, `discoverEvents`, `createTrackingLink`, `getNetworkProfile` — the
uncommitted WIP (`api-partner-repositories.ts` + `api-partner-decoders.ts`) wires
**only** `getOrganizations` / `getOverview` / `getEvents` to the real gateway;
every other method is still a fixture or a throwing stub. That WIP is not on
`staging`.

### 4.6 Door / scanner / cover-wallet  (`/venue/door` — Phase 5, Track G)

🟢 real: `POST /door/sessions` · `GET /door/sessions/:sessionId` ·
`POST /door/lookup` · `GET /door/check-ins` · `GET /door/check-ins/:checkInId` ·
`POST /door/check-ins/verify` · `POST /door/walk-in` · `POST /door/dine-in` ·
`GET /door/sales` · `GET /tickets/:ticketId/qr` · `POST /door/offline-sync` ·
`GET/POST /cover-wallets` · `GET /cover-wallets/:walletId` ·
`POST /cover-wallets/:walletId/{credit,debit,reconcile,terminate}`.

🟠 honest **501** (Track G): `POST /door/override` · `GET /door/offline-manifest`
(scanner-routes.ts ~372 / ~399) · `GET /door/stats` · `GET /door/stats/ws`
(phase5-routes.ts) · `POST /cover-wallets/:walletId/{freeze,unfreeze}`
(cover-wallet-routes.ts ~301 / ~323). Owners: `/door/override` +
`/door/offline-manifest` = **Shriyash** (Founder Task A2); the rest = **Ayush**
(Founder Task B).

### 4.7 Admin (platform back-office — not partner-dashboard; `admin-console` later)

`GET /admin/onboarding/applications` · `GET /admin/onboarding/applications/:id` ·
`POST /admin/onboarding/applications/:id/approve` · `GET /admin/admins` ·
`POST /admin/admins/:adminId/revoke` · `GET /admin/audit` · `GET /admin/proposals`
· `POST /admin/proposals/:proposalId/provision-admin`. All behind
`AdminAuthorityService` (TIER2/TIER3, dual-control). 🟢.

---

## 5. Gaps — what the partner UI needs that the backend doesn't give it

### 5.1 🔴 Whole slices with NO `/api/v2` surface (BLOCKED — not registered, per chatgpt-plan Stage A)
These partner-dashboard routes have **nothing** behind them:

| FE routes | needs | where it lands |
|---|---|---|
| `/venue/finance`, `/host/finance`, `/promoter/finance` + `…/finance/orders` | orders list, revenue rollup, payout status, ledger | **Phase 6 backend** (`roadmap/phase-06-finance-ledger-payouts.md`) — not started |
| `/venue/events/[id]/(detail)/sales`, `…/finance` | per-event order/revenue detail | checkout/orders slice — BLOCKED |
| `/venue/notifications`, `/host/notifications` | notification feed | **Phase 8** (`phase-08-social-notifications.md`) — not started |
| guest-facing checkout (not partner-dashboard, but the money path) | cart / hold / pay / verify / refund | BLOCKED (`integration-flows/checkout.md` is ASPIRATIONAL) |

**Action:** these screens ship as honest "coming soon" states or are hidden by
`tabVisibility` until the backend slice exists. Do **not** build FE against a
guessed contract (master prompt §27, spec Phase 0 rule).

### 5.2 🟡 Routes exist but the UI wants a read model the bare DTO doesn't carry
`src/lib/partner/contracts.ts` + the fixtures encode composite/derived shapes:
- `HostOverview` / `PromoterOverview` — a single dashboard payload (profile +
  nextEvent + recentOrders + performance + calendar). The gateway has
  `GET /organizations/:id` + `GET …/events` + `GET …/analytics/overview` as
  *separate* reads. → Either the FE repository composes them (3 calls,
  `Promise.all`, one `toUiModel`) **or** the backend adds a
  `GET /organizations/:id/overview` read-model endpoint. **Recommend FE-composes
  for now**; a read-model endpoint is a Phase-6-era optimisation (chatgpt §3 CQRS).
- `PartnerEventSummary.{ticketsSold, capacity, grossPaise, checkIns}`,
  `PartnerOrganizationSummary.{role, verified}`, calendar aggregates — some map
  to `eventAnalyticsDtoSchema` / `partnerAccessDtoSchema`, some don't exist yet.
  Grep `GAP:` in `api-partner-decoders.ts` for the full list; unavailable fields
  render as neutral zero/empty, never invented numbers.

### 5.3 🟠 The six honest-501 door routes — see §4.6. Founder tasks A2 + B.

### 5.4 Deferred backend punch-list (tracked)
- Password reset — Better Auth supports it; no `/auth/*` reset route yet, no
  `/forgot-password` FE route this slice.
- Signed-URL issuing for onboarding docs — **DONE** (`2a9a4b3`).

---

## 6. The auth journey, call by call

```
1. GET /signup                    (proxy.ts: no cookie on a public route → allowed)
2. POST /api/auth/signup          BFF → POST /api/v2/auth/signup
      ← { user, accessToken, expiresAt } + Set-Cookie (session, re-scoped) + c1rcle.csrf
      auth-client.setSession(...)  → in-memory token
3. redirect /onboard              (proxy.ts: session cookie present → allowed)
4. GET  /api/v2/onboarding/me     Bearer → { request: null }
5. POST /api/v2/onboarding/applications         Bearer + Idempotency-Key
6. PATCH /api/v2/onboarding/applications/:id     Bearer   (autosave, ×N)
7. POST /api/v2/onboarding/applications/:id/documents/upload-url   ×3
   PUT  <google-storage-signed-url>                                ×3   (not the gateway)
   POST /api/v2/onboarding/applications/:id/documents              ×3   Bearer + Idem-Key
8. POST /api/v2/onboarding/applications/:id/submit                 Bearer + Idem-Key
9.  … admin approves out-of-band (POST /api/v2/admin/onboarding/applications/:id/approve)
10. poll GET /api/v2/onboarding/me  → status 'approved', provisionedOrganizationId set
11. GET /api/v2/organizations       → 1 org → setActiveOrg(id) (c1rcle.active-org cookie)
12. GET /api/v2/organizations/:id/access  → partnerType 'venue' → redirect /venue/overview
13. (token near expiry / focus / 401)  POST /api/auth/refresh  (BFF, CSRF) → new token
```

On a hard 401 mid-session: `@c1rcle/api-client` calls `reauth()` →
`auth-client.refresh()` → if it returns `true`, the original request replays once;
if `false`, `onUnauthorized()` clears the session and routes to `/login`.

---

## 7. Modular-monolith conformance (master prompt §5 / §6)

| Rule | Backend | Frontend |
|---|---|---|
| Strong module boundaries | `packages/core` domains: onboarding, organization, venue, event, catalog, analytics, partnership, promoter-connection, referral-link, scanner, door, cover-wallet, admin-authority. Each = model + service + port. | `packages/*` single-owner: `@c1rcle/api-client` (network), `@c1rcle/auth` (session), `@c1rcle/config` (env), `@c1rcle/contracts` (wire). lint + `check-boundaries` enforced. |
| Thin routes | validate → auth → policy → **one** service call → serialize. No `.collection()` in route files (guardrail). | Server Component: one gateway read → typed props. Client island: interaction → one repository method. |
| Dependency inversion | storage behind `domain/ports/repositories.ts`; memory + firestore adapters; service layer driver-agnostic. | data access only through `src/lib/<domain>/` repositories; `toUiModel()` is the DTO→UI boundary. |
| Config isolation | `packages/core` never reads `process.env`; gateway `config/index.ts` is the sole owner, injects `CoreConfig`. | env only via `@c1rcle/config` `getClientEnv()`; no `process.env` outside it (test configs excepted). |
| Domain events / loose coupling | outbox + `InProcessEventBus`; audit + projection consumers; services don't call each other's internals. | n/a (client). |
| FSM for lifecycles | event lifecycle, scan-ledger status, onboarding status, cover-wallet status — explicit transition functions in `domain/models/`. | client mirrors status, never computes transitions. |
| Optimistic locking | `version` on the 5 mutable aggregates; `If-Match` → `409` on stale. | `version` threaded from the last read DTO into the next write. |

---

## 8. Documentation reconciliation

| Claim | Where | Reality / contradicted by | Resolution |
|---|---|---|---|
| Auth = "Firebase ID-token verification" | frozen `V2-Partners_Frontend` manifest, older `Middleware_documentation` | Live: Better Auth cookie + bearer session token (D-001, `plugins/auth.ts`) | **Better Auth.** Frozen manifest superseded (C-4). |
| Session routes `/api/v2/session`, `/session/sync`, `/session/logout` — DEFERRED | frozen manifest | Live + tested: `/api/v2/auth/{signup,login,refresh,logout}` + `GET /auth/session` | **Use `/auth/*`.** (C-1) |
| Success envelope `{ data, meta }` | frozen manifest | Live: bare DTO / `{ items, pageInfo }` | **Bare DTO.** (C-2, D-004) |
| Only 3 ACTIVE routes registered | `API_V2_ROUTE_MANIFEST.md` doc | ~70 routes registered (see §4) — `apps/api-gateway/src/routes/v2/route-manifest.ts` is truth | **Code manifest is truth.** Doc stale. (C-9) |
| API Gateway = Kong; DB = PostgreSQL; store = Redux Toolkit / RTK Query; auth = JWT + refresh | `chatgpt_response.md` | Live: Fastify (in-process, not Kong); Firestore (not Postgres); FE has **no Redux** — hand-rolled `useSyncExternalStore` (spec §3.1, "no zustand" house style); Better Auth session token, not a minted JWT | `chatgpt_response` is **generic architecture advice, pre-dates the stack decisions**. Binding docs: `decisions.md` + the FE spec. Keep the *principles* (modular monolith, thin routes, contract-first, outbox, FSM, config isolation, idempotency, optimistic locking) — all honoured. |
| 9 rate-limit classes | frozen manifest | Live: 4 classes (`plugins/` rate-limit) | **4 classes.** (C-6) |
| "one key per user intent, not per network retry" | RM:407 / PLAN:293 | earlier partial FE wiring minted a UUID per HTTP call | **Key at the action call site**, stable across retries. (C-8) |
| CSRF is the gateway's job | — | gateway relies on Bearer + CORS-credentials + SameSite; prod cross-domain "needs revisit" (D-001) | **A thin Next BFF owns cookie/CSRF** (§1, §8); also fixes the prod cross-domain cookie gap. (C-7) |
| `Dream Architecture Implementation Plan.md` / `MASTER_LAUNCH_IMPLEMENTATION_PLAN.md` | `docs/reference/` | broad plans; where they name pre-decision tech or scope, `decisions.md` + roadmap win | Reference only. Cross-check against `decisions.md` before citing. |
| `integration-flows/checkout.md` | `docs/` | describes endpoints that are **not registered** | Marked ASPIRATIONAL — do not build against it. |
| `AGENTS.md` (Circle1 root) | — | describes the old single monorepo | **Ignore** (master prompt §4). |

**Authoritative set, in order:** (1) master prompt (process + non-negotiables) →
(2) `C1RCLE-BACKEND/docs/architecture/decisions.md` → (3) live code
(`route-manifest.ts`, `packages/contracts/src`, `packages/core`) → (4) the
frontend design spec `specs/2026-08-27-…` → (5) `C1RCLE-BACKEND/docs/api-contracts/*`
(corrected 2026-08-29) → (6) roadmap phase docs → everything else is reference.

---

## 9. Open items to verify (this doc was built partly from session memory)
- [ ] Exact request/response schema per partner/* route — cross-check `API_ROUTE_CATALOG.generated.md` + `packages/contracts/src/contracts/{organization,event,partner}.ts`.
- [ ] Event state-action route paths (publish / pause-sales / resume-sales / duplicate) — read `partner/events.ts` fully.
- [ ] Whether `GET /organizations` is actually membership-filtered on the firestore driver (the memory driver is not).
- [ ] The `cached(<policy>)` policies per route and their TTLs.
- [ ] `admin-console` + `guest-portal` surface maps (this doc is partner-dashboard only).
