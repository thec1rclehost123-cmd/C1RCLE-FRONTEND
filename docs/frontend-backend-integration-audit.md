# Frontend ↔ Backend Integration Audit — Mocks, E2E, and Flaws

**Date:** 2026-10-12
**Scope:** `C1RCLE-FRONTEND` (partner-dashboard, guest-portal, admin-console, scanner-app) and
`C1RCLE-BACKEND` (api-gateway, core, contracts). Read against the current uncommitted working tree.
**Focus:** where mock/fixture data enters the product, what end-to-end coverage exists, and the
concrete flaws that fall out of the two.

---

## 1. Mock / fixture inventory

### 1.1 partner-dashboard

| Surface                   | File                                                                                                | Wiring                                                                                                                                                                                                                                                              |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The master fixture source | `src/data/fixture-partner-data-source.ts` (~3,100 lines)                                            | Feeds the `[studio]` pages: events list, event detail/sales/guests/promoters/tonight, door, marketing, promoter events/guests/analytics/leaderboard/finance, settings, overview (venue + host), **and** the shell chrome (`getPartnerShellInteractions`, line 3113) |
| Live staff slice          | `src/data/api-partner-data-source.ts` (`getStaffFromApi`)                                           | **Real.** Members failure → error surface; invitations 403 → roster with `canManage: false`. A model of the right pattern                                                                                                                                           |
| Fixture composition root  | `src/lib/partner/repositories.ts` → `fixture-host-repository.ts` / `fixture-promoter-repository.ts` | Bound **only** by the legacy route trees: `/host/settings`, `/host/finance/orders`, `/promoter/settings`, `/partner-network/promoters/[id]`                                                                                                                         |

Data-source contract lives in `src/data/partner-data-source.ts`; every model carries a
`dataStatus: 'fixture' | ...` discriminator.

### 1.2 guest-portal

Per-feature fixtures under `src/features/*/fixtures/`: `home`, `explore`, `tickets`, `booking`,
`profile`, `directory`, `event-detail`. Wired into live pages as follows:

| Route                | Fixture use                                                                                                 | Classification                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `/` (home)           | `homeFixture`, `exploreFixture` for content; real `getPublicEventsForSitemap` for SEO                       | Fixture content + real SEO data          |
| `/tickets`           | `ticketsFixture` as logged-out showcase; real `GET /api/wallet/tickets` when authed                         | Honest hybrid                            |
| `/checkout/[id]`     | Fixture checkouts first, then real published events mapped into the same UI; free bookings post a real RSVP | Honest hybrid                            |
| `/confirmation/[id]` | Fixture previews first, then real buyer-scoped orders via `GET /api/v2/orders/:id`                          | Honest hybrid                            |
| `/hosts`             | `directoryFixture`; eligibility gates return `false`                                                        | Fixture, deliberately hidden from search |
| `/profile`           | `profileFixture` only — **no fetch**                                                                        | Fixture-only                             |

### 1.3 scanner-app

`apps/scanner-app/src/api/schemas.ts` — a **local duplicate** of the wire schemas. The app does
**not** import `@c1rcle/contracts`, so its request/response shapes are outside every parity gate.

### 1.4 backend

`MemoryPaymentProvider` and the memory storage driver are used by unit tests and the scenario
suite; `apps/api-gateway/scenarios/` holds the end-to-end fixtures. These are test-only by design.

---

## 2. E2E and integration test map

| Harness                | Location                                                      | What it really exercises                                                                                                                                             | When it runs                            |
| ---------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Frontend Playwright    | `apps/{guest-portal,partner-dashboard,admin-console}/e2e/`    | Landing/login/a11y/CSP smoke; the full onboarding wizard — but **every backend call is `page.route`-mocked**, including Firebase identitytoolkit                     | **Push (merge) only**, never on PR      |
| Post-deploy smoke      | `C1RCLE-FRONTEND/.github/workflows/ci.yml`                    | Staging live URLs, HTTP status only (200–399)                                                                                                                        | Staging push only                       |
| Backend scenario suite | `apps/api-gateway/scenarios/business-flows.test.ts`           | Full `buildApp()` over the real `/api/v2` wire contract + plugins + memory driver; two complete journeys (payment webhook → ledger settlement, FSM, scanner session) | **main branch only** (`test:scenarios`) |
| Contract parity        | `C1RCLE-BACKEND/scripts/contract-parity.mjs`                  | Behavioural FE↔BE schema parity (186 checks); parses the same fixtures with both schema sets                                                                         | PR (`contract-parity` job)              |
| Backend unit tests     | `apps/api-gateway/**/*.test.ts`, `packages/core/**/*.test.ts` | Route/service behaviour in-process                                                                                                                                   | PR                                      |

**The central gap:** there is **no true end-to-end test** anywhere — no real browser driving a real
running gateway against a real datastore. The only runtime bindings between the two repositories are
(a) the shared `@c1rcle/contracts` types, (b) the static contract-parity script, and (c) a
staging-only HTTP-200 probe. Nothing catches a request the frontend sends that the backend rejects
(or vice-versa) until production or manual testing.

---

## 3. Flaws

Severity reflects production impact.

### High

**H1 — Production overview renders hard-coded fixture numbers.**
`src/app/partner/[studio]/overview/page.tsx:52-58` calls
`fixturePartnerDataSource.getVenueOverview()/getHostOverview()` with the comment _"Temporarily use
fixture data so the dashboard isn't empty during local dev"_, and there is **no environment gate**.
The real `loadOverviewData` is imported but never called, so the surrounding
`catch (OverviewLoadError)` branch is unreachable **dead code**. A "Fixture data" badge does render
(`overview/OverviewScreen.tsx:140`), which keeps it honest, but authenticated users still see fake
KPIs.
_Fix:_ either call `loadOverviewData` (the loader already exists and throws typed errors) or wrap the
fixture call behind a dev-only check.

**H2 — Two parallel dashboards; the legacy one is fixture-backed and still deployed.**
`/venue/*`, `/host/*`, `/promoter/*`, `/partner-network/*` have their own layouts,
`DashboardAuthProvider`, and `components/{venue,host,promoter}/screens`, fed by the fixture
composition root (`src/lib/partner/repositories.ts`). Nothing in the V3 app links to them, only auth
guards them (`components/partner-shell/PartnerDashboardLayout.tsx:102-112`), and they are **not
redirected** to `/partner/[studio]`. Only `venue/events/create/page.tsx:8` redirects. Direct-URL
visiting renders a second, fixture-data dashboard.
_Fix:_ redirect every legacy segment to the corresponding `/partner/[studio]/...` route (or delete
the trees once the V3 surfaces cover them).

**H3 — Onboarding writes bypass the BFF.**
`src/lib/onboarding/onboarding-repository.ts`:

- `start()` → `POST /api/v2/onboarding/applications` (direct gateway, Bearer) — line 106
- `saveProgress()` → `PATCH /api/v2/onboarding/applications/:id` (direct gateway) — line 122
- `submit()` → `POST /api/v2/onboarding/applications/:id/submit` (direct gateway) — line 166
- `getMine()` → `/api/bff/onboarding/me` (BFF cookie) — line 88
- `uploadDocument()` → `/api/bff/onboarding/applications/:id/documents/upload` (BFF) — line 149

The BFF wrappers `src/app/api/bff/onboarding/applications/route.ts`, `/[id]/route.ts`,
`/[id]/submit/route.ts` **exist and are unit-tested but are dead code** — no client references them.
The inconsistency (reads/uploads via cookie, writes via minted Bearer) contradicts the stated BFF
design, and the e2e suite documents it as a KNOWN ISSUE with the URL-contract assertions left
commented out (`e2e/onboarding.spec.ts:611-615`).
_Fix:_ point `start`/`saveProgress`/`submit` at the existing BFF routes, then re-enable the commented
assertions in `onboarding.spec.ts` as the regression net.

**H4 — Most fixture screens carry no fixture disclosure.**
Only `OverviewScreen` reads `dataStatus` to render a badge. Sales, guests, door, marketing, the
events list, and every promoter screen display fixture numbers with no label, so demo data is
indistinguishable from real data.
_Fix:_ extract a shared `<FixtureBadge dataStatus=... />` and render it on every fixture-backed
screen.

### Medium

**M1 — Shell chrome is fixture-only.** `[studio]/layout.tsx:19` feeds navigation, notifications, and
search from `getPartnerShellInteractions`; there is no API path yet. Acceptable temporarily, but it
means the shell has no live representation.

**M2 — Guest-portal `/profile` is fixture-only.** `app/profile/page.tsx:60-79` reads `profileFixture`
directly with no fetch; the real user profile is unwired.
_Resolved:_ `/profile` now keeps the server-side session gate and hands the session user to a new
`ProfileClient`, which reads `GET /api/profile/me` (BFF proxy of the gateway's `/api/v2/profile/me`,
404 = "no profile saved yet") plus `GET /api/wallet/tickets`, resolves each entitlement's event and
venue through the public read APIs, and maps both through `features/profile/profile-view-model.ts`.
`profileFixture.ts` is deleted. Phone, Instagram, gender and sign-in method have no endpoint yet, so
those identity fields are optional and their rows are omitted rather than filled with demo values.

**M3 — Scanner contract drift is unguarded.** `scanner-app/src/api/schemas.ts` duplicates the wire
shapes, so contract-parity cannot catch drift such as the E2 `POST /door/check-ins/verify` vs
`/confirm` naming mismatch.
_Resolved:_ `scanner-app/src/api/schemas.ts` is an adapter over `@c1rcle/contracts`, and
`contract-parity.mjs` now covers the scanner client (226 checks clean).

**M4 — Backend "not yet" surfaces.** Analytics marks values projection-only
(`analytics-service.ts:153`); `door-stats-service.ts:26` (_"registered on the app, which it isn't —
polling only for now"_); door composite indexes not yet created (`door-ops-service.ts:546`);
in-memory door filtering (`door-service.ts:377`, the D4 tracked gap); `/tickets/:ticketId/qr`
uncalled by the guest portal.
_Resolved:_ three of the five are closed.

- **QR is live.** `app/api/tickets/[ticketId]/qr/route.ts` proxies the holder-scoped
  `GET /api/v2/tickets/:ticketId/qr` (cookie auth, `cache-control: no-store`), and
  `features/tickets/components/TicketDetailModal.tsx` renders `qrPayload` as a real scannable
  `QRCodeSVG` (new dep `qrcode.react`), auto-refreshing on the endpoint's `refreshIntervalSec`
  (30s) with loading/failed/retry states, and showing no entry code for used/cancelled/pending
  tickets. The fabricated `qrPayload` is gone from `tickets.types.ts`, `wallet-mapping.ts` and the
  tickets fixture.
- **The analytics read model is actually projected now.** Backend
  `analytics-projection.ts` ships `createAnalyticsProjectionConsumer` (subscribed to
  `event.created|updated|published|cancelled` alongside the audit and notification consumers) and
  `refreshAnalyticsReadModel` — a full sweep the gateway runs every 5 min (Firestore driver only,
  `app.ts`) and that doubles as `pnpm --filter api-gateway backfill:analytics`. It exists because
  revenue and check-ins move on order/scan writes that emit **no** domain event, so an
  event-driven projection alone would freeze those numbers. The read path keeps its
  compute-on-request fallback for rows that do not exist yet; both paths call the same `compute*`,
  so a projected row and a fallback answer agree by construction. `AnalyticsReadModelRepository`
  gained `saveOrganizationOverview`/`saveEventAnalytics`, implemented in both the memory and
  Firestore adapters. The projection-only numbers (`views`, `guestlistSignups`,
  `conversionRate`) are unchanged: they still have no source aggregate, so both paths write zero.
- **Stale comment fixed.** `door-stats-service.ts` now describes `GET /door/stats/stream` (SSE,
  which shipped) instead of a `@fastify/websocket` path that was removed.

Still open inside M4, on purpose: `door-ops-service.ts:546` (composite indexes are unverified, so
the gate/device/hour report stays deferred) and `door-service.ts:377` (in-memory filtering is the
D4 gap — the fix is server-side paging, not indexes).

**M5 — E2E cadence.** Playwright never runs on PRs (only after merge), and the post-deploy probe
asserts nothing beyond an HTTP status on staging.

### Low / hygiene

- `scanner-app` is excluded from the e2e matrix (acknowledged: no native E2E tool in-repo yet).
- Legacy component trees link only among themselves (`components/host/*`, `components/venue/*`),
  which keeps the orphaned surfaces internally navigable.

---

## 4. What is genuinely solid

Recorded so the picture is not lopsided; these patterns should be held up as the standard.

- **Fail-fast configuration.** The backend refuses to boot when misconfigured, and CI asserts it.
- **"Nothing is invented."** `loadFinanceData` / `loadOverviewData` **throw** rather than degrade to
  fixtures, and the routes render typed failure states. Guest-portal `readPublic` returns `null` on
  error (`lib/seo/public-data.ts:20-27`). Eligibility gates return `false` rather than inferring
  (`isEligiblePublicVenue/Host`).
- **IDOR-safe guest surfaces.** `/confirmation/[id]` and order reads are buyer-scoped,
  cookie-authenticated, and 404 (never 403) for strangers (`app/confirmation/[id]/page.tsx:44-61`).
- **Honest hybrids.** `/checkout`, `/confirmation`, `/tickets` render fixture _previews_ through the
  exact same views as real data, so fixtures never fork the UI.
- **Live paths that already exist:** auth/OTP, the org access matrix, the slot-request gateway,
  calendar/availability, the event publish pipeline, finance, partnerships/promoter connections, and
  staff.

---

## 5. Suggested remediation order

1. Gate or wire the overview loader (H1).
2. Redirect/retire the legacy fixture trees (H2).
3. Route onboarding start/save/submit through the existing BFF wrappers and re-enable the e2e URL
   assertions (H3).
4. Add a shared fixture-disclosure badge to all fixture screens (H4).
5. Move scanner-app onto `@c1rcle/contracts` and extend parity coverage to it (M3).
6. Add a smoke-level cross-repo integration test (browser → gateway → memory driver) to close the
   true-e2e gap.

---

## Appendix — method

Static review of the four frontend apps and the backend gateway/core/contracts, plus the CI
workflows (`.github/workflows/ci.yml` in both repositories) and the test suites. Every claim above
cites a file path and, where useful, a line number. Fixture-vs-live classification was done by
following imports from each `page.tsx`/route handler to its data source.
