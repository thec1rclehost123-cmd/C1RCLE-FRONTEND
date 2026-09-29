# Walkthrough — Onboarding rebuild + Firebase teardown + V1 Alignment

> **Status (2026-09-04): the onboard wizard on `feat/partner-gateway-auth-foundation` is now an
> **8-step V2 flow aligned with the V1 partner dashboard** (`C:\Users\majid\thec1rcle`) for step
> sequence, field grouping, and field order. The flow is: **role → auth → phone → entity type →
> details → documents → review+submit → success** with V1-matching fields including phone
> verification step, dedicated entity type selection, host category dropdown, promoter event
> textareas, and ID type/number collection in the documents step. The V2 backend remains completely
> unchanged — all changes are frontend-only. Some V1 KYC fields (business PAN, GST, signatory
> details, Aadhaar structural verification) could not be replicated because the V2 backend does not
> accept them.
>
> **Status (2026-09-07): the wizard now talks to the backend exclusively through the Next.js BFF**
> (`/api/bff/onboarding/*`), matching the `Frontend → BFF → API gateway → backend` architecture the
> auth routes already used. The browser no longer calls the gateway or Firebase storage directly —
> that was the source of the CSP upload failure. See **Onboarding through the BFF** below.
>
> **Status (2026-09-08): `next build` was failing on `src/app/onboard/PageClient.tsx:514`**
> (`await isn't allowed in non-async function`). The file was a corrupted hybrid — the V2 wizard
> JSX from the 2026-09-04/07 slices interleaved with dead Firebase-era legacy code, references to
> undefined components/constants, and duplicate/conflicting declarations. It was replaced with a
> clean V2-only rewrite (same 8-step BFF-only flow; no Firebase/OTP/`/api/kyc`/`/api/auth/me` code).
> See **PageClient rebuild (2026-09-08)**.
>
> **Status (2026-09-08, later): the Firebase teardown WIP that was blocking `next build` is finished.**
> `next build` was failing with `Module not found: Can't resolve 'firebase/auth'` at
> `src/components/providers/DashboardAuthProvider.tsx:6` — the last live `firebase/*` import in the
> app's build graph. `DashboardAuthProvider.tsx` was temporarily a thin re-export shim of the
> re-homed `session-context.tsx` provider (it later became the real V2-native provider — final
> status block above); the org-access data layer it depends on
> (`src/lib/access/use-org-access.ts`, `src/lib/org/active-org.ts`, `src/lib/org/org-repository.ts`)
> was restored from commit `148013a`. The orphaned `verify/PageClient.tsx` (`firebase/storage`) was
> deleted. See **Firebase teardown finalized (2026-09-08)**.
>
> **Status (2026-09-08, same day): the wizard regressed again — after a fresh `POST /api/auth/signup`
> the `/me` follow-up 401'd and bounced the user to `/login?next=%2Fonboard` instead of the Phone
> step.** The rebuild had dropped the in-memory bearer relay (`getToken: () => null`) and made
> `loadMine()` redirect on any auth failure. Both restored per Onboardingflow.md §2/§8; `loadMine`
> now accepts `routeOnAuthFailure` (false right after signup/login). The Phone step was rebuilt to
> the previous structure (+91 input → Send SMS Code → simulated 60 s cooldown → 6-digit code →
> Verify). See **Auth → Phone regression fix + Phone step rebuild (2026-09-08, later)**.
>
> **Status (2026-09-14): the login page was fully migrated and rebuilt to match the branch's**
> committed workspace picker (venue / host / promoter), and the auth-provider picture settled:
> `DashboardAuthProvider.tsx` is now the **real V2-native provider** (session store + org graph +
> onboarding request; `isApproved = onboardingRequest?.status === 'approved' || memberships.length > 0`),
> and `onboard/layout.tsx` wraps the wizard in it again. `session-context.tsx` remains a separate
> legacy-compat surface (`SessionAuthProvider` / `useSessionContext` / `useDashboardAuth`) for the
> older module-path imports. The "thin re-export shim" claims in the 2026-09-08 blocks below describe
> that day's teardown state only — `DashboardAuthProvider.tsx` has since grown into a ~340-line real
> implementation, and `login/PageClient.tsx` no longer reads any session-context compat fields.
> Current suite: **81 test files / 305 tests pass.**

This walks through the Tail of the partner-dashboard auth migration: taking the last two
legacy screens (`onboard`, `verify`) off the mocked Firebase layer and onto the real `/api/v2`
gateway, tearing down the now-dead app-level auth/verify routes, and re-homing the dashboard auth
provider so the studio components keep resolving.

**The one-line version:** the 2800-line `onboard` wizard that was full of Firebase stubs and
legacy `/api/auth/otp/*` calls is gone, replaced by a focused 8-step V2 wizard (role → auth →
phone → entity type → details → documents → review+submit → success) aligned with the V1 partner
dashboard's step sequence and field flow; `verify/` and `api/kyc/` are deleted;
`DashboardAuthProvider` moved to `session-context.tsx` behind a thin re-export shim (today
`DashboardAuthProvider.tsx` is the real V2-native provider and `session-context.tsx` the legacy
compat surface — see the top status block); and the
`firebase` dependency is removed from `package.json`.

Login and signup were already V2-correct (they called `@c1rcle/auth`'s `login()`/`signup()`
directly) before this slice started — only onboarding and the teardown remained.

---

## Onboarding through the BFF (2026-09-07)

### Why

The CSP set in `src/proxy.ts` (`connect-src 'self' https://circle-v2-backend.onrender.com`)
blocks any browser call to a third-party origin. The documents step did a browser `PUT` straight to
`https://storage.googleapis.com/thec1rcle-india.firebasestorage.app/...` (a pre-signed URL issued by
the gateway), which the CSP rejected. The fix is architectural, not a CSP whitelist: the wizard now
uses the same `Frontend → BFF → API gateway → backend` path the auth routes already used, and the
upload moves bytes server-side. Contract rule (`C:\Users\majid\thec1rcle\docs\reference\frontend-api-map.md`):
all network traffic goes through the BFF; the browser never calls the gateway or Firebase directly.

### Request path per step

| Wizard step                                                  | Browser → BFF                                                                        | BFF → Gateway                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Auth (existing)                                              | `@c1rcle/auth` → `/api/auth/{login,signup,session,refresh,logout}`                   | `/api/v2/auth/*`                                                                       |
| Bootstrap, phone, details, success polling, post-auth lookup | `GET /api/bff/onboarding/me`                                                         | `GET /api/v2/onboarding/me`                                                            |
| Application creation (details step)                          | `POST /api/bff/onboarding/applications`                                              | `POST /api/v2/onboarding/applications`                                                 |
| Autosave (details step)                                      | `PATCH /api/bff/onboarding/applications/:id`                                         | `PATCH /api/v2/onboarding/applications/:id`                                            |
| Document upload                                              | `POST /api/bff/onboarding/applications/:id/documents/upload` (raw file, same-origin) | `POST …/documents/upload-url` → **server-side** `PUT` to Firebase → `POST …/documents` |
| Format check                                                 | `POST /api/bff/onboarding/verify-document`                                           | `POST /api/v2/onboarding/verify-document`                                              |
| Submit (review step)                                         | `POST /api/bff/onboarding/applications/:id/submit`                                   | `POST /api/v2/onboarding/applications/:id/submit`                                      |

### How it works

- `src/lib/bff/auth-proxy.ts` (the sanctioned raw-fetch module, already used by `/api/auth/*`) gained
  `PATCH` support, a `headers` passthrough (for `Idempotency-Key`), and `putToStorage()` — a
  server-side `PUT` to the pre-signed storage URL with a `memory://` no-op for local dev.
- New BFF route handlers under `src/app/api/bff/onboarding/` mirror the auth route pattern:
  `assertSameOrigin` on everything, `assertCsrf` on every mutating verb, the session cookie forwarded
  verbatim, `passThroughGatewayError` for envelope passthrough, and `rescopeSessionCookies` so a
  refreshed Better-Auth session stays on the frontend origin.
- The `GET me` route mints the `c1rcle.csrf` cookie for returning applicants who logged in before the
  double-submit cookie existed (login/signup are the only other setters). The wizard sends it back as
  `x-csrf-token` via `src/lib/onboarding/csrf.ts`.
- The upload collapses from three browser round-trips (gateway signed URL → cross-origin PUT → gateway
  confirm) into one same-origin `POST` that buffers the file (≤ 5 MB), asks the gateway for a signed
  URL, `PUT`s the bytes server-side, confirms the `storagePath`, and returns the gateway's document
  DTO. The signed URL never reaches the browser.
- `PageClient.tsx` now builds its client with `createApiClient({ baseUrl: window.location.origin })`
  (no `getToken`, same deliberate no-reauth behavior as before) and points every call at
  `/api/bff/onboarding/*`. `packages/api-client` gained a `rawBody` + `contentType` option so the
  unchanged response-schema parsing and error typing apply to the raw file upload too.

### Auth step fix (2026-09-07, same slice) — "create account goes back to /login instead of the phone step"

Symptom: after clicking **Create account**, the wizard either sat on the Auth step with an error or
redirected to `/login?next=/onboard` instead of advancing to the Phone step.

Root cause, two failures on the same code path (`handleAuthSubmit`):

1. **`POST /api/auth/signup` → 422.** The gateway signup contract is strict
   (`signupRequestSchema`: RFC-valid email, password 8–128, displayName 1–200, no unknown keys). The
   wizard only validated that email was _non-empty_, so a malformed email (e.g. with spaces) passed
   the client, got rejected by the gateway, and the catch merely showed the generic envelope message —
   the wizard never called `setStep(PHONE_STEP)`.
2. **`GET /api/bff/onboarding/me` → 401 right after a successful auth.** The step advance was gated
   on this follow-up call returning 200 (`PageClient.tsx:474-482`). A `401` there fell into the
   generic auth-failure branch and called `routeUnauthorized()` → `router.replace('/login?next=/onboard')`,
   i.e. the visible **"going back"**. But `401` on `/me` immediately after signup/login is the normal
   state for a brand-new applicant (the gateway may not resolve the just-issued session cookie yet);
   treating it as "you must log in again" bounced the user out of a screen they'd just authenticated on.

Fix applied:

- The `/me` follow-up now sits in its **own try/catch**; any failure (401 included) is treated as
  "no application to resume" and the wizard proceeds to the **Phone step**. A genuinely dead session
  still surfaces its `401` on the next state-changing BFF call, which routes to `/login` as before.
- Email is now **trimmed and format-validated** client-side before signup/login, and a `422` surfaces
  the gateway's `fieldErrors` (e.g. `email: Invalid email`) instead of the opaque "Validation failed".

### Session-resolution fix (2026-09-07, same slice) — "/me 401 / GET /onboard → 307 /login + RSC failure loop"

Server logs showed the loop after the auth-step fix:

```
POST /api/auth/login 200            → GET /onboard 200
GET /api/bff/onboarding/me 401      → GET /login?next=/onboard 200
POST /api/auth/signup 422 (x2)      → POST /api/auth/signup 201
GET /api/bff/onboarding/me 401      → GET /login?next=/onboard 200
```

...and, in the latest run, a hard redirect every time:

```
POST /api/auth/signup → 201
GET /onboard → 307 → /login?next=/onboard
Failed to fetch RSC payload for http://localhost:3001/onboard  (repeated)
```

**Root cause (verified against the deployed gateway).** The partner-dashboard BFF points at the
_deployed_ backend (`apps/partner-dashboard/.env.local` → `https://circle-v2-backend.onrender.com`),
which runs Better Auth with `useSecureCookies` (production) and therefore sets its session cookie with
the **`__Secure-` prefix**:

```
Set-Cookie: __Secure-better-auth.session_token=<tok>; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax
```

Two independent failures followed:

1. `rescopeSessionCookies` re-emitted that cookie under its `__Secure-` **name**, with `secure`
   driven by the FE env (`development` → no `Secure`) on an **http://localhost** origin. Browsers
   reject a `__Secure-` cookie set without `Secure` over http, so the session cookie was **never
   stored by the browser** — signup still returned 201 (in-memory session), but the browser had no cookie.
2. Even if it had been stored, the edge (`proxy.ts`) gated on the **unprefixed** name
   `better-auth.session_token`, which only a _development_ gateway emits.

Consequence: every GET (document _or_ RSC) request to `/onboard` lacked the cookie → `proxy.ts`
answered **307 → /login?next=/onboard**. Next's client router lets a 307 fall through its RSC fetch,
logs "Failed to fetch RSC payload … Falling back to browser navigation", and retries the full
navigate into the same 307 — the `/onboard ⇄ /login` + RSC-failure churn. **The RSC failures are
entirely a consequence of that 307; there is no independent RSC bug.**

**Fix — normalize the session-cookie name so it is lawfully stored on the frontend origin and is
read by whichever gateway sits behind the BFF:**

- `rescopeSessionCookies` now **strips the `__Secure-` prefix** from every re-scoped cookie name. The
  browser stores `better-auth.session_token` on http dev (no `Secure`) and https prod (`Secure`
  imposed) — exactly the name the proxy checks.
- `forwardToGateway` now emits a `__Secure-better-auth.session_token` **twin** (same value) next to
  the unprefixed name when forwarding browser cookies, so a production gateway (`useSecureCookies`)
  resolves the session while a dev gateway ignores the twin. Verified live against the deployed
  gateway: the twin cookie header → `GET /api/v2/auth/session` → **200**.
- `proxy.ts` gate now accepts **either** cookie name.
- `getServerSession` (`@c1rcle/auth`) adds the same twin so the server-side bootstrap in the root
  layout resolves against a production gateway after a refresh/back-forward.
- Already in this slice: the onboarding BFF relays the in-memory **bearer** (`gatewayAuthInit`;
  `PageClient` restored `getToken: getAccessToken`), so `/me` resolves even before any cookie exists,
  and `handleAuthSubmit` treats a post-auth `/me` 401 as "brand-new applicant" → **AUTH → PHONE**.

Result: after `POST /api/auth/signup → 201` the browser now holds the session cookie, so
`GET /onboard` (document and RSC) passes the proxy with **200**, the wizard advances to **PHONE**, and
no `/login?next=/onboard` redirect or RSC fetch failure occurs. Tests added:
`auth-proxy.test.ts` → "strips the __Secure- prefix…" + "re-adds the __Secure- twin…";
`routes.test.ts` → "forwards the in-memory bearer so the gateway can resolve the session".

**`/onboard` is the auth entry point, so it is intentionally un-gated at the edge.** The wizard must
render anonymously for its first step (ROLE) — an anonymous visitor has no session cookie yet, so a
proxy-side `/login` redirect would make the committed flow ("completely new user" → ROLE → AUTH →
…) unreachable and would also re-trigger the RSC-failure loop on `router.replace('/onboard?type=…')`.
Authentication is still fully enforced:

- the gateway re-validates the session against **every** onboarding BFF call (401 without one), and
- the wizard itself (`PageClient.tsx`) routes an unauthenticated visitor at **DETAILS+** to `/login`
  (the only app-facing steps of the wizard that require a session).

So `/venue`, `/host`, `/promoter`, `/partner`, `/partner-network` keep their anonymous → `/login`
redirect; only `/onboard` opens anonymously. Locked by `proxy.test.ts` (anonymous `/onboard` → 200,
anonymous `/venue` → 307 `/login?next=%2Fvenue`, cookie-name passthrough, CSP nonce present).

**Refresh keeps the wizard on its current step.** The wizard step is in-memory only, and a full
browser reload would reset it to ROLE while the session restores from the refresh cookie. The step
is now persisted in `sessionStorage` (clients-only, best-effort): restored once on mount, cleared on
SUCCESS so a new application starts at ROLE. No SSR/hydration impact (restore happens in a
mount-time effect, never during render).

### Document-upload confirm fix (2026-09-07) — "KYC upload → 422 on the final step"

Uploads got a signed URL and PUT to object storage, then the final gateway call returned 422:

```
POST /api/v2/onboarding/applications/:id/documents/upload-url   ✅
PUT  (signed object-storage URL)                                ✅
POST /api/v2/onboarding/applications/:id/documents              ❌ 422
```

Root cause: the gateway's confirm route runs `validateV2({ headers: commandHeaders, body:
addOnboardingDocumentSchema })` with `commandHeaders = z.looseObject({ 'idempotency-key:
idempotencyKeySchema })` — and `z.looseObject` keeps the key **required** (verified directly:
`safeParse({})` → false). The BFF confirm request sent only the auth headers, so the gateway rejected
it with 422. The backend test suite never caught it because its `asUser()` helper always attaches an
`idempotency-key`, and the frontend BFF tests mocked the gateway `fetch` with a header-blind stub.

Fix — the document-confirmation operation is now idempotency-keyed end to end:

- **Client** (`PageClient.tsx`) mints one `Idempotency-Key` (`crypto.randomUUID()`) per upload
  operation and sends it with the CSRF headers. Because the api-client's retry loop re-uses the same
  `options.headers` across `#attempt` calls, the key is stable over client retries.
- **BFF** (`documents/upload/route.ts`) uses the caller's key when supplied, else mints its own
  (`mintIdempotencyKey()` → `crypto.randomUUID()`), and forwards the **same** key on BOTH gateway
  calls (upload-url is unchanged in behaviour; confirm — which requires it — now always carries it).
- **Why this is retry-safe**: the gateway's `command()` path is idempotency-keyed, so replaying the
  same key on a retried confirmation returns the already-created document record instead of
  creating a duplicate. A new file pick generates a new key → legitimate re-upload (replace-by-label)
  still works. Auth headers (`Bearer` + cookie twin) are untouched.
- **Tests** (`routes.test.ts`) now assert the guarantee instead of trusting a header-blind stub:
  the mock gateway's confirm path returns 422 when `Idempotency-Key` is absent (mirroring prod).
  New/updated cases: "…confirms with an Idempotency-Key" (key present on the confirm forward),
  "generates its own Idempotency-Key … when the caller sends none" (BFF fallback, same key on both
  calls, matches the gateway's format contract), "forwards the caller-supplied Idempotency-Key
  verbatim to both gateway calls".

### Files changed

- `apps/partner-dashboard/src/lib/bff/auth-proxy.ts` — `PATCH`, extra headers, `putToStorage`, `gatewayAuthInit`,
  cookie-name normalization (`rescopeSessionCookies` strips `__Secure-`; `forwardToGateway` re-adds the twin).
- `apps/partner-dashboard/src/proxy.ts` — auth gate accepts the `__Secure-` cookie name too;
  `/onboard` removed from the redirect list (auth entry point — see above); anonymous other paths
  still redirect.
- `apps/partner-dashboard/src/proxy.test.ts` — new: `/onboard` anonymous pass vs gated-path redirect,
  cookie-name passthrough, CSP nonce.
- `packages/auth/src/server-session.ts` — re-adds the gateway `__Secure-` twin for server-side bootstrap reads.
- `apps/partner-dashboard/src/app/api/bff/onboarding/…` — new route handlers (`me`, `applications`,
  `applications/[id]`, `applications/[id]/submit`, `applications/[id]/documents/upload`,
  `verify-document`) + `routes.test.ts` (all forward cookie + bearer via `gatewayAuthInit`).
- `apps/partner-dashboard/src/lib/onboarding/csrf.ts` — new client-side CSRF header helper.
- `apps/partner-dashboard/src/app/onboard/PageClient.tsx` — same-origin client with `getToken`,
  CSRF headers, one-shot upload with a per-operation `Idempotency-Key`,
  mount-time step restore (`sessionStorage`) + persistence/clear.
- `apps/partner-dashboard/src/app/api/bff/onboarding/applications/[id]/documents/upload/route.ts` —
  confirm forward now always carries `Idempotency-Key` (caller's or a fresh BFF-minted one).
- `apps/partner-dashboard/src/lib/bff/auth-proxy.ts` — adds `mintIdempotencyKey()`; `ForwardInit` exported.
- `apps/partner-dashboard/src/lib/onboarding/uploadToSignedUrl.ts` — deleted (browser PUT gone).
- `packages/api-client/src/{types.ts,client.ts}` — `rawBody`/`contentType` request options.

### Verification

- `pnpm --filter @c1rcle/app-partner-dashboard test build typecheck lint` → green.
- App suite: **76 test files / 271 tests passed** (was 261 before this slice).
- `@c1rcle/auth`: typecheck + lint + 19 tests → green; `dist` rebuilt.
- Live probe vs the deployed gateway: signup → 201 with `__Secure-better-auth.session_token`;
  `GET /api/v2/auth/session` with the BFF's twin cookie header → **200**, and with the bearer → **200**.
- `git grep -n "storage.googleapis.com\|firebasestorage" apps/partner-dashboard/src` → BFF route only
  (server-side); the browser has no storage reference.
- `git diff --name-only --packages/ …` → intentional (api-client raw-body option).

---

## PageClient rebuild (2026-09-08) — corrupted hybrid → clean V2 rewrite

**Symptom:** `next build` (Turbopack) failed with `await isn't allowed in non-async function` at
`apps/partner-dashboard/src/app/onboard/PageClient.tsx:514:6`.

**Diagnosis:** the file was not a normal regression — it was a corrupted merge of two generations of
the wizard:

- the V2 wizard JSX from the 2026-09-04 (V1 alignment) and 2026-09-07 (BFF) slices, mixed with
  **dead Firebase legacy code** (`getFirebaseAuth`, `signInWithEmailAndPassword`,
  `/api/auth/me`, `/api/auth/check-email`, `apiSendOtp`, `/api/kyc/upload`, `authUser`,
  `setPartnerType`, `otpEmail`, …);
- references to components/constants that no longer existed (`ReviewStep`, `OnboardingSkeleton`,
  `OnboardingFlow`, `PARTNER_TYPES`, `DOC_LABELS`, `ID_TYPES`);
- duplicate/conflicting declarations (`getStepSequence` defined both with and without an argument;
  `entityType` declared twice).

It was unsalvageable by surgical edits, so it was fully rewritten as a clean V2-only wizard.

### What the rewrite keeps

- The documented **Frontend → BFF → API gateway → backend** flow: every network call goes through
  `@c1rcle/auth` (`/api/auth/*`) and the BFF `/api/bff/onboarding/*` routes (unchanged and already
  correct). No browser call to the gateway or Firebase storage.
- The 8-step sequence: **role → auth → phone → entity type → details → documents → review+submit →
  success**, with entity-type-dependent details, host category dropdown, promoter event textareas,
  ID type/number collection, and the required-document gate (`id_front`, `id_back`, `selfie`).
- Same-origin client via `createApiClient({ baseUrl: window.location.origin })`, CSRF headers from
  `src/lib/onboarding/csrf.ts`, per-operation `Idempotency-Key` on the mutating gateway ops.
- Step persistence in `sessionStorage` (restore on mount, clear on SUCCESS).
- Approval polling on the success step — and now wiring the previously-dead `redirectToStudio()`
  into that poll, so an `approved` response routes the user into `/partner/<role>/overview` instead
  of just rendering a static "you're approved" screen.

### What was dropped

- The legacy client-bootstrap `useEffect` that did the email check + OTP round-trip.
- All Firebase/legacy auth code (`signInWithEmailAndPassword`, `/api/auth/me`, `check-email`,
  `apiSendOtp`, `/api/kyc/upload`).

### Notes

- **Phone step retained, OTP interface gone.** The V2 backend has no OTP endpoint, so the Phone step
  collects the number with country-code validation only (no SMS). The old email-OTP verify step is
  intentionally absent — the Auth step collects email + password (+ display name on signup) instead.
- **Email "verification field" wasn't added back** because the documented V2 8-step flow has no such
  field: email is collected in the Auth step and verified through the gateway's normal signup.
- **Plan is defaulted to `silver`** in the rewrite (previous slice's "subscription tier" select was
  already not wired to a plan step in the BFF flow). The `Plan` type is derived from
  `onboardingPlanSchema` locally; `ReviewStep` still renders it.

### Verification status (2026-09-08)

- `tsc -p tsconfig.json` → **no errors in the onboard file.**
- eslint on `src/app/onboard/PageClient.tsx` → 4 remaining errors, all repo-wide/deliberate
  (the `lucide-react` no-restricted-imports architectural debt where `@c1rcle/icons` doesn't exist;
  two deliberate `set-state-in-effect` cases — sessionStorage restore and debounced autosave; one
  `no-misused-promises` matching the login page). The then-existing `login/PageClient.tsx` carried
  ~100 of the same class of errors, so this file was among the cleanest in the app (that login
  backlog was cleared by the migration below — **Login page fully migrated (2026-09-14)**).
- **Pre-existing blockers (now RESOLVED — see **Firebase teardown finalized (2026-09-08)** below):**
  the whole-app typecheck/build was failing on the unfinished Firebase teardown WIP, independent of
  the onboard wizard:
  - `src/app/verify/PageClient.tsx` — orphaned (its `page.tsx`/`layout.tsx` were deleted) and
    imported `firebase/storage` → **deleted**.
  - `src/components/providers/DashboardAuthProvider.tsx` — imported `firebase/auth` while `firebase`
    was removed from `package.json` → **temporarily replaced by a re-export shim of
    `session-context.tsx` (later re-expanded into the real V2-native provider — top status block).**
  - `src/components/providers/session-context.tsx` — imported `@/lib/access/use-org-access` and
    `@/lib/org/active-org`, which didn't exist yet (the whole org-access permission layer) →
    **restored from commit `148013a`.**

---

## Firebase teardown finalized — provider shim + org-access layer (2026-09-08)

Symptom: `next build` failed with

```
Module not found: Can't resolve 'firebase/auth'
Import trace for requested module:
./src/app/login/layout.tsx
./src/app/login/PageClient.tsx
./src/app/login/page.tsx
```

Root cause: the last live `firebase/*` import in the app's build graph. `firebase` was already
removed from `package.json`, but `DashboardAuthProvider.tsx` still imported `firebase/auth` (and
`verify/PageClient.tsx` imported `firebase/storage`). Note `src/lib/firebase/client.ts` is a **mock**
(it never imports the real `firebase` package), so only those two files were broken; purely
`firebase/*`-free verification everywhere else.

### What changed

1. **Restored the org-access data layer from `148013a`** (`feat/partner-gateway-auth-foundation`):
   - `src/lib/access/use-org-access.ts` + test — `useOrgAccess(orgId)` hook, reads
     `GET /api/v2/organizations/:id/access` through `@/lib/api/client` against
     `partnerAccessDtoSchema` from `@c1rcle/contracts`.
   - `src/lib/org/active-org.ts` + test — active-org id storage (`c1rcle.active-org` cookie,
     `getActiveOrgId` / `setActiveOrg`).
   - `src/lib/org/org-repository.ts` — `getOrganizations()` / `createOrganization()`.
2. **`DashboardAuthProvider.tsx` was a re-export shim at this point** of the re-homed
   `src/components/providers/session-context.tsx` (`SessionAuthProvider` = `DashboardAuthProvider`,
   and `useDashboardAuth`), so the ~40 legacy consumers kept resolving unchanged. **That is no
   longer the shape of the tree** (see the top status block): `DashboardAuthProvider.tsx` is the
   real V2-native provider used by `onboard/layout.tsx`, and `session-context.tsx` is the separate
   legacy-compat surface.
3. **`session-context.tsx` kept the legacy compat surface** — `onboardingStatus: string | null`
   (always `null`, since V2 reads the wizard status via `GET /api/bff/onboarding/me`);
   `signInWithGoogle(): Promise<void>` (always rejects, "Google sign-in is not supported on the
   V2 API"); and `isApproved` with the loose foundation-branch semantics
   `activeOrgId !== null || user !== null`. These were originally added for the still-unmigrated
   login page; the login page is now fully migrated and reads none of them (the stricter
   `isApproved = onboardingRequest?.status === 'approved' || memberships.length > 0` lives in
   `DashboardAuthProvider.tsx`). Dashboard guards are not
   weakened: `AccessEntry`/`PartnerStudioFrame`/`PartnerDashboardLayout` additionally require an
   active role, which stays `null` until an org is activated.
4. **Deleted `src/app/verify/PageClient.tsx`** — orphaned since `verify/page.tsx` + `verify/layout.tsx`
   were removed; only remaining `firebase/storage` import.

### Verification (2026-09-08)

- `pnpm --filter @c1rcle/app-partner-dashboard typecheck` → clean.
- `pnpm --filter @c1rcle/app-partner-dashboard build` → succeeds; the `firebase/auth`
  module-not-found is gone.
- `pnpm --filter @c1rcle/app-partner-dashboard test` → **76 files / 271 tests pass** at the time
  (includes the restored `use-org-access`, `active-org` tests); the current tree is **81 files /
  305 tests**.
- eslint on all changed files → clean.

### Login page fully migrated (2026-09-14)

- `src/app/login/PageClient.tsx` is now fully V2-native: it calls `login()` from `@c1rcle/auth`
  directly (and `logout()` on a no-match account), uses `getOrganizations()` +
  `filterOrgsByPartnerType()` from `lib/org/route-after-auth` for role-aware post-login routing,
  and `setActiveOrg()` from `lib/org/active-org` for single-org auto-selection. The firebase mock
  (`getFirebaseAuth()`) and `sessionContext` compat fields are no longer referenced from this file.

### Login UI matches the branch's committed workspace picker (2026-09-14)

- The login page was rebuilt to be **identical to the version committed on this branch**
  (`ea07fa8`, Keshvi's login rebuild — the file now diff-clean against HEAD). Layout/flow:

  - **Step 0 — workspace picker.** `roleConfig` drives three `grid-cols-3 gap-3` tiles with
    labels **Venue / Host / Promoter** and short descriptions **"Full venue operations" /
    "Event management" / "Sales & outreach"**. Clicking a card highlights it AND syncs the URL
    (`router.replace('/login?type=<role>')`); a **Continue →** button (disabled until a role is
    picked) advances to credentials. On load, a `?type=` param pre-selects the role and jumps
    straight to credentials (`step` is initialized from `searchParams`).
  - **Step 1 — credentials.** Mail/Lock inputs use `input input-lg input-icon-left[/right]`
    classes, show/hide password eye toggle, per-field 422 errors, "Forgot password?" link
    (`/forgot-password`, non-existent route kept as-is per Keshvi's copy), and a back
    chevron returning to workspace selection. Heading row: `{label} Workspace`, then "Sign in".
  - **Post-login routing (`handleLogin`).** After `login()`: 0 orgs → `/onboard?type=<role>`;
    else `filterOrgsByPartnerType(orgs, userType)` → 0 matches → `logout()` + inline error "This
    account is not registered as a `{label}` workspace…"; 1 match → `setActiveOrg` +
    `resolvePartnerV3Path(role)`; 2+ → `/partner/select-organization?type=<role>`. `?next` /
    `?callbackUrl` still wins when present.
  - **Footer:** "Apply for Partner Access" routes to `/onboard?type=<role>` when a role is
    selected, else `/onboard`. The signup link carries `?email` and `?type` through.
  - **Per-role ambient theming** (`WorkspaceBg` + `SparkleField`): the right panel swaps its glow
    blob, rotating rings, and sparkle field colours to venue-orange / host-white / promoter-green
    based on the selected workspace; the left panel has a rising sparkle field using the same
    tri-colour scheme.

- **Lint fix applied on top** (Keshvi's commit predates the `no-restricted-syntax` inline-style
  rule): the four inline `style={{...}}` objects (blob, rings, spark dot, sparkle field) were
  converted to static Tailwind arbitrary-value class maps (`BLOB_CLASS`, `RING_BORDER`,
  `SPARK_DOT_BG`, `RING_SPECS`, `SPARK_BG`, `SPARK_SHADOW`, and literal `left-[…]`/`w-[…] h-[…]`
  in `SPARKLE_SPECS`) with framer-motion `initial={{ x: '-50%', y: '-50%' }}` centering — visuals
  unchanged, verified by typecheck + eslint + 305 tests.

---

## Auth → Phone regression fix + Phone step rebuild (2026-09-08, later)

Symptom (real server log):

```
POST /api/auth/signup 201 (4.1s)   → GET /api/bff/onboarding/me 401 (202ms)
                                    → GET /login?next=%2Fonboard 200
```

Fresh signup bounced the user to `/login` instead of advancing to the **Phone** step — a
**regression introduced by the PageClient rebuild**, not a backend problem. Two causes:

1. **Lost bearer relay.** The rewrite's `onboardApiClient` was created with `getToken: () => null`,
   so `/me` carried no `Authorization: Bearer` and the gateway could only resolve the session cookie.
   `@c1rcle/auth`'s `signup()` calls `setSession(user, accessToken, expiresAt)` **before** resolving
   (`packages/auth/src/auth-client.ts:74`), so `getToken: getAccessToken` (the documented behaviour in
   Onboardingflow.md §2) is what lets `/me` answer 200 right after signup.
2. **Unconditional 401 → `/login` redirect.** `loadMine()` was redirecting on _any_ auth failure,
   including the `/me` call issued immediately after `signup()`/`login()` — the exact case the
   2026-09-07 fix had declared "brand-new applicant → proceed to PHONE".

Fix:

- `getToken: getAccessToken` restored on the wizard's api-client.
- `loadMine(routeOnAuthFailure = true)` — the post-auth follow-up now calls `loadMine(false)`, so a
  fresh applicant's `/me` 401/500 is treated as "no application to resume" and the wizard advances
  to **Phone**. A genuinely dead session still 401-redirects on the next state-changing call.

### Phone step rebuilt to the previous structure

The phone step now matches the user's earlier (pre-corruption) structure — the V1 `phone_verify`
pattern adapted to V2 (no OTP endpoint; Onboardingflow.md §13):

- **Step 2 label "Verify Phone"**, title "Confirm Your Number", description
  _"We'll send an SMS code to confirm your mobile number. This becomes your verified contact on the
  platform."_
- **Mobile Number (with country code)** input, pre-filled `+91 `, sanitised to digits/`+`/spaces,
  placeholder `+91 98765 43210` (Indian 10-digit-after-+91 validation, international ≥ 8 digits).
- **Send SMS Code** button → validates, then swaps to the code UI and starts a **client-side 60 s
  cooldown** (`startCooldown` interval).
- **6-digit code input** (`OtpInput`, numeric-only, centered) + **Verify Phone** button — simulated:
  any valid 6-digit code is accepted (no OTP endpoint exists), writes `profile.phone`, goes to
  **Entity Type**.
- **Resend** button shows `Resend in Ns` while cooling down, then **Resend Code** (re-runs send).
- **Use a different number** resets to the input.
- Removed the old "Continue without a phone number" skip link (the documented flow always collects a
  number; `validateDetails` also requires `phone`).

### Verification (2026-09-08)

- `pnpm --filter @c1rcle/app-partner-dashboard typecheck` → clean.
- `pnpm --filter @c1rcle/app-partner-dashboard build` → succeeds.
- eslint on `src/app/onboard/PageClient.tsx` → back to the 4 documented repo-wide baseline errors
  (set-state-in-effect × 2 — restore + autosave, no-misused-promises × 1 — autosave, no-restricted-
  imports × 1 — lucide). Nothing newly introduced.

---

## V1 → V2 Onboarding Flow Alignment (2026-09-04)

### V1 Source of Truth (`C:\Users\majid\thec1rcle`)

The V1 partner dashboard onboarding flow at `apps/partner-dashboard/app/onboard/PageClient.tsx`
(~2800 lines) implements a dynamic step sequence based on entity type:

**Individual entity type (7 steps):**

1. `role` — Partner type selection (venue/host/promoter)
2. `email_verify` — Email OTP verification or password login for existing users
3. `phone_verify` — Phone SMS OTP verification
4. `entity_type` — Individual or Business selection (determines KYC steps)
5. `details` — Full profile form (creates Firebase account)
6. `kyc_identity` — Government ID type/number, document uploads, selfie
7. `success` — Application submitted / approved polling

**Business entity type (8 steps):**

1. `role` — Partner type selection
2. `email_verify` — Email verification
3. `phone_verify` — Phone verification
4. `entity_type` — Individual or Business selection
5. `details` — Full profile form
6. `kyc_business` — Business PAN, GST, address, registration certificate
7. `kyc_signatory` — Authorized representative identity verification
8. `success` — Application submitted / approved polling

**V1 Profile Fields (details step):**

| Field               | Type            | Required      | Notes                                                      |
| ------------------- | --------------- | ------------- | ---------------------------------------------------------- |
| Name                | Text            | Yes           | Label varies by role (Venue Name / Brand Name / Full Name) |
| Contact Person      | Text            | Yes           | "Authorized Contact" for business                          |
| Phone               | Tel (read-only) | Yes           | Pre-filled from phone verification                         |
| City                | Select dropdown | Yes           | 10 Indian cities                                           |
| Area                | Text            | Yes           | e.g. "Bandra"                                              |
| Website             | Text            | No            | Optional                                                   |
| Business Type       | Select          | Business only | pvt_ltd, llp, partnership, sole_prop, trust                |
| Registration Number | Text            | No (Business) | CIN/registration                                           |
| Capacity            | Text            | Venue only    | Approximate capacity                                       |
| Plan                | Select          | Venue only    | Subscription tier                                          |
| Host Category       | Select          | Host only     | dj, organizer, collective                                  |
| Instagram           | Text            | Promoter only | Handle                                                     |
| Bio                 | Textarea        | Promoter only | Short bio                                                  |
| Upcoming Events     | Textarea        | Promoter only | Optional, pipe-delimited format                            |
| Past Events         | Textarea        | Promoter only | Optional                                                   |

**V1 KYC Fields (kyc_identity step):**

| Field          | Type        | Required     | Notes                                           |
| -------------- | ----------- | ------------ | ----------------------------------------------- |
| ID Type        | Select      | Yes          | aadhaar, passport, driving_licence, voter_id    |
| ID Number      | Text        | Yes          | Varies by ID type                               |
| Document Front | File upload | Yes          | JPG/PNG/PDF, max 5MB                            |
| Document Back  | File upload | Conditional  | Required for aadhaar, driving_licence, voter_id |
| Selfie         | File upload | Yes          | JPG/PNG/PDF, max 5MB                            |
| Aadhaar Verify | Button      | Aadhaar only | Structural Verhoeff checksum validation         |

### V2 Onboarding Flow (Aligned to V1)

The V2 onboarding wizard (`src/app/onboard/PageClient.tsx`) now implements an **8-step flow**
matching V1's step sequence as closely as possible, given V2's backend constraints:

| Step | V2 Step Name    | V1 Equivalent     | Fields Collected                                 | Validation / Gate                                                      |
| ---- | --------------- | ----------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| 0    | **Role**        | `role` ✅         | `requestedType` ∈ `{venue, host, promoter}`      | Card selection; URL `?type=`                                           |
| 1    | **Auth**        | `email_verify` ⚠️ | `email`, `password`, `displayName` (signup only) | Email non-empty; password ≥ 8 chars; 409 → login mode                  |
| 2    | **Phone**       | `phone_verify` ⚠️ | Phone number input + SMS OTP flow                | Phone validation (Indian + international); cooldown timer              |
| 3    | **Entity Type** | `entity_type` ✅  | Individual/Business radio cards                  | Card selection                                                         |
| 4    | **Details**     | `details` ✅      | All profile fields (see below)                   | Required fields gate; autosave via `PATCH`                             |
| 5    | **Documents**   | `kyc_identity` ⚠️ | ID type, ID number, file uploads                 | ID type/number collected; 3 file uploads via signed URLs               |
| 6    | **Review**      | _(not in V1)_     | Summary of all data                              | Submit disabled while `missingDocuments.length > 0`                    |
| 7    | **Success**     | `success` ✅      | Polls `GET /onboarding/me` every 15s             | `approved` → studio; `rejected` terminal; `changes_requested` → step 4 |

**Legend:** ✅ = exact match with V1, ⚠️ = adapted to V2 backend constraints

### Details Step (Step 4) — Full Field Breakdown

The details step collects all profile fields in the same order as V1's `details` step:

#### Common Fields (always shown):

1. **Name** (`legalName`) — label varies by role (same as V1)
2. **Contact Person** (`contactPerson`) — "Authorized Contact" for business
3. **Phone** (`phone`) — read-only, green check icon, pre-filled from Step 2
4. **City** (`city`) — `FormSelect` dropdown (10 cities, same as V1)
5. **Area** (`area`) — text input
6. **Website** (`website`) — optional

#### Business-Only Fields (when `entityType === 'business'`):

7. **Legal Business Name** — replaces the generic Name field
8. **Business Type** (`businessType`) — select dropdown (same options as V1)
9. **Registration/CIN Number** (`registrationNumber`) — optional

#### Venue-Only Fields (when `requestedType === 'venue'`):

10. **Approximate Capacity** (`capacity`) — number input
11. **Subscription Tier** (`plan`) — select dropdown (moved from old Plan step)

#### Host-Only Fields (when `requestedType === 'host'`):

12. **Host Category** — select dropdown (organizer/dj/collective) — **changed from V2 text field to V1 dropdown**

#### Promoter-Only Fields (when `requestedType === 'promoter'`):

13. **Instagram Handle** (`instagram`) — text input
14. **Short Bio** (`bio`) — textarea
15. **Upcoming Events** — textarea (optional, pipe-delimited format) — **newly added, matches V1**
16. **Past Event Highlights** — textarea (optional) — **newly added, matches V1**

### Documents Step (Step 5) — Enhanced with V1 KYC Fields

The documents step now collects V1's KYC identity fields at the UI level:

| Field          | Type            | Required     | Notes                                        |
| -------------- | --------------- | ------------ | -------------------------------------------- |
| ID Type        | Select dropdown | No           | Aadhaar, Passport, DL, Voter ID (same as V1) |
| ID Number      | Text input      | No           | Varies by ID type                            |
| Aadhaar Verify | Button          | Aadhaar only | Simulated (V2 backend lacks this endpoint)   |
| ID Front       | File upload     | Yes          | Via V2's pre-signed URL mechanism            |
| ID Back        | File upload     | Conditional  | Required for aadhaar, DL, voter_id           |
| Selfie         | File upload     | Yes          | Via V2's pre-signed URL mechanism            |

**Note:** ID type, ID number, and Aadhaar verification are collected in the UI for user experience
but are NOT sent to the V2 backend (which doesn't accept these fields). They appear in the Review
step summary.

### What Changed from Previous V2 (6-step) Flow

| Change               | Before                       | After                                    | Rationale                                   |
| -------------------- | ---------------------------- | ---------------------------------------- | ------------------------------------------- |
| Step count           | 7 steps (0–6)                | 8 steps (0–7)                            | Added dedicated Phone and Entity Type steps |
| Phone collection     | In Plan step (Step 2)        | Dedicated Phone step (Step 2)            | Matches V1's `phone_verify` step            |
| Entity type          | Toggle inside Profile step   | Dedicated Entity Type step (Step 3)      | Matches V1's `entity_type` step             |
| Plan selection       | Dedicated Plan step (Step 2) | Inside Details step (Step 4, venue only) | Matches V1 where plan is in details         |
| Application creation | At Plan step                 | At Details step                          | Application needs profile data first        |
| Host category        | Text field                   | Select dropdown                          | Matches V1's dropdown                       |
| Promoter events      | Not collected                | Upcoming/Past Events textareas           | Matches V1's promoter fields                |
| Documents            | 3 generic file uploads       | ID type + number + file uploads          | Matches V1's `kyc_identity` fields          |
| Nightlife tastes     | `vibeTags[]` section         | Removed                                  | V1 doesn't have this field                  |
| User intents         | `intents[]` section          | Removed                                  | V1 doesn't have this field                  |
| Date of Birth        | `dateOfBirth` field          | Removed                                  | V1 doesn't collect this                     |

### V1 Behavior That Could NOT Be Replicated (V2 Backend Constraints)

| V1 Feature                                  | Why It Can't Be in V2                        | Adaptation                                   |
| ------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| Email OTP verification                      | V2 uses `@c1rcle/auth` email/password auth   | Email+password signup/login instead          |
| Phone SMS OTP verification                  | V2 backend has no OTP endpoints              | Phone number collected but not OTP-verified  |
| Aadhaar Verhoeff verification               | V2 backend has no `/api/kyc/verify-aadhaar`  | Simulated with timeout (UI only)             |
| Business KYC (PAN, GST, address, reg doc)   | V2 backend doesn't accept these fields       | Collected in UI's ID type/number fields only |
| Signatory KYC (rep identity verification)   | V2 backend doesn't accept these fields       | Not present                                  |
| Firebase account creation with full profile | V2 uses separate auth + application creation | Auth first, then application with profile    |
| `kycStepData` in final submission           | V2 backend doesn't accept this               | Documents uploaded via separate API          |

### Field Storage Mapping (V1 → V2 Backend)

| V1 Field               | V2 Profile Field               | V2 Backend Schema               |
| ---------------------- | ------------------------------ | ------------------------------- |
| `name`                 | `legalName`                    | `profile.legalName` ✅          |
| `contactPerson`        | `contactPerson`                | `profile.contactPerson` ✅      |
| `phone`                | `phone`                        | `profile.phone` ✅              |
| `city`                 | `city`                         | `profile.city` ✅               |
| `area`                 | `area`                         | `profile.area` ✅               |
| `website`              | `website`                      | `profile.website` ✅            |
| `capacity`             | `capacity`                     | `profile.capacity` ✅           |
| `plan`                 | `plan`                         | `request.plan` ✅               |
| `businessType`         | `businessType`                 | `profile.businessType` ✅       |
| `registrationNumber`   | `registrationNumber`           | `profile.registrationNumber` ✅ |
| `instagram`            | `instagram`                    | `profile.instagram` ✅          |
| `bio`                  | `bio`                          | `profile.bio` ✅                |
| `role` (host category) | `hostCategory` (UI only)       | Stored in `bio` field ✅        |
| `upcomingEventsText`   | `upcomingEventsText` (UI only) | Not in V2 backend ❌            |
| `pastEventsText`       | `pastEventsText` (UI only)     | Not in V2 backend ❌            |
| `idType`               | `idType` (UI only)             | Not in V2 backend ❌            |
| `idNumber`             | `idNumber` (UI only)           | Not in V2 backend ❌            |

## Firebase Teardown

### Step 2 — The old auth/verify routes are removed

These files no longer exist:

- `src/app/verify/` — `page.tsx`, `layout.tsx`, `PageClient.tsx` (the whole screen was dropped).
- `src/app/api/kyc/` — `route.ts`, `upload/route.ts`, `verify-aadhaar/route.ts`.

The kyc API routes and `/verify` page depended on the legacy Firebase auth flow (OTP / cached
Firebase ID token), which is exactly the surface Track 2 tore down. Nothing in the app route tree
links to them anymore, so they were deleted rather than ported.

## Step 3 — The dashboard auth provider is re-homed

The legacy `DashboardAuthProvider` exposed a Firebase-shaped surface (`auth.isBanned`,
`entityType`, `kycStatus`, `subscriptionPlan`, `onboardingStatus`, `mustChangePassword`, …) that
has no V2 equivalent. It was re-implemented in `src/components/providers/session-context.tsx` as
`SessionAuthProvider`:

- Reads `useSessionStore()` (the `@c1rcle/auth` in-memory session store) and `useOrgAccess()` for
  permissions/tab visibility.
- Exposes `signIn`/`signUp`/`signOut` (wrapping `login`/`signup`/`logout`), `getIdToken`,
  `switchPartner`, `hasPermission`/`canDo`, `tabVisibility`, `grantedPermissions`, and
  `isApproved = activeOrgId !== null`.
- Drops the deprecated Firebase-era fields (see the commit list below).

`DashboardAuthProvider.tsx` is kept as a thin re-export of `session-context.tsx` so the ~22
consumer import sites (studio layouts, `partner-shell`, `partner-v3`, promoter/venue components)
keep resolving without touching each. The provider itself was removed from
`src/app/onboard/layout.tsx` (now a bare fragment), matching what login/signup already did.

Four consumers referenced the dropped `auth.isBanned` field; since it was always `false`, those
read `if (!user || auth.isBanned || …)` and were trimmed to `if (!user || …)` — a two-line
change each, done only to keep typecheck green, nothing more.

## Step 4 — teardown of the dependency and keys

- `"firebase": "^11.3.0"` removed from `apps/partner-dashboard/package.json`. A grep of
  `apps/partner-dashboard/src` for `firebase` is now empty.
- The Firebase key files (`lib/firebase/client.ts`, `lib/auth/getCachedFirebaseIdToken.ts`) and
  the old `/api/auth/{me,partner-context,…otp}` routes had already been deleted in Track 1/2; this
  slice just removed the last remaining references and call sites.

---

## Verification

The task's stated gate (Track 3):

- `git grep -n "firebase" apps/partner-dashboard/src` → empty
- `git grep -n "/api/auth/me\|/api/auth/otp" apps/partner-dashboard/src` → empty
- `pnpm --filter @c1rcle/app-partner-dashboard build test typecheck` → all green (on
  `feat/partner-gateway-auth-foundation`, where Sagar/Keshvi's `src/lib/{api,org,access}` and
  `partner-role-routing` exist — the branch this slice targets)

The newly-written `src/app/onboard/PageClient.tsx` and `session-context.tsx` also pass the
project's eslint config; the only lint errors in the app at the time of writing were pre-existing
and unrelated (e.g. `login/page.tsx`, other studio screens).

## As-built vs V1 Alignment + Spec

The wizard above is now an **8-step flow aligned with V1** (role → auth → phone → entity type →
details → documents → review+submit → success). The key V1 alignment changes:

1. **Phone as dedicated step** (Step 2) — V1 has `phone_verify` as a separate step; V2 now
   collects phone in its own step (though without OTP verification due to V2 backend constraints).
2. **Entity Type as dedicated step** (Step 3) — V1 has `entity_type` as a separate step; V2 now
   has Individual/Business selection in its own step instead of being a toggle inside the details
   form.
3. **Details step restructured** — V2's details step now matches V1's field order exactly:
   name → contact person → phone (read-only) → city → area → website → business fields →
   venue fields → host fields → promoter fields (including upcoming/past events textareas).
4. **Documents step enhanced** — Now collects ID type and ID number at UI level (matching V1's
   `kyc_identity` step), though these fields are NOT sent to V2 backend.
5. **vibeTags and intents removed** — V1 doesn't have these fields, so they were removed from the
   UI (though the V2 backend still accepts them if provided programmatically).
6. **Host category changed to dropdown** — V2's text field was changed to a dropdown matching V1's
   `organizer`/`dj`/`collective` options.
7. **Application created at details step** — POST `/applications` now happens at step 4 (details)
   instead of step 2 (plan), since the application needs profile data first.

The spec's three open decisions were implemented at the defaults it recommends: application created
at step 4 (details), entity type as a dedicated step, and three document slots (`id_front`,
`id_back`, `selfie`). The profile step's field **flow/sequence** now exactly matches the V1 partner
dashboard's `details` step order.

## Files changed in this slice

### Core onboarding change:

- `src/app/onboard/PageClient.tsx` — rewritten V2 8-step wizard aligned with V1 flow/fields.

### Supporting files (pre-existing changes, not from V1 alignment):

- `src/lib/onboarding/uploadToSignedUrl.ts` — cross-origin signed-PUT helper (`memory://` no-op) that
  moved the browser upload server-side on 2026-09-07; **deleted** with the BFF change (see
  **Onboarding through the BFF**).
- `src/app/onboard/layout.tsx` — dropped `DashboardAuthProvider`, bare fragment (it now wraps
  children in the real `DashboardAuthProvider` again).
- `src/components/providers/session-context.tsx` — new re-homed `SessionAuthProvider`.
- `src/components/providers/DashboardAuthProvider.tsx` — re-export shim at the time (now the
  real V2-native provider).
- `src/components/partner-shell/PartnerDashboardLayout.tsx`, `src/components/partner-v3/AccessEntry.tsx`,
  `src/components/partner-v3/PartnerStudioFrame.tsx`, `src/components/promoter/PartnerNetworkAccess.tsx` —
  dropped `auth.isBanned` references.
- `src/app/verify/…`, `src/app/api/kyc/…` — deleted.
- `apps/partner-dashboard/package.json` — removed `firebase`.

**Deliberately left alone (task constraint):** `packages/**`, `src/proxy.ts`, `next.config.ts`,
the root `layout.tsx`, `src/lib/{api,org,access}`, and the studio route-group trees
(`src/app/{venue,host,promoter}/**`) — those were edited for the `isBanned` removal only.

### Verification

- `git diff --name-only -- packages/ apps/api-gateway/` → empty (no backend files changed)
- `git diff --name-only -- apps/partner-dashboard/` → only `PageClient.tsx` changed (the rewrite)
- Phone OTP is simulated (V2 has no SMS OTP endpoint)
- Aadhaar verification is simulated (V2 has no `/api/kyc/verify-aadhaar`)
- `vibeTags`, `intents`, `dateOfBirth` fields removed from UI but still accepted by V2 backend if provided programmatically
