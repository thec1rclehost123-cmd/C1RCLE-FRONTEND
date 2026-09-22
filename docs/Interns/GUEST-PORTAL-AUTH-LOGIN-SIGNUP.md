# Guest Portal — Email/Password Login & Signup Implementation

App: `@c1rcle/app-guest-portal` (`apps/guest-portal`)
Backend: `api-gateway` (`POST /api/v2/auth/*`), running locally on `http://localhost:4000`
Status: implemented, typechecked, all 57 tests passing.

Previously the `/login` page was `FIXTURE_ONLY` — Apple/Google/Phone buttons with a
hardcoded `123456` OTP and zero backend calls. It is now a real email/password
flow (no Google/Apple/phone) fully connected to the backend through the
sanctioned architecture: browser → Next.js BFF (`/api/auth/*`, same-origin) →
gateway (`/api/v2/auth/*`).

---

## 1. Login flow (`/login`, mode = login)

1. **Credentials step** — user enters email + password.
   Client validation: valid email shape, non-empty password.
2. **Direct backend call** — no verification step: `login({ email, password })`
   from `@c1rcle/auth` → `POST /api/auth/login` (BFF) → `POST /api/v2/auth/login`
   (gateway).
3. **Success** — in-memory session set (`setSession`), `complete` screen
   (or redirect to `?next=`, e.g. `/tickets`). Gateway failures surface the
   backend message (login 4xx is the generic `Authentication failed` —
   account-existence-oracle suppression, by design).
4. Already-authenticated visits bounce to `?next=` or `/explore`.

## 2. Signup flow (`/login?mode=signup`, `/signup` redirects there)

Seven steps — credentials + OTP, then the restored onboarding, with the backend
account created at the end:

1. **Credentials** — email + password (min. **8 characters** per
   `signupRequestSchema`). No display-name field here; the name comes from
   step 3.
2. **OTP (`VERIFY · STEP 02`, signup only)** — `123456`, checked locally
   (`isValidFixtureOtp`, never displayed in the UI). Wrong code →
   `Invalid verification code.`, no network call.
3. **Identity (`ONBOARDING · 01 OF 04`)** — preferred name (min. 2 chars) +
   date of birth with 18+ check.
4. **City (`02 OF 04`)** — Pune, Mumbai, Delhi, Bengaluru, Goa, Hyderabad,
   Chennai, Kolkata.
5. **Tastes (`03 OF 04`)** — at least 3 of Underground electronic, Live music,
   Rooftops, Art & culture, Campus nights, Food & pop-ups.
6. **Intent (`04 OF 04`)** — at least 1 of Find events, Meet people,
   Follow hosts, Try something new.
7. On **FINISH** → first `signup({ email, password, displayName: <preferred name> })`
   (created once; retried FINISH calls skip re-registering), then
   `PUT /api/v2/profile/me` via `apiClient` (Bearer-direct, validated against
   `guestProfileDtoSchema`) → `complete` screen (or `?next=` redirect).
   Signup failures surface the backend message.

## 3. Request path / architecture (mirrors partner-dashboard)

- Cookie/CSRF calls → same-origin BFF `app/api/auth/*` →
  `src/lib/bff/auth-proxy.ts:forwardToGateway()` → gateway `:4000`.
  `rescopeSessionCookies()` re-scopes the Better Auth cookie to the frontend
  origin; `assertSameOrigin` + `assertCsrf` guard every route.
- Browser data calls → `src/lib/api/client.ts` (`@c1rcle/api-client`, Bearer +
  one silent `refresh()` reauth, redirect to `/login` on dead session).
- Server bootstrap → `layout.tsx` calls `getServerSession(cookies())`
  (direct `GET /api/v2/auth/session`, no BFF) → `SessionProvider` hydrates the
  store and mints the in-memory token via one `refresh()`.
- `NavbarActions` reads `useSession()` (PROFILE vs LOGIN link);
  `SignOutControl` calls real `logout()` (server revoke + redirect
  `/login?next=/profile`).
- Extra BFF `otp/send|verify` routes forward to the gateway for future real
  email OTP; the current UI gate stays local `123456`.

---

## 4. Files changed

### New

| File | Purpose |
|---|---|
| `src/lib/bff/auth-proxy.ts` | Sanctioned BFF proxy (only raw-`fetch` module) |
| `src/app/api/auth/login/route.ts` | BFF → `POST /api/v2/auth/login` (200) |
| `src/app/api/auth/signup/route.ts` | BFF → `POST /api/v2/auth/signup` (201) |
| `src/app/api/auth/refresh/route.ts` | BFF → `POST /api/v2/auth/refresh` (CSRF) |
| `src/app/api/auth/logout/route.ts` | BFF → `POST /api/v2/auth/logout` (204, best-effort) |
| `src/app/api/auth/session/route.ts` | BFF → `GET /api/v2/auth/session` |
| `src/app/api/auth/otp/send/route.ts` | BFF → `POST /api/v2/auth/otp/send` |
| `src/app/api/auth/otp/verify/route.ts` | BFF → `POST /api/v2/auth/otp/verify` |
| `src/lib/bff/bff-client.ts` | Same-origin BFF API client |
| `src/lib/api/client.ts` | Gateway API client (Bearer + reauth) |
| `src/components/providers/session-provider.tsx` | Session bootstrap (30-min idle logout) |
| `src/app/signup/page.tsx` | Redirects to `/login?mode=signup` |
| `.env.local` (git-ignored, local only) | `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000` + app name/env |

### Modified (rewritten or updated)

| File | Change |
|---|---|
| `src/app/login/login-page-client.tsx` | Rewritten: credentials → OTP → (signup: identity → city → tastes → intent) state machine; email/password + OTP-gated `login()`/`signup()` (preferred name sent as `displayName`); `?next=` redirect, authed bounce, `initialMode`/`nextPath` props |
| `src/app/login/page.tsx` | Async server page: resolves `mode`/`next` from `searchParams`, `key`-remount, `Suspense` |
| `src/app/login/page.test.tsx` | 6 tests: email form, OTP gate → backend call, full signup onboarding (name/18+/city/3-tastes/intent → `signup()`), onboarding render, mode toggle, fixed OTP |
| `src/features/auth/components/LoginFormCard.tsx` | Rewritten: credentials (email/password) + `OtpVerifyStep` + restored identity/city/tastes/intent branches + complete; provider buttons removed |
| `src/features/auth/types/login.types.ts` | `AuthMode`, 7-step `AuthStep`, email + onboarding `LoginFormState`, restored `LoginFixtureData` |
| `src/features/auth/fixtures/login.fixture.ts` | Hero + `defaultOtp: '123456'` + restored cities/tastes/intents |
| `src/features/auth/components/CitySelectorStep.tsx` | Restored city grid (deleted earlier, brought back) |
| `src/app/layout.tsx` | Async + `SessionProvider` server bootstrap |
| `src/components/layout/NavbarActions.tsx` | Session-aware via `useSession()` |
| `src/features/profile/components/SignOutControl.tsx` | Real `logout()` instead of local `clearSession()` |
| `src/app/profile/page.test.tsx` | Awaits async sign-out |
| `vitest.setup.ts` | `login/signup/logout/refresh/fetchSession` auth mocks |

### Deleted

| File | Reason |
|---|---|
| `src/features/auth/components/PhoneStep.tsx` | Phone flow removed (kept deleted) |

---

## 5. Environment / run notes

- Frontend needs `apps/guest-portal/.env.local` (git-ignored):
  `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`.
  Port `8080` is occupied on this machine by an unrelated Java process serving a
  non-JSON login page — pointing the app at `8080` produces
  `The authentication service is unavailable.`
- Backend gateway runs on `:4000` (`STORAGE_DRIVER=firestore`); verified
  `GET /api/v2/internal/health → {"ok":true}` and login with bad credentials →
  `400 "Authentication failed"`.
- Restart the frontend dev server after any `.env.local` change
  (`NEXT_PUBLIC_*` is inlined at startup).

## 6. Known limitations (not changed here)

- Gateway hard-codes `role: 'partner'` on signup/session
  (`apps/api-gateway/src/routes/v2/auth/index.ts:55,299`) — guest users come
  back with a partner role until the backend adds a real guest role path.
- `pnpm lint` still reports 2 pre-existing errors at HEAD
  (`profile/page.test.tsx:26`, `tickets/page.test.tsx:11`,
  `@typescript-eslint/no-unsafe-call` — verified via `git stash`, unrelated).
- `pnpm boundaries` reports 1 pre-existing violation
  (`partner-dashboard` depends on `firebase` — unrelated).
- `partner-dashboard` typecheck has 7 pre-existing errors at HEAD
  (missing `firebase/*` modules, `api-partner-data-source` fixture types —
  verified via `git stash`, unrelated).

## 7. Guest profile persistence (backend slice)

Onboarding answers are persisted per session user — nothing stays
browser-only anymore.

- **Collection**: Firestore `v2_guest_profiles`, one doc per user id
  (`packages/core/src/infrastructure/firestore/firestore-guest-profile-repository.ts`;
  `MemoryGuestProfileRepository` for the memory driver/tests).
- **Endpoints** (`apps/api-gateway/src/routes/v2/profile.ts`, registered in
  `route-manifest.ts`): `GET /api/v2/profile/me` (200 DTO, 404 `not_found`
  before first save) and `PUT /api/v2/profile/me` (full-replace upsert, 200;
  strict body → 422; under-18 → 400 `validation`). Session-scoped like
  `onboarding/me`: no org, `AUTH_READ` on GET, `STANDARD_COMMAND` on PUT, no
  idempotency key/`If-Match` (same body converges, retries safe).
- **Contracts**: `packages/contracts/src/contracts/guest-profile.ts`
  (`upsertGuestProfileSchema`, `guestProfileDtoSchema`); frontend mirror
  regenerated via `scripts/export-contracts.mjs` (`contract-parity`: 59 checks
  clean). The export also synced overdue mirror drift (poster-upload schemas,
  narrowed KYC labels, removed public-detail DTOs — all unused by guest-portal).
- **Domain rule**: 18+ enforced in `domain/models/guest-profile.ts`
  (`InvalidOperationError`), timestamps are ISO strings per `identity.ts`.
- **Frontend save**: `login-page-client.tsx` FINISH → `apiClient.put`
  (`src/lib/api/client.ts`, Bearer-direct) after `signup()`; added
  `@c1rcle/contracts` to guest-portal deps. Login test asserts the exact PUT
  path/body/schema.
- **Tests**: backend contracts (13), core service incl. isolation + under-18
  (4), gateway route incl. 404/422/400/user-isolation (5) — full suites green
  (core 440, gateway 332, guest-portal 58).

## 8. Real data on explore + event detail (no dummies)

- `/explore` is an async Server Component fetching `GET
  /api/v2/public/discovery` (published-only via `isPublic`) + per-venue
  `GET /api/v2/public/venues/by-id/:venueId`, mapped by pure
  `features/explore/explore-mapping.ts` (paise/ISO untouched, honest
  fallbacks, cities derived from real venues). API failure → typed empty
  state, never fixtures.
- `/event/[slug]` fetches `GET /api/v2/public/events/:idOrSlug` (+ venue and
  new `GET /api/v2/public/hosts/by-id/:organizationId`) via pure
  `features/event-detail/event-detail-mapping.ts`. Removed
  `generateStaticParams` + `dynamicParams = false` (they 404'd every real
  slug). Ticket section gets one tier from the event's real price fields
  (`ticketNote: 'Live pricing'`); guestlist renders only with guests.
- Backend additions: `PublicService.getVenueById/getHostById`, routes
  `/public/venues/by-id/:venueId` and `/public/hosts/by-id/:organizationId`
  (registered before the `:slug` routes — `by-id` matches the slug char
  class). No contract changes needed (reused `venueDtoSchema`,
  `hostPublicDtoSchema`).
- Verified live: `/explore` renders 12 real published events; event URLs
  require a dev-server restart to pick up the removed `dynamicParams`
  (route-config HMR limitation — see task notes).
- Still fixture-backed (next slices): venue/host profile pages, `/checkout/*`,
  home featured events.

## 8. Explore: real published events only (no dummies)

`/explore` no longer reads `explore.fixture.ts` (6 hardcoded Neon Nights–style
events). The page is now an async Server Component:

- `GET /api/v2/public/discovery` (anonymous; backend `PublicService` returns
  only `isPublic` events — published/sales-paused/started, never drafts) →
  `EventDto[]`.
- Venue name + city per event via new backend
  `GET /api/v2/public/venues/by-id/:venueId`
  (`PublicService.getVenueById`, active-only; registered before
  `/venues/:slug` so `by-id` isn't captured as a slug) → `venueDto`.
- Pure `src/features/explore/explore-mapping.ts`
  (`toExploreEvent`/`deriveCities`/`toCityKey`): category ← first tag, image ←
  `imageUrl` (logo fallback), price ← paise/`isFree`, city filter ← real venue
  cities. Missing venue → honest `Venue TBA, India` text, never invented data.
- API failure → typed empty state (`No events found`), never a fixture
  fallback. Hero takes the first 3 real events (renders nothing when empty).
- Tests: mapping unit tests + rewritten page tests (mocked gateway: real
  render, venue fallback, derived cities, API-failure empty state). Verified
  live: 12 real published events render, zero fixture titles.
- Note: home `/` (`HomeFeaturedEvents`) still uses the fixture; event detail
  `/event/[slug]` still fixture-backed — separate follow-ups.
