# Partner Onboarding Flow — V2 Spec (2026-09-01)

Build target for Majid's `/onboard` rebuild. Touches Anil (`proxy.ts`) and the landing CTA.
Supersedes the "V2 4-step wizard" bullet in `INTERN-TASKS-2026-08-27.md` §Track 3.

## Why

The V1 flow the founders want kept: **Apply → pick role (venue/host/promoter) → then "start onboarding
or sign in" → wizard → pending review**. The V2 build has to keep that _shape_ but run on the V2
stack: Better Auth (email + password, no OTP), the `/api/v2/onboarding/*` endpoints, the reduced
field set, contract-parsed responses.

Current bug blocking this: `apps/partner-dashboard/src/proxy.ts` lists `/onboard` in
`AUTH_GATED_PREFIXES`, so an unauthenticated "Apply for Partner Access" click is bounced to
`/login` before the role screen ever renders. V1 never gated `/onboard`.

Backend note: the "authenticated but not yet in an org" 401 that used to break every onboarding
call on the real driver is **fixed** — `C1RCLE-BACKEND` `dc7bb79` (session-only actor). A
freshly signed-up user can now hit all `/api/v2/onboarding/*` routes.

## What V1 does that V2 keeps / drops

| V1                                                              | V2                                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Role step 1, **public**                                         | **keep** — public                                                                                                              |
| Sign-in vs sign-up folded into the email step (existence check) | **change** — explicit "Start onboarding / Sign in" branch after the role step (clearer; Better Auth has no pre-check endpoint) |
| Firebase email OTP + phone OTP screens                          | **drop** both. Phone stays as a _typed field_ on the profile (backend requires it), just not verified                          |
| Entity type (individual/business) → different KYC steps         | **drop** the branching. `entityType` is an optional profile string; documents are always the same 3                            |
| `kyc_identity` / `kyc_business` / `kyc_signatory`               | **collapse** to one document step: `id_front`, `id_back`, `selfie`                                                             |
| Account created mid-flow at the details step                    | account created at the auth step (step 2), before the application exists                                                       |
| Progress saved via `PATCH /api/auth/onboarding-progress`        | `PATCH /api/v2/onboarding/applications/:id` (autosave)                                                                         |
| Resume via `/api/auth/me`                                       | `GET /api/v2/onboarding/me`                                                                                                    |
| Plan chosen inside the venue-only details form                  | its own step, all partner types, needed to create the application                                                              |
| No bank step                                                    | still none (Phase 6)                                                                                                           |

## The flow

```
Landing "Apply for Partner Access"  →  /onboard
  1  Role            (public)   venue | host | promoter
  2  Onboard / Sign in (public)  ── new ──► auth.signup()
                                 └ existing ─► auth.login() ─► GET /onboarding/me
                                                              ├ approved  → /partner/select-organization → studio
                                                              ├ draft/submitted → resume at the right step
                                                              └ nothing → continue at step 3
  3  Plan            (authed)   basic | silver | diamond
                                → POST /api/v2/onboarding/applications { requestedType, plan }  → application id
  4  Profile         (authed)   legalName, contactPerson, phone, city (+ optional)
                                → PATCH /api/v2/onboarding/applications/:id   (autosave, debounced)
  5  Documents       (authed)   id_front, id_back, selfie
                                → per file:  POST .../documents/upload-url  →  PUT (signed)  →  POST .../documents
  6  Review + Submit (authed)   → POST .../applications/:id/submit
  ── Success ──  "pending review", poll GET /onboarding/me until approved  →  GET /organizations  →  studio
```

The application row is **not created until step 3** — steps 1–2 hold `requestedType` in local state
(and the URL: `/onboard?type=venue`). This matches V1's order (role → auth → rest) while satisfying
the backend, which needs `requestedType` + `plan` together at `POST /applications`.

## Per-step detail

### Step 1 — Role (public)

Three cards: **Venue Partner** / **Event Host** / **Promoter** (copy from V1
`onboard/PageClient.tsx` `role` step). Selection → local state + `router.replace('/onboard?type=<t>')`
so a refresh keeps it. "Continue" → step 2.

### Step 2 — Onboard or Sign in (public)

Two paths on one screen:

- **"Start onboarding"** (default): `email`, `password` (min 8), `displayName` → `auth.signup({ email,
password, displayName })` (from `@c1rcle/auth`). On success the session is set. → step 3.
  - Signup returns a flat error envelope; a `409 conflict` / "email already registered" → switch the
    screen to sign-in mode, prefill the email, show "This email already has an account — sign in".
- **"Already have an account? Sign in"**: `email`, `password` → `auth.login()`. On success:
  - `GET /api/v2/onboarding/me` →
    - `request === null` → step 3 (they'll start an application with the role from step 1)
    - `status: 'approved'` → `/partner/select-organization`
    - `status: 'draft' | 'submitted' | 'changes_requested'` → resume (see Resume below)

No `role` in any auth body — the backend sets `partner` on signup.

### Step 3 — Plan (authed)

Three cards: **basic** / **silver** / **diamond** (show the platform-fee headline if product wants:
15% / 12% / 10%). On "Continue":

```
POST /api/v2/onboarding/applications
  headers: Authorization: Bearer <token>, Idempotency-Key: <stable per attempt>
  body:    { requestedType: <step 1>, plan: <step 3> }
  → 201 onboardingRequestDtoSchema  { id, status: 'draft', requestedType, plan, missingDocuments, ... }
```

Store `application.id`. If a `draft` application already exists for this user (from a prior visit),
`POST` may `409` — fall back to `GET /onboarding/me`, take that `id`, and if its `requestedType` /
`plan` differ, `PATCH` them (confirm the backend allows changing them on a `draft`; if not, this
step is read-only on resume).

### Step 4 — Profile (authed)

`onboardingProfileSchema` (from `@c1rcle/contracts`):

| Field                                              | Required | Notes                                                                                      |
| -------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `legalName`                                        | ✓        | "Legal name" / "Legal business name" by copy                                               |
| `contactPerson`                                    | ✓        |                                                                                            |
| `phone`                                            | ✓        | min 6 chars — **typed, not OTP-verified**                                                  |
| `city`                                             | ✓        |                                                                                            |
| `area`                                             |          |                                                                                            |
| `website`                                          |          |                                                                                            |
| `capacity`                                         |          | number, venue only by copy                                                                 |
| `instagram`                                        |          | promoter emphasises this                                                                   |
| `bio`                                              |          | promoter emphasises this                                                                   |
| `businessType`, `registrationNumber`, `entityType` |          | free strings; show only if the user says "business" (a local toggle, not a backend branch) |

Autosave: debounce ~800ms → `PATCH /api/v2/onboarding/applications/:id` with the changed subset
(`saveOnboardingProgressSchema` = `onboardingProfileSchema.partial().strict()`, **no Idempotency-Key**).
Show a quiet "saved" indicator. "Continue" just navigates — the data is already saved.

### Step 5 — Documents (authed)

Three required uploads: `id_front`, `id_back`, `selfie`. Per file:

1. Client-side validate: `image/jpeg | image/png | image/webp`, ≤ 5 MiB.
2. `POST /api/v2/onboarding/applications/:id/documents/upload-url` `{ label, contentType }` →
   `documentUploadUrlDtoSchema` `{ uploadUrl, method: 'PUT', headers, storagePath, expiresAt }`.
3. `PUT` the `File` to `uploadUrl` with **exactly** the returned `headers` (content-type +
   `x-goog-content-length-range`). This is a cross-origin PUT to Google Storage, **not** a gateway
   call — put it in `src/lib/onboarding/uploadToSignedUrl.ts` with an eslint-disable + comment
   (`@c1rcle/api-client` can't do an opaque cross-origin PUT). On the memory driver `uploadUrl`
   starts `memory://` — detect that prefix and skip the PUT.
4. `POST /api/v2/onboarding/applications/:id/documents` `{ label, storagePath }`.

Re-picking a label repeats 1–4; the key is deterministic so it overwrites. Track which labels are
done from `onboardingRequestDtoSchema.missingDocuments`.

Optional: a "Run a quick format check" affordance → `POST /api/v2/onboarding/verify-document` →
render **"Format check passed — pending manual review"**, never "Verified", no green tick.

### Step 6 — Review + Submit (authed)

Show a read-only summary. Submit:

```
POST /api/v2/onboarding/applications/:id/submit
  headers: Authorization: Bearer <token>, Idempotency-Key: <stable per attempt>
  → onboardingRequestDtoSchema  status: 'submitted'
```

Before the 3 documents are recorded this `4xx`s with a "missing documents" message — surface it as
an inline notice on step 5, not an error toast.

### Success / Resume

- **Success screen**: `status: 'submitted'` → "Application received, our team reviews within N days."
  Poll `GET /api/v2/onboarding/me` every ~15s (or on focus). On `approved` → `GET /api/v2/organizations`
  → if one org, set active + go to its studio; if several, `/partner/select-organization`.
- **`changes_requested`**: show `reviewNote`, drop the user back at step 4 (or 5) to fix and re-submit.
- **`rejected`**: terminal message.
- **Resume on load**: `/onboard` is a client route. On mount, if a session cookie is present, call
  `GET /api/v2/onboarding/me` and jump to: no request → step 1; `draft` with no profile → step 4;
  `draft` with profile, missing docs → step 5; `draft` complete → step 6; `submitted` → success;
  `approved` → studio. No session → step 1.

## Changes outside `/onboard`

### `apps/partner-dashboard/src/proxy.ts` (Anil)

Remove `/onboard` from `AUTH_GATED_PREFIXES`:

```ts
const AUTH_GATED_PREFIXES = ['/venue', '/host', '/promoter', '/partner', '/partner-network'];
```

Keep `/onboard/:path*` in `config.matcher` (CSP nonce still needs to run there). The `/onboard`
route guards itself per the Resume logic above. Studio paths stay gated.

### Landing CTA (whoever owns `components/landing/LandingPage.tsx`)

`"Apply for Partner Access"` → `href="/onboard"` (already correct). `"Already a User"` → `/login`.
Optionally deep-link the role: `/onboard?type=venue` from a "For Venues" section.

### `/login` and `/signup` (Anil)

`/login` stays the pure sign-in screen for returning users going straight to their studio.
Whether a standalone `/signup` route still exists is Anil's call — this flow does signup _inside_
`/onboard` step 2. If `/signup` stays, it should just redirect to `/onboard`.

## Ownership

| Piece                                                          | Owner                                                                                                                 |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/onboard` 6-step machine, `src/lib/onboarding/*`              | **Majid**                                                                                                             |
| `proxy.ts` gate change                                         | **Anil**                                                                                                              |
| Landing CTA / `?type=` deep link                               | Anil (or landing owner)                                                                                               |
| `GET /organizations` → studio hop after approval               | uses Keshvi's `getActiveOrgId` / org repo                                                                             |
| Review that `POST /applications` 409-on-existing-draft behaves | **Shriyash** (backend) — confirm `requestedType`/`plan` are editable on a `draft`, or make step 3 read-only on resume |

## Open decisions (flag before building)

1. **Plan step position** — this spec puts Plan at step 3 (after auth, before profile). Alternative:
   fold Plan into step 1 next to Role (both public), create the application right after signup. The
   step-3 version keeps the screen light and matches "role → auth → rest"; confirm with product.
2. **Business fields** — shown via a local "I'm registering as a business" toggle that just reveals
   `businessType` / `registrationNumber` / `entityType`. No backend branch, no separate KYC. OK?
3. **Document count** — 3 (`id_front`, `id_back`, `selfie`) is the backend's fixed label enum. If
   product wants venue/business to upload more (registration cert etc.), that's a backend contract
   change first.
