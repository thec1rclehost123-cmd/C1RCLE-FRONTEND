# C1RCLE Partner Dashboard — Launch-Readiness Audit

- **Date:** 2026-11-17 (IST morning)
- **Mode:** AUDIT ONLY. No product code edited, no PR, no deploy, no payments/payouts, no KYC/bank changes, no shared-data mutation (see "Mutations performed").
- **Auditor:** Claude (independent), using the three authorized synthetic staging Partner accounts (Test Host / Test Venue / Test Promoter). Credentials are intentionally absent from this document.

---

## 0. Build under test and its limits

| Item | Value | Evidence |
|---|---|---|
| Frontend repo / branch / SHA | `c1rcle-frontend` · `staging` · `0c7d5f75` (PR #123, "venue event organization names") | SOURCE VERIFIED (`git ls-remote`, local HEAD equals `staging`) |
| Backend repo / branch / SHA | `c1rcle-backend` · `staging` · `7c181a07` (PR #192, "recovered public contracts") | SOURCE VERIFIED |
| Partner staging | `staging.thec1rcle.com` (Vercel, region iad1) | HOSTED VERIFIED |
| Backend | `circle-v2-backend.onrender.com` (Render, nginx → Fastify gateway), discovered from the app's CSP `connect-src` and BFF config | HOSTED VERIFIED |
| Guest staging | `guest.thec1rcle.com` is behind Vercel SSO (302) from this container | ENVIRONMENT BLOCKED — Guest side verified through the backend **public API** only |
| **Deployed SHA == branch HEAD?** | **Cannot be established.** Neither service exposes a build/version endpoint (`/api/v2/internal/health` returns only `{ok, uptimeMs}`; `/internal/version` 404). Behaviour is *consistent with* PR #123 (Venue detail shows "Hosted by Test Host"), but that is behavioural, not provenance. | LIMITATION |

Access note: this container's network policy initially blocked `staging.thec1rcle.com` (proxy 403). I requested, and the user's Default environment approved, adding that single host so hosted testing could happen.

### Mutations performed
Only logins/logouts (session creation/revocation for the shared QA accounts) and read-only GETs. **No** event, ticket, partnership, KYC, finance or settings writes. The Host session was deliberately logged out once (session-semantics test). Local scratch cookies/tokens were deleted at the end. No synthetic data was created, so nothing needs restoring.

### Retractions (false positives I raised and withdrew)
1. "Venue sees zero slot requests" — I called the **Host** list endpoint (`/organizations/{id}/slot-requests`). The Venue list is `/venues/{venueId}/slot-requests` and returns all 7. Not a defect.
2. "Host session randomly dies / refresh breaks concurrent tabs" — caused by my harness replaying an already-rotated refresh cookie, and later by me logging Host out. Deliberate concurrent-tab and reload tests passed. Not a defect.
3. First Host perf pass (redirected to login) — invalid for the same reason; re-run after re-authentication.
4. Unit-test run with 142 failures — unbuilt workspace packages in my sandbox. After building them the suite passed (below). Not a product signal.

---

## 1. Executive verdict

**Not ready to hand to real Hosts, Venues and Promoters.**

What is genuinely good: tenant isolation and backend authorization are strong; auth/session/logout/deep-link behavior is correct; CSP/HSTS/CORS are well configured; the shared event workspace foundation is polished; the Partner unit suite is healthy (205 files / 1,127 tests green); there are no page-level horizontal overflows at 320–430 px.

What blocks launch:
1. **The Venue Studio is ownership-centric, not venue-centric.** A Venue operator with six upcoming Host events at their physical venue (one with a real paid sale) is told *"Create your first event to see it here — No upcoming events — 0 tickets sold"*. Venue analytics, marketing audience and event sales are likewise blind to those events.
2. **Money numbers contradict each other** for the Host: "Money made ₹708", ledger revenue ₹650, earned ₹552.50, Analytics "Net revenue ₹0", org-level analytics "0 tickets / ₹0".
3. **Onboarding-resume API returns 500** for every role (`GET /onboarding/me?requestedType=…`), breaking the Promoter agreement page and very likely applicant wizard resume.
4. **Door Mode is only a launcher** (manage scanner codes / start scanner shift). No attendee list, guest search, manual check-in or live counts exist in the Partner UI.

Counts below are for *active* findings only; planned expansions and experience-quality items are registered separately and not scored as bugs.

---

## 2. Finding ledger

Legend — **Class:** CB = CURRENT BUG · LB = LAUNCH BLOCKER · UX = CURRENT UX DEFECT · MRC = MISSING REQUIRED CAPABILITY · EQ = EXPERIENCE QUALITY ITEM (PLANNED PRODUCT EXPANSION items live in §11, not here).
**Evidence:** HV = HOSTED VERIFIED · SV = SOURCE VERIFIED · AT = AUTOMATED TEST VERIFIED · HYP = HYPOTHESIS.

### P0 — none found
No security breach, cross-tenant exposure, financial corruption or destructive authorization failure was demonstrated. (See §6; the sweep was GET-only, writes are source-reviewed.)

### P1 — launch blockers (6)

**PARTNER-001 · P1 · LB / CB · Venue · Overview — Host-owned events at the Venue are invisible**
- Repro: sign in as Test Venue → `/partner/venue/overview`.
- Expected: top upcoming card, Upcoming Events, calendar and performance reflect Host events at this Venue (e.g. "QA HOST SLOT 01 — Hosted by Test Host").
- Actual: "Create your first event to see it here / No upcoming events / 0 tickets sold"; Recent orders empty; chart flat at 0.
- Evidence: HV (screenshot + network). The page requests `/organizations/{venueOrg}/events?limit=100` (ownership-scoped, returns 0). The correct reader `/organizations/{venueOrg}/venue-events` returns 7 Host events (HV, same token).
- Layer: frontend data wiring. Root cause (SV): `lib/events/load-partner-events.ts` uses `venue-events` only for the Events list; `lib/overview/*` and the calendar overview use the owned-events endpoint. Only the event-detail loader (`load-venue-event-detail.ts`) uses `venue-events/:id`.
- Impact: the central Venue requirement (visibility ≠ ownership) is unmet on the first screen a Venue sees. Empty-state copy actively tells the operator to create an event they cannot own.

**PARTNER-002 · P1 · LB / UX · Venue · Events list and calendar hide/anonymize Host events**
- `/partner/venue/events` defaults to the **Venue** ownership toggle: All 0 / Live 0 / Drafts 0 / Completed 0, "No events yet". The 5 Host events appear only after clicking **Hosts** (`?party=hosts`).
- Host-event cards show no "Hosted by", no poster, no sold count. The calendar is titled "All events this month" but a booked day (29 Nov) says only *"Reserved. Review the linked event or slot request."* — no title, Host or link. The calendar API returns 7 blocks all labelled "Host requested time" with `requestingHostId`/`slotRequestId` but no event identity. The calendar opens on yesterday (16 Nov) rather than today.
- Evidence: HV. Impact: Venue cannot answer "what is happening at my venue tonight".

**PARTNER-003 · P1 · MRC · Venue · Venue-level analytics, marketing and event workspace are blind to Host events**
- HV (API + UI): `analytics/overview` → 0 events / 0 tickets / ₹0 and `analytics/events` → empty, while the Host sees 1 sold ticket at this Venue. `marketing/audience` → 0 rows (Host sees 1). `GET /events/{id}/analytics` as Venue → 404. The Venue event workspace exposes a single **Overview** tab: no sold count, sales, crowd, promoters or revenue. The Venue ledger *does* contain a `venue_share` row (₹0, pending), so the data linkage exists.
- Impact: ownership-only filtering everywhere; the Venue cannot see attendance or sales for its own nights. Needs a product decision on exactly which Host-owned metrics a Venue may see (visibility ≠ ownership: read-only, no Host controls).

**PARTNER-004 · P1 · CB · Host · Financial figures contradict each other**
For the one real order (grand total ₹707.53 = ₹650 ticket + ₹57.53 buyer-paid fees):
| Surface | Shows |
|---|---|
| Event page headline "Money made" | **₹708** |
| Host Analytics | Gross revenue ₹708 · **Net revenue ₹0** · Tickets issued **2** (includes a free RSVP) · Paid orders 1 |
| Event analytics API | revenue 70753, tickets 1 |
| Finance (ledger) | ticket revenue ₹650, platform fee ₹97.50, **host payable ₹552.50** (pending) |
| Org analytics API `/analytics/overview` | **0 tickets, ₹0, no top events** |
- "Money made ₹708" overstates Host proceeds by ~28%; "Net revenue ₹0" contradicts "₹552.50 earned". Evidence: HV. Impact: Hosts will not trust the dashboard with real money. Also `repeatGuests: 1` on a single order (HYP: metric semantics).

**PARTNER-005 · P1 · CB · All · `GET /onboarding/me?requestedType=<venue|host|promoter>` returns 500**
- HV: gateway returns `500 server` for all three roles (3/3 reproducible, BFF passes it through). The same endpoint without the query returns 200. Promoter `/partner/promoter/agreement` shows "The agreement could not be loaded" and fires two 500s on every load.
- Root cause: HYPOTHESIS — a Firestore composite index on `v2_onboarding_requests (userId, requestedType, …)` is declared in `firestore.indexes.json` but may not be deployed to the staging project. Cannot confirm without DB access.
- Impact: applicant wizard resume (KYC path) is probably broken; agreement page broken. Provisional P1 because the new-applicant path could not be exercised (HUMAN BLOCKED, §14).

**PARTNER-006 · P1 · MRC · Host/Venue · Door Mode is a launcher, not an operational tool**
- HV + SV: `…/events/{id}/door` shows "Organizer scanner access — Manage scanner codes — Start scanner shift". There is no attendee list, ticket/guest search, manual check-in, duplicate/invalid handling, live counts or admission source in the Partner UI. Host `/partner/host/door` is "Route not found". Page loads in ~7.8 s on desktop.
- The backend scanner is strong (§9) but its operator surface is the separate Scanner app. Classified per the brief: **DOOR MODE — CURRENT DEFECT** (no usable Partner door surface) and **REQUIRED PRODUCT EXPANSION** (§11).

### P2 — fix before public launch (12)

**PARTNER-007 · P2 · CB (security-adjacent) · Venue API returns Host DRAFT events**
`GET /organizations/{venueOrg}/venue-events` includes two Host drafts (title, summary, poster). The detail route correctly rejects `draft|review|scheduled` with 404 (SV `getForVenueOrganization`), so list and detail disagree. The UI filters them out, so exposure is API-level. HV + SV. Unsubmitted drafts should not leave the Host tenant.

**PARTNER-008 · P2 · CB (data/config) · `http://localhost:3001/...` poster URLs on published events**
4 of 7 Host events (all published QA events) carry a `localhost:3001` poster. The Partner CSP (`img-src … https:`) blocks it (console error on Overview/Events), so Host/Venue cards render with no poster; the public API nulls them so Guests also see none. Backend now blocks *new* localhost posters (SV `assertGuestReachablePosterUrl`) but legacy rows remain. HV.

**PARTNER-009 · P2 · CB · Expired session on event routes shows a dead-end generic error**
With a revoked session, `/partner/host/overview` correctly redirects to login, but `/partner/host/events/{id}` and sub-routes render "Something went wrong · Try again" with no sign-in path (Try again loops). HV. An auth failure is presented as a generic crash.

**PARTNER-010 · P2 · CB · Host Waitlist tab calls a V1-disabled endpoint**
Backend intentionally answers every waitlist route with `410 "Waitlists are not available in V1"` (SV). The Host tab still renders live controls ("Offer next guest", "Offers expire after 10 minutes") plus **"Request failed with status 410."** and "No guests are waiting for this tier." together. HV.

**PARTNER-011 · P2 · UX · Internal jargon and dead routes in user-facing copy**
Examples (HV): "Choose an event to view its tenant-scoped attendee roster. Guest names stay on the event-specific endpoint…"; "Updates for this organization, loaded from the C1RCLE backend"; "Settlement eligibility unavailable: Settlement eligibility requires the controlled journal transition."; "Route not found. This route is not part of the Partner V3 foundation yet." (Host `/door`, `/links`, `/agreement`; Promoter `/support`, `/door`; a Venue draft event); "Venue details unavailable" on all 54 Promoter public listings; HTTP 200 for unknown routes.

**PARTNER-012 · P2 · CB · "Starting price ₹800" vs active Early Bird ₹650**
Partner headers (Host and Venue) and the public event summary `startingPricePaise` show ₹800 while the public tiers API sells General Entry at ₹650 (Early Bird 16–23 Nov, today 17 Nov, 79/80 left). Cross-role contradiction (also affects Guest list "from" price). HV.

**PARTNER-013 · P2 · MRC · Venue receives no notifications**
Venue inbox: 0 items despite 7 accepted slot requests and 5 Host events published at the venue. Host has 6, Promoter 3. HV (API + UI). Phase-27 expectation: Venue is told about requests, acceptances, publications, cancellations.

**PARTNER-014 · P2 · UX · Promoter Settings is a dead end for the Owner**
Promoter nav lists **Settings**; clicking shows "Settings isn't available for your role… Ask an owner or admin" although the user *is* the owner (`tabVisibility.settings=false`). Promoter `/support` route is "not found". HV.

**PARTNER-015 · P2 · Performance** — see §7. LCP 3.7–7.9 s, a serial client bootstrap waterfall on every navigation (duplicate `access` ×2, `auth/session`, `auth/refresh`, `organizations`, `onboarding/me` ≈ 3–6 s before content), and backend list endpoints that scan up to 1,000 orders per owner (SV).

**PARTNER-016 · P2 · UX/Mobile · Tap targets**
Header icon buttons are 20–36 px wide (search 22×40, calendar 20×36 at 320 px); Event Create step controls 29×29; Promoter Partners has ~60 controls under 40 px; Venue calendar ~40 at 320 px. No overflow, but not field-usable under pressure. HV.

**PARTNER-017 · P2 · MRC · Edit Event is minimal** — see §5.

**PARTNER-018 · P2 · UX · Contradictory Venue edit/draft states**
Venue `/events/{id}/edit` renders the loaded event header **and** "Event unavailable — This event does not exist…". Edit is correctly denied (good), but the message is false. A Venue deep link to a Host draft says "Route not found… Partner V3 foundation yet". HV.

### P3 — polish / maintainability (10)

- **PARTNER-019 · UX** — "LIVE" badge on an event 12 days away; Venue "Live" tab counts published, not happening-now. HV.
- **PARTNER-020 · UX/data** — Event `capacity` null ("Not set") while tiers total 100; analytics `capacity: null`, occupancy null. HV.
- **PARTNER-021 · Data hygiene** — two events titled "QA HOST SLOT 01 – Paid Entry" (draft + published); a published 14 Nov event still public-listed after it ended. HV.
- **PARTNER-022 · CB (minor)** — unknown event id renders a generic crash (React error #441 in console) with HTTP 200 rather than a not-found state. HV.
- **PARTNER-023 · Security-hardening** — `POST /api/auth/login` returns the `accessToken` in the JSON body in addition to the HttpOnly cookie (by design for the in-memory SPA token; widens XSS impact). SV + HV.
- **PARTNER-024 · Consistency** — validation (422) runs before authorization (403) on several routes; foreign-org denials differ by route (`X-Organization-Id does not match…` vs `Role "member" does not hold finance.read`). Both deny; the second reveals the role model. HV.
- **PARTNER-025 · A11y** — sidebar links show no visible focus indicator (`outline: none`, no shadow) in the sampled state; Promoter overview has two `<main>` landmarks; Event Create has no skip link and one heading-level skip. HV (browser-checked; screen readers not used).
- **PARTNER-026 · Privacy (policy question)** — Host finance orders list the full buyer name per order. HYP vs the "minimum necessary Guest information" principle.
- **PARTNER-027 · Permission model** — roles map to permissions by tenancy role (OWNER), not Partner type; a Promoter OWNER gets 200 on host/venue-shaped reads (`event-draft`, `venues`, `slot-requests`, `members`). Writes are blocked by service guards (e.g. venue-access check on create), not by permission class. SV + HV reads; writes HYP (not exercised).
- **PARTNER-028 · Maintainability** — see §10 (legacy route trees, ~14.5k LOC `components/venue`, 3.1k-line fixture source, 3.4k-line onboarding client).

**Totals (active findings): P0 = 0 · P1 = 6 · P2 = 12 · P3 = 10.**
(PARTNER-029/030 intentionally unused; numbering gap is a ledger artifact.)

---

## 3. Role-by-role verdict

**Host Studio — usable but financially untrustworthy.** Overview, Events (7), Create wizard, slot-request tracking, Partners, Marketing/audience, Finance, Analytics, Support and Notifications all load and are tenant-correct. Event workspace (Summary / Analytics / Revenue / Crowd / Live compare, Postpone/Cancel, Door Mode, Edit) is the strongest surface. Blockers: contradictory money figures (004), Door launcher only (006), expired-session dead end (009), waitlist 410 (010), jargon/dead routes (011), price mismatch (012).

**Venue Studio — not launch-ready.** The shared event workspace is good ("Hosted by Test Host", owner, tiers, Early Bird phase) and Host events are reachable via the *Hosts* toggle and direct links, and edit is correctly denied. But the first screen, calendar, analytics, marketing and notifications all behave as if the Venue owns nothing (001–003, 013, 018).

**Promoter Studio — safe but mostly unverifiable and thin.** Overview, Events, Activity, Analytics, Finance and Partners render with correct zeros and clear "privacy-safe" framing; tenant isolation holds. No event assignment, link, click or commission exists in staging, so attribution/commission cannot be proven hosted (ENVIRONMENT/HUMAN BLOCKED). Defects: agreement page 500 (005), Settings dead end (014), Support/Door not found, "Venue details unavailable" ×54, no guestlist capability (§11).

---

## 4. Workflow matrix

| Workflow | Host | Venue | Promoter | Evidence |
|---|---|---|---|---|
| Login (role picker → credentials) | Pass (~8–9 s to first overview, 2.5 s auth call) | Pass | Pass | HV |
| Logout / cookie clear / revisit | Pass (1.2 s) | — | — | HV |
| Deep link while logged out → `?next=` | Pass | Pass | Pass | HV |
| Concurrent tabs / reload | Pass | — | — | HV |
| Wrong-role studio route | n/a | "Studio not available for this account" (Pass) | Pass | HV |
| Expired/revoked session on event routes | **Fail (009)** | — | — | HV |
| Overview accuracy | Mostly OK; figures contradict (004) | **Fail (001)** | OK (zeros) | HV |
| Event list | Pass (7 incl. drafts) | **Fail by default (002)** | Public discovery only | HV |
| Create event | View-only (7 steps) | n/a | n/a | SV + AT |
| Host → Venue submit → accept/reject | n/a | No pending data; 7 accepted | n/a | SV + existing acceptance docs |
| Event workspace | Pass | Partial (Overview only) | n/a | HV |
| Edit event | Limited (§5) | Correctly denied (confusing copy) | n/a | HV + SV |
| Door Mode | Launcher only (006) | Launcher only | Not found | HV |
| Waitlist | **Fail (010)** | — | — | HV |
| Finance read | Contradictory (004) | OK/empty | OK/empty | HV |
| Promoter links/attribution/commission | n/a | n/a | No data | ENV BLOCKED |
| Partnerships | 1 active venue link, Promoter 2 active | 1 | 2 | HV (read) |
| Notifications | 6 | **0 (013)** | 3 | HV |
| Onboarding resume (`requestedType`) | **500 (005)** | 500 | 500 | HV |

---

## 5. Event-lifecycle findings

### EDIT EVENT — CURRENT STATE
- Host edit screen (SV `ConnectedEventEditScreen`): title, summary, description; schedule start (Host, accepted-slot constrained); per-tier **quantity and price** (positive paid tiers only); resubmit for rejected external venue. The event page also offers **Postpone event** and **Cancel event** (lifecycle actions). Not editable here: poster, venue, end time, tags/entry rules, visibility, promoters, tier creation. No material-change warning, refund preview, or guest-notification preview was observed in source or UI.
- Venue: `/edit` is denied (correct) with a misleading message (018).
- Mobile: not usable evidence for edit (view only).

### EDIT EVENT — REQUIRED FUTURE CAPABILITY (not designed here)
A polished Edit Event integrated into the Event Workspace, with: draft vs live differences; material-change classification (Venue change = material; date/time; price/capacity); refund-right and notification impact preview; poster/media edit; promoter changes; postponement (freeze sales/transfers, disable QRs) and cancellation flows with clear Host liability messaging; Venue-visible change notices; mobile layout.

---

## 6. Security / tenant-isolation matrix

HV sweep: for each ordered pair of the three roles, every org-scoped GET endpoint (24 per pair: events, venue-events, venues, slot-requests, members, invitations, event-draft, partnerships, promoter-connections, 5 analytics, marketing, 3 finance, payouts, bank-accounts, disputes, notifications, search, settings) was called against the *other* org's path with matching `X-Organization-Id`.

| Caller → Target | Result |
|---|---|
| Host → Venue / Promoter | 403 on all data endpoints (a few 422/404 are validation/route-shape, not data) |
| Venue → Host / Promoter | 403 on all |
| Promoter → Host / Venue | 403 on all |

Additional checks (HV): foreign event id on `/events/{id}`, `/ticket-tiers`, `/analytics`, `/referral-links`, `/promoter-assignments`, `/promo-codes` as Venue and Promoter → 404 (no existence oracle). Host calling Venue-only `venue-events` → 403. Venue edit of Host event denied in UI. Frontend: cross-studio routes render "Studio is not available for this account" (UX guard); the real enforcement is the gateway. The edge proxy only checks cookie presence (documented as UX only) — acceptable.

Infra (HV): HSTS, `X-Frame-Options: DENY`, `nosniff`, nonce-based CSP, restrictive Permissions-Policy; session cookie HttpOnly+Secure, CSRF cookie Secure; CORS is an exact allowlist (foreign origins and `localhost` receive no `Access-Control-Allow-Origin`).

Not exercised (HYP/NOT TESTED): state-changing cross-tenant writes (source shows `fetchOwned`/`requirePathOrg` guards; validation-before-authz ordering prevented safe live probes with real IDs), KYC document download authorization, bank info, server-side revocation of the *logged-out* token, rate-limit/brute-force behaviour, admin read paths (no Admin credentials).
Findings: 007 (draft leak via Venue list), 023, 024, 027.

---

## 7. Performance report (hosted, desktop, from a cloud container ≈ 0.8 s per gateway call)

| Route | TTFB | FCP | LCP | CLS | Requests |
|---|---|---|---|---|---|
| Host overview | 1.46 s | 1.97 s | 4.18 s | 0 | 74 |
| Host events | 0.94 s | 1.30 s | 5.24 s | 0 | 76 |
| Host create | 0.86 s | 1.23 s | **7.87 s** | 0 | 51 |
| Host event workspace | 2.40 s | 3.12 s | 5.36 s | 0 | 78 |
| Host finance | 1.08 s | 1.51 s | 3.70 s | 0 | 56 |
| Host partners | 0.91 s | 1.24 s | **7.18 s** | 0 | 68 |
| Venue overview | 2.02 s | 2.33 s | 4.62 s | 0 | 63 |
| Venue events | 0.96 s | 1.32 s | 3.86 s | 0 | 58 |
| Venue slot requests | 0.93 s | 1.27 s | 4.55 s | 0.011 | 58 |
| Venue door | 0.90 s | 1.25 s | **6.12 s** | 0 | 65 |
| Promoter overview | 2.50 s | 2.83 s | **5.27 s** | 0 | 53 |
| Promoter events | 1.50 s | 1.87 s | 4.20 s | 0 | 70 |

Other measured latencies: login API 1.7–2.5 s; login → first overview 8–9.6 s; typical gateway read 0.75–1.5 s; role-toggle click → result ≈ 1.6 s.
Observations: (a) every navigation re-runs a client bootstrap — `access` ×2, `auth/session`, `auth/refresh`, `organizations`, `onboarding/me` — before content, a serial ~3–6 s waterfall with duplicate calls; (b) pages are SSR-blocked on backend latency; (c) `listForVenueOrganization` loads up to 1,000 orders per owner org for sold counts with a `salesCountComplete` flag (SV) — a scaling cliff; (d) CLS is effectively zero. No target values are imposed; baseline only. Worst by operator impact: Host Create, Host Partners, Venue Door, Host/Venue event workspace.

---

## 8. Mobile report

Representative widths 320/390/430 (Playwright touch emulation) across all three Studios (38 page checks): **no page-level horizontal overflow**; `main`, `h1`, form labels and button names present. Weaknesses: small tap targets (016), sticky/dense header on 320 px, 40-cell calendar at 320 px, Event Create step chips 29×29, Door launcher is not a field tool. Not tested: real keyboard/safe-area behaviour on devices, modal overflow on real phones, tablet width, one-handed Door use (no Door UI to test).

---

## 9. Scanner, couple/eligibility, cancellation (SOURCE + TESTS — not scanned live)

Backend `scanner-service.ts` (SV): signed QR (`invalid_signature`), per-device binding, venue-change forces a new shift, gate restriction, deny reasons `already_used|expired|wrong_event|void_ticket|event_closed|offline_expired|override_required|eligibility_required|capacity_exceeded|wrong_gate|promoter_not_authorized`, `confirmation_required` with a 30-second couple-confirmation token, couple admits two, eligibility from ticket `audienceType` (not stored profile gender), override requires a reason. Unit tests exist; backend tests were not run in this sandbox. Cancellation/postponement/waitlist V1 boundary (410) per source; live material-change/refund flows NOT TESTED (destructive).

---

## 10. Code-health findings (SV)

| Item | Class |
|---|---|
| Legacy `/venue/*`, `/host/*`, `/promoter/*` page trees (65 files) are redirected by `next.config` to `/partner/*`; ~14.5k LOC in `components/venue` (61 files) is mostly superseded (only the event-detail layouts and one hook are imported by live routes) | MAINTAINABILITY DEBT (verify before deletion) |
| `data/fixture-partner-data-source.ts` (3,151 lines) + `FixtureBadge` plumbing in live screens; "fixture" data-status types leak into production components | MAINTAINABILITY DEBT / launch-risk if a fixture path is ever reachable |
| `app/onboard/PageClient.tsx` 3,441 lines; `EventEditorParts.tsx` 2,576; `PartnerEventEditor.tsx` 1,480 | MAINTAINABILITY DEBT |
| 134 client components; client bootstrap duplicates server session work | PERFORMANCE DEBT |
| Ownership-scoped loaders reused for Venue (root of 001/003) | LAUNCH RISK |
| `venue-events` list vs detail disagree on drafts | LAUNCH RISK |
| 19 swallowed-error patterns (`catch {}` / `.catch(() => null)`) | MAINTAINABILITY (audit individually) |
| Backend 1,000-order scans per owner for counts | PERFORMANCE DEBT |
No broad refactor is recommended; only deletion of verified-dead legacy trees after import analysis.

**Automated evidence:** Partner dashboard `vitest`: **205 files passed, 1 skipped; 1,127 tests passed, 1 skipped** (local, after building workspace packages). Backend tests were not run.

---

## 11. Future Product Requirement Register (PLANNED PRODUCT EXPANSION — not bugs)

| # | Requirement | Current support | Missing (data/backend) | Missing (frontend) | AuthZ notes | Dependency | Launch-critical? |
|---|---|---|---|---|---|---|---|
| 1 | **Edit Event** polished UI | Title/summary/description/start/tier qty+price; Postpone & Cancel actions | Material-change model, refund-impact preview, change notifications | Workspace-integrated edit, mobile, previews | Host only; Venue read-only change notices | Cancellation/refund policy | **Yes (core ops)** |
| 2 | **Door Mode** operational UI | Scanner codes + sessions; strong scanner service | Aggregated attendee/guestlist read model, manual check-in, admission-source field | Search, list, live counts, exceptions, offline UX, one-hand layout | Host/Venue/staff scoped | Scanner app, controlled admission | **Yes** |
| 3 | **Promoter model** beyond links | Connections, assignments, referral links, attribution, commission foundations (preserve) | Guestlist/nomination entities, state machine, commission-on-guestlist rules | Redesigned Promoter Studio | Promoter must not edit events | Items 4–8 | Post-launch OK if link-only launch is accepted |
| 4 | **Promoter guestlists** (search guests / add by contact / status) | None | Nomination entity, guest search API (minimal fields), pending-signup identity | Search/add/status UI | Promoter sees only own nominations | Invitation flow | Product decision |
| 5 | **Curated approval** (Host review queue) | None | Review states, optional Guest-supplied profile link, audit trail; **no automated scoring** | Queue with filters (promoter, type, pending/approved/rejected) | Host-only decide; human decision log | Items 4, 6 | Product decision |
| 6 | **Controlled inventory** vs public | Tiers are public; `visibilityMode` public/code/invited exists behind feature flag `m5PrivateAccess`; access codes/invitations endpoints exist | Inventory class on tiers (promoter/host/venue guestlist, complimentary, invite-only), hidden-from-public rule | Tier-type UI, Door source labels | Public APIs must not leak controlled tiers | Entitlement model | Yes if guestlists launch |
| 7 | **Code-gated tiers** | Event-level access codes + revoke exist (flagged) | Tier-level unlock codes, price/capacity/window per unlock, rate limiting, expiry | Unlock UX (Guest) + Host config | No leakage in public list/detail/cache | Flag enablement | Post-launch candidate |
| 8 | **Code-gated events** | `visibilityMode: code` (flagged) | Brute-force limits, discovery/cache exclusion audit | Host config, share links | Direct-URL and API leak testing | Flag enablement | Post-launch candidate |
| 9 | **Invite → signup → buy/claim → QR** | `access-invitations` endpoint, email sender, ticket QR | Recipient-identity binding (exact email), expiry/reassignment/dup rules | Recipient journey, Host/Promoter status | Wrong-email protection | Items 4–6 | With guestlists |
| 10 | **Venue-centric awareness** | Backend `venue-events`, detail reader, calendar blocks, `venue_share` ledger rows | Venue-scoped analytics/audience/notification read models; define permitted Host metrics | Overview, calendar, analytics, marketing, notifications on Host-owned events | Read-only; never Host controls | Findings 001–003, 013 | **Yes — launch requirement** |

---

## 12. Experience Quality deferred backlog (EQ — do not start now)

Perceived instantness and bootstrap removal; skeleton coverage (some pages render an unlabeled skeleton at capture); optimistic feedback on save/accept; transition language and chart transitions; calendar feel and day-detail richness; Door speed/feel; Promoter workflow fluidity; visual hierarchy and spacing; copy and empty-state quality (after 011/014 are fixed functionally); poster/image loading; error-state quality (consistent not-found/forbidden/session-expired states); mobile touch quality (tap-target sizing, sticky header density); focus-ring styling; status vocabulary ("Live" vs "On sale").

---

## 13. Cross-role reconciliation — event `ee1a67db` ("C1RCLE STAGING ACCEPTANCE 001")

| Attribute | Host view | Venue view | Promoter view | Guest public (API) | Admin |
|---|---|---|---|---|---|
| Owner | Test Host | "Hosted by Test Host" ✓ | — | organizer present | NOT TESTED (no credentials) |
| Venue / date | Test Venue · 29 Nov 18:00–22:00 IST ✓ | same ✓ | not linked | same ✓ | — |
| Status | published; badge "LIVE" (019) | PUBLISHED | public listing only | published | — |
| Tiers | GE ₹800 base (Early Bird ₹650), VIP ₹1,800; 80/20 | same tiers ✓ | — | GE **₹650**, VIP ₹1,800; 79/20 left | — |
| Starting price | ₹800 | ₹800 | — | summary `80000`, tiers ₹650 ✗ (012) | — |
| Capacity | "Not set" (tiers = 100) | not shown | — | n/a | — |
| Sales | 1 sold (event page), 0 (org analytics) ✗ | **not shown / 0** ✗ | none | 79 left ✓ | — |
| Revenue | ₹708 / ₹650 / ₹552.50 / Net ₹0 ✗ (004) | none (`venue_share` ₹0 pending) | — | — | — |
| Promoter / commission | none assigned | none | no links/clicks/commission | — | — |
| Refunds | ₹0 | — | — | — | — |

Contradictions: 004, 012, 003, 020, 019. Draft-visibility mismatch: 007.

---

## 14. Human gates (what needs the user)

1. **Applicant/KYC gating (Phase 1):** needs a Partner account in *pending* and *rejected* KYC states (or authorization to create one) to verify "no operational access until KYC approved" and the `requestedType` onboarding resume (005).
2. **Promoter attribution/commission (Phases 10, 23, 26):** needs authorization to (a) assign Test Promoter to a staging event, (b) create a referral link, and (c) have a Guest QA purchase through it. I did not mutate shared data.
3. **Admin visibility (cross-role column, notifications, refunds):** needs an authorized Admin read path.
4. **Database/index verification (005, Phase 33):** needs Firestore access to confirm the `v2_onboarding_requests` composite index deployment and inspect duplicates/orphans/outbox. Currently ENVIRONMENT BLOCKED.
5. **Destructive/consequential workflows** (cancel/postpone, refund, door check-in, payouts): not performed; approval needed if live proof is wanted.
6. **Guest staging (Vercel SSO)** and **deployed-SHA provenance:** need a bypass/read-only deployment record to prove which build is live.

---

## 15. Phase 0–40 completeness matrix

| Phase | Status | Evidence | Remaining blocker |
|---|---|---|---|
| 0 Surface map | FULLY EXECUTED | Route trees + nav config + redirects + gateway manifest; ~75 Partner routes, canonical `/partner/{studio}/*` | — |
| 1 Auth/onboarding/roles | HUMAN BLOCKED | Login/logout/refresh/new-tab/deep-link/wrong-studio/cross-role route executed (HV) | KYC pending/rejected states; applicant flow |
| 2 Host overview | FULLY EXECUTED | HV + API reconciliation | — |
| 3 Venue overview | FULLY EXECUTED | HV (001/002) | — |
| 4 Event creation | SOURCE + TESTS ONLY | Wizard viewed (7 steps), editor tests green; no shared event created | Authorization to create synthetic event |
| 5 Host→Venue submission | SOURCE + TESTS ONLY | 7 accepted requests observed; service guards read; no pending request to act on | Pending request + authorization |
| 6 Event workspace | FULLY EXECUTED | HV Host + Venue | — |
| 7 Edit Event | FULLY EXECUTED | Current state documented (read-only) | — |
| 8 Slot requests | SOURCE + TESTS ONLY | No pending/rejected data | Data |
| 9 Partnerships | SOURCE + TESTS ONLY | Read-only lists; no mutations | Authorization |
| 10 Promoter current | FULLY EXECUTED | All surfaces visited (read-only) | Data for links/commission |
| 11 Promoter future gap | DEFERRED PRODUCT EXPANSION | §11 rows 3–4 | — |
| 12 Curated admission | DEFERRED PRODUCT EXPANSION | §11 row 5 | — |
| 13 Controlled inventory | DEFERRED PRODUCT EXPANSION | §11 row 6 | — |
| 14 Code-gated access | DEFERRED PRODUCT EXPANSION | §11 rows 7–8 | — |
| 15 Invite→entitlement | DEFERRED PRODUCT EXPANSION | §11 row 9 | — |
| 16 Door current | SOURCE + TESTS ONLY | Launcher HV; backend services read | No scan/offline live test |
| 17 Door future | DEFERRED PRODUCT EXPANSION | §11 row 2 | — |
| 18 Scanner | SOURCE + TESTS ONLY | §9 | Live scan authorization |
| 19 Attendee ops | SOURCE + TESTS ONLY | Audience/guests pages viewed | Exports/communications not exercised |
| 20 Couple/eligibility | SOURCE + TESTS ONLY | §9 | Live purchase/scan |
| 21 Cancel/postpone/material change | SOURCE + TESTS ONLY | Controls observed, not clicked | Destructive |
| 22 Waitlist | SOURCE + TESTS ONLY | V1 410 verified HV (010) | Feature intentionally off |
| 23 Marketing | SOURCE + TESTS ONLY | Audience pages HV; no links/UTMs found | Data |
| 24 Analytics | FULLY EXECUTED | HV reconciliation (004) | — |
| 25 Finance | FULLY EXECUTED | Read-only HV | — |
| 26 Promoter commission | SOURCE + TESTS ONLY | Zero data hosted | Gate 2 |
| 27 Notifications | SOURCE + TESTS ONLY | In-app HV; email not observable | Email inbox/Admin |
| 28 Performance | FULLY EXECUTED | §7 | — |
| 29 Mobile | FULLY EXECUTED | §8 (emulation, not devices) | Real devices |
| 30 Accessibility | FULLY EXECUTED | Browser-verified only; **SCREEN READER NOT VERIFIED** | AT testing |
| 31 Failure injection | SOURCE + TESTS ONLY | Expired session, 410, 500, not-found observed | Offline/429/timeout injection not run |
| 32 Security/tenancy | FULLY EXECUTED | §6 (GET sweep); writes by source | Write probes |
| 33 DB/data integrity | ENVIRONMENT BLOCKED | API only | DB access |
| 34 Storage/media | SOURCE + TESTS ONLY | localhost posters HV; signed-URL usage in source | KYC file access test |
| 35 Code health | SOURCE + TESTS ONLY | §10 | — |
| 36 Observability | SOURCE + TESTS ONLY | `requestId` on every error body; `X-Request-Id` header exposed; no end-to-end trace executed | Log access |
| 37 Workflow efficiency | SOURCE + TESTS ONLY | Login = role pick + Continue + 2 fields + submit, 8–9 s; Create = 7 steps; Venue→Host events = 2 clicks via hidden toggle | Timed operator study |
| 38 Visual baseline | FULLY EXECUTED | Findings 008, 011, 018 | — |
| 39 Future requirement register | FULLY EXECUTED | §11 | — |
| 40 Experience-quality backlog | DEFERRED EXPERIENCE QUALITY | §12 | — |

---

## 16. Scorecard (0–100, not inflated for volume of tests)

| Area | Score | Area | Score |
|---|---|---|---|
| Functional correctness | 52 | Mobile | 62 |
| Host Studio | 66 | Performance | 48 |
| Venue Studio | 38 | Reliability | 58 |
| Promoter Studio | 50 | Security/authorization | 84 |
| Auth/KYC | 62 (gating untested) | Data integrity | 45 |
| Event creation | 70 (view/source only) | Accessibility | 68 |
| Publishing | 72 (acceptance docs + data) | Observability | 60 |
| Event workspace | 70 | Visual launch polish | 55 |
| Partnerships | 66 | | |
| Promoter attribution | 40 (unverified) | | |
| Door Mode | 25 | | |
| Scanner integration | 70 (source only) | | |
| Finance | 45 | | |
| Analytics | 35 | | |

---

## 17. Final result

**PARTNER DASHBOARD AUDIT COMPLETE**

P0: 0
P1: 6
P2: 12
P3: 10

`HOST STUDIO — 66/100`
`VENUE STUDIO — 38/100`
`PROMOTER STUDIO — 50/100`
`PARTNER DASHBOARD LAUNCH READINESS — 52/100`
`PARTNER DASHBOARD LAUNCH READY — NO`

`READY FOR PARTNER REMEDIATION PLANNING — YES`
