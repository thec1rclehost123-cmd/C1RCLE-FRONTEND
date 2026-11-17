# C1RCLE Guest Portal — Comprehensive Remediation Plan

Status: **PLANNING ONLY. Nothing in this document has been implemented.** Revision 2 (2026-11-17): owner decisions H2–H7 recorded (see *Decision log*).
Source of truth: `docs/acceptance/GUEST_PORTAL_LAUNCH_AUDIT_2026-11-16.md` @ `802d9a4` (frozen).
Audit state carried forward: readiness **62/100**, launch ready **NO**.

> **Milestone structure superseded:** the six-milestone layout in §C/§D is replaced by the five equally scoped milestones in `GUEST_PORTAL_LAUNCH_PLAN_5_MILESTONES_2026-11-17.md`. Classification, Decision log, registers, Codex contract and risks in this document remain authoritative.

```
AUDIT LOADED — YES
FINDINGS RECONCILED — YES
Active findings: P0 0 · P1 4 (+1 conditional) · P2 19 · P3 26   (= 50 active IDs)
```

Reconciliation notes (what this plan treats as authoritative):
- GUEST-001 is **downgraded to P3 residual** (localhost posters fixed on current staging, 0/54; residual = 2 events with 403 `vercel.app` posters + 47/54 events without posters).
- **Retracted, not planned:** GUEST-029 (refund emails exist), the tickets-page CORS finding (test-harness artifact), the "wrong Host route" part of GUEST-038, and every Phase 15/27 artifact (dead Settings back link, inert `/app` jump buttons, inert Help Refresh, Maps `noopener`, date-input "trap", drawer "no dialog role").
- Unused IDs (036, 037, 047, 055) do not exist. GUEST-047 was merged into GUEST-038.
- Deployed SHAs were never exposed. Where the audit records **deployment drift** (GUEST-001, end time on event page) the plan uses the *latest live* observation.
- Evidence kinds are kept separate below: **[H]** = observed on hosted staging, **[S]** = source/tests only, **[H+S]**.

---

## Decision log (owner decisions, authoritative — supersede earlier "needs decision" wording)

| Ref | Decision (owner, 2026-11-17) | Effect on the plan |
|---|---|---|
| **H4** | Online sales remain allowed after event start and **close at the event's effective end time**. `started` events remain sellable. At `now >= effectiveEndAt`, **no new quote / hold / payment-attempt / RSVP / waitlist / access-code entitlement** may be created. A **valid hold created before cutoff may complete within its existing TTL**. Events without `endAt` use the existing fallback **start + 6 hours**. | M1 rule is now fully specified (see M1 L1–L3). **Unblocks M1.** |
| **H5** | Approved to **prepare** a staging cleanup candidate list + migration. **Do not execute without the owner's explicit record-level approval.** | M4 delivers a reviewable candidate list and a dry-run-default migration script only; execution is a separate owner-gated step. |
| **H6** | Support-mediated account-deletion request is acceptable for V1. | M6 builds that entry (no automated erasure). No further decision gate. |
| **H7** | Firebase test-phone bypass approved for **staging only, never production**. | M2: staging env setting (human) + code/config guard so the bypass can never activate in production. |
| **H2** | Final production fee percentages remain a **human business decision**; **do not invent them**. | M2/M3 may not choose rates. **GUEST-004 (P1) stays OPEN / STILL EXTERNALLY BLOCKED until the owner supplies the approved policy**; code work is policy-driven and fail-closed only. |
| **H3** | `guest.thec1rcle.com` is the **authoritative Guest application domain for this remediation**; final production root-domain cutover is a **later release decision**. | M2 configures trusted origins/CORS/Google redirect for `guest.thec1rcle.com` only. GUEST-005 (conditional) moves to the **launch-cutover gate** (§F/§J), not M1–M6. |

Still open for the owner: **H2** (approved fee policy), **H1/H1b** (Google console + Render env values), **H7 setting** (apply env var on the staging build), **H8** (rotate Vercel bypass token), **H9** (observability tool/DSN, needed only for M4 hosted error capture). None of these block M1.

---

## A. Executive remediation strategy

The 50 findings collapse into **eleven root causes**. Most are not "bugs in a page"; they are missing contracts between layers.

| # | Root cause | Findings |
|---|---|---|
| RC1 | **Sale eligibility is a status flag, not a time-aware authoritative rule.** `assertOnSale` only checks `status === 'published'`; nothing advances ended events. | 040 (P1), 011, 039, part of 038/043 |
| RC2 | **Server-side code forwards the browser's raw cookie** instead of using the one cookie-translation helper the BFF uses. Same session layer also has weak cookie/CSP/cache posture and over-shares PII. | 003 (P1), 007, 008(PII) |
| RC3 | **Staging auth/commercial configuration is incomplete or non-production** (trusted origins, Google vars, fee policy, launch-domain protection, Firebase test-phone). | 002, 004, 005 (P1/cond.), 045 |
| RC4 | **Denormalized/duplicated price truth** (stored `startingPricePaise`, 8 formatters). | 030, 014 |
| RC5 | **Checkout UI collapses all server outcomes into two messages and re-derives limits client-side.** | 025, 031, 009, 048, 010(refund policy part) |
| RC6 | **Public directory/event reads treat timeouts and missing entities identically** (5s SSR timeout → "off the circuit", HTTP 200), plus stale/test data in the public feed. | 038, 043, 011, 001r, 039 |
| RC7 | **Serial auth/onboarding waterfall + heavy no-store SSR + decorative payloads.** | 008(waterfall), 012, 026, 022, 054, 016 |
| RC8 | **No frontend error capture / request correlation.** | 013, 020 |
| RC9 | **Mobile/a11y primitives never hardened** (input font sizes, target sizes, dialogs, contrast, landmarks). | 024, 034, 049, 050, 051, 052, 053 |
| RC10 | **Onboarding phone entry is raw E.164 text.** | 032 |
| RC11 | **Unbuilt/undecided surfaces** (account deletion, notification prefs, Wallet/Orders naming). | 006, 023 |

**Architecture of the plan.** Six fixed milestones, ordered by *blast radius if wrong* then dependency: first make it impossible to sell invalid things and close the security/session gaps (M1); then unblock sign-in and commercial configuration, which are mostly human/provider work with small code (M2); then make pricing and checkout truthful (M3); then make public data and failure states trustworthy (M4); then performance (M5); then launch-quality mobile/accessibility and the minimal account/settings policy items (M6). A **parallel human/config track (H)** starts on day one because its lead time (Google console, fee-policy decision, domain decision) is longer than the code.

**Hard principles.** Backend stays authoritative; no UI patch may weaken a server rule. Fix causes, not symptoms (e.g. finished events are fixed in core and public reads, then the button state follows). One bounded milestone at a time. Design/animation/skeleton/visual-hierarchy work is **out of scope** (reserved for the Experience Quality Pass, Phases 17/33).

---

## B. Frozen finding classification

A = launch correctness blocker · B = launch quality requirement · C = experience/polish (defer to Quality Pass) · D = data/config/ops/human decision · E = deferred acceptance.
"M" = milestone that owns it. **Only A, B and D items are scheduled for engineering/ops now.** C items are parked; E items live in the Deferred Acceptance Register (§F).

| ID | Sev | Title (short) | Evid. | Class | M |
|---|---|---|---|---|---|
| 002 | P1 | Google sign-in broken (trusted origin + provider unset) | H+S | **D** | H/M2 |
| 003 | P1 | `/profile/saved` always errors (SSR raw cookie → gateway 401) | H+S | **A** | M1 |
| 004 | P1 | Non-production test fee policy shown to Guests | H+S | **D** (+small code) | H/M2 |
| 040 | P1 | Finished events still purchasable (quote confirmed; hold/Pay unverified) | H+S | **A** | M1 |
| 005 | P1-cond. | Vercel SSO on `guest.thec1rcle.com`; CORS/trusted lacks `thec1rcle.com` | H | **D** | H/M2 |
| 006 | P2 | Missing Wallet/Orders/Settings/Notifications surfaces | H+S | **B** (scope-limited, see M6) | M6 |
| 007 | P2 | Cookie `Secure=false`, no CSP, `/api/auth/session` `public`, token in JS memory | H+S | **A** | M1 |
| 008 | P2 | Auth waterfall + PII over-fetch | H | **B** (PII part is security → M1) | M1/M5 |
| 009 | P2 | Promo/eligibility UX blanks totals | H | **B** | M3 |
| 010 | P2 | Event detail omits refund policy; description duplicated (end time now fixed) | H | **B** | M3 |
| 011 | P2 | Test/QA/past data in public feed; `cancelled` slug still published | H+S | **D** (+read-side rule in M1/M4) | H/M4 |
| 012 | P2 | `/profile` LCP 4.3–5.1s | H | **B** | M5 |
| 013 | P2 | No frontend error capture; `x-request-id` header empty | H+S | **B** | M4 |
| 023 | P2 | Settings thin; no account-deletion entry | H+S | **B** (deletion) / C (prefs) | M6 |
| 024 | P2 | iOS input auto-zoom (14px inputs); 100vh/blur/tiny text | H+S | **B** (device check = E) | M6 |
| 025 | P2 | Quote error mapping; wallet hang; no offline UX | H | **B** | M3 |
| 026 | P2 | Homepage ~427 KB HTML, ~1,700 image refs | H | **B** | M5 |
| 030 | P2 | Card "From ₹800" vs purchase ₹650 (stale denormalized price) | H | **A** | M3 |
| 031 | P2 | Max-per-order not enforced in UI (server rejects) | H | **B** | M3 |
| 032 | P2 | Phone step: no country picker/India default/normalisation | H+S | **B** | M2 |
| 038 | P2 | Intermittent "off the circuit"/"temporarily unavailable" on cold loads (revised) | H | **B** | M4 |
| 039 | P2 | Sold-out/full events show no CTA and no message | H | **B** | M4 |
| 049 | P2 | Sign-out dialog: no focus trap/restore | H | **B** | M6 |
| 051 | P2 | Contrast failures on nav/CTA/9px pills | H | **B** (token-level colour redesign → C) | M6 |
| 001r | P3 | Residual: 2 × 403 `vercel.app` posters; 47/54 no poster | H | **D** | H/M4 |
| 014 | P3 | `₹442.5` one-decimal money; 8 formatters | H+S | **B** | M3 |
| 015 | P3 | Dead "Apple Wallet unavailable" control; no price in ticket dialog | H | **C** | — |
| 016 | P3 | CTA inert until hydration (~3–5s) | H (hyp.) | **C** | — |
| 017 | P3 | Priciest tier pre-selected in drawer | H | **C** (decision flagged) | — |
| 018 | P3 | Mobile event page layout/dead space | H | **C** | — |
| 019 | P3 | Host-facing hero copy; logged-out `/help` redirect | H | **C** | — |
| 020 | P3 | `/api/payments/recovery` 404 on every event load | H | **B** (log noise; 1-line contract fix) | M4 |
| 021 | P3 | One-off `/terms` TTFB 5.9s | H (1 sample) | **E** (retest) | — |
| 022 | P3 | Tickets enrichment N+1 + swallowed errors + 3 overlapping wallet endpoints | H+S | **B** | M4 |
| 027 | P3 | Dead/stale code, duplicate clients | S | **C** (only pieces absorbed by M3/M4/M5) | — |
| 028 | P3 | Sign-out confirm dialog | H | **C** (keep; fix is 049) | — |
| 033 | P3 | Checkout state not URL-addressable | H | **C** | — |
| 034 | P3 | 320px CTA below fold; 10px selects; small targets | H | **B** | M6 |
| 035 | P3 | QR still presentable while transfer pending | S | **E** (product decision at Transfer Acceptance) | — |
| 041 | P3 | Event page still offers "RSVP" to RSVP'd Guest | H | **C** | — |
| 042 | P3 | Cancelled ticket still shows "QR available 24h before" | H | **C** | — |
| 043 | P3 | Soft-404 (HTTP 200) for invalid entities | H | **B** | M4 |
| 044 | P3 | RSVP confirmation says "TOTAL PAID ₹0" | H | **C** | — |
| 045 | P3 | Staging build lacks Firebase test-phone bypass | H+S | **D** | H/M2 |
| 046 | P3 | RSVP duplicate = 201 replay vs documented 409; fresh Idempotency-Key per call | H+S | **C** (comment/doc; optional) | — |
| 048 | P3 | "← Back to event" doesn't dismiss drawer | H | **B** | M3 |
| 050 | P3 | Nested `<main>` on `/hosts` | H | **B** | M6 |
| 052 | P3 | Touch targets 6–18px (dots, footer, checkboxes) | H | **B** | M6 |
| 053 | P3 | Failed login drops focus to body; no `aria-invalid` | H | **B** | M2 |
| 054 | P3 | Non-prefetched client nav 3.8s with no feedback | H | **C** (server-render share handled by M5) | — |

Class totals (primary class per finding, sums to 50): **A 4** (003, 007, 030, 040) · **B 25** · **C 13** (015, 016, 017, 018, 019, 027, 028, 033, 041, 042, 044, 046, 054) · **D 6** (002, 004, 005, 011, 001r, 045) · **E 2** (021, 035). Items with a policy/config component (006, 023, 004) are scheduled for the code part under their primary class and carry a human action in §E.

---

## C. Milestone dependency graph

```
 H (parallel human/config track, starts immediately)
   H1 Google + trusted origins ─────────────────────────────► M2 hosted check
   H2 approved fee values (owner business decision; not Codex) ───► closes GUEST-004 (M2 code can merge earlier)
   H3 DECIDED: guest.thec1rcle.com authoritative; root cutover = later release gate ──► M2
   H4 DECIDED (end-of-event cutoff, started sells) ─────────────► M1 READY
   H5 DECIDED: prepare only; record-level approval before execution ──► M4
   H6 DECIDED: support-mediated deletion request ──────────────► M6
   H7 APPROVED staging-only (owner applies env var) ───────────► M2 hosted OTP check
   H8 rotate Vercel bypass token (now)

 M1  Sale integrity & session security       (backend core + gateway + BFF)   ← START HERE
  │
  ├─► M2  Auth & commercial configuration     (config-heavy + small code)    needs H1,H2,H3,H7; M1 cookie work
  │
  └─► M3  Checkout & pricing correctness      (backend public mapper + frontend)  needs M1 sale-status contract, H2
          │
          └─► M4  Directory, data integrity & observability   needs M1 (effective status) , H5
                  │
                  └─► M5  Performance                         needs M2 (auth flow stable), M4 (error contract)
                          │
                          └─► M6  Mobile, accessibility, account/settings minimums   needs M3 (drawer), M5 (nav)
                                  │
                                  └─► Claude re-acceptance → "FUNCTIONALLY CLEAN" gate → (later) Payment Acceptance → Quality Pass
```

Rules: milestones are **sequential, one in flight**. M2's *configuration* work can proceed in parallel with M1 *code* (different owners), but M2 is not "done" until M1's cookie change is merged (the Google callback and session-cookie flags interact). Milestone boundaries are frozen; a new sub-milestone requires a proven architectural blocker recorded in the milestone's PR description.

---

## D. Detailed milestone specifications

### M1 — Sale integrity & session security

> **M1 READINESS: READY FOR CODEX IMPLEMENTATION — YES.** The sale rule is fully specified by H4; no human action blocks M1. Codex resolves file locations by reading code (areas below are marked verified/inferred). One interpretation is fixed here so Codex does not guess — see L3 ("pre-cutoff hold, post-cutoff Pay"). H8 (token rotation) is owner hygiene, not an M1 dependency.


**Goal.** A finished (or otherwise not-on-sale) event can never produce a valid new order/RSVP/hold, even from a stale client or direct API call; `/profile/saved` works; the session/cookie/privacy posture meets a launch baseline.

**Findings covered.** 040, 003, 007, 008 (PII part only), and the read-side rule from 011 ("ended events are not in the default public feed").

**Root causes.**
1. *Sale eligibility is status-only.* `assertOnSale` (backend `packages/core/src/application/checkout/checkout-service.ts`, ~L604) checks only `event.status === 'published'` although its comment promises "finished event is not on sale". Nothing auto-advances `published → started → ended`; the live proof is `halloween` (ended 2026-11-14T10:31Z, still `published`, quotable at ₹653.10). `event-policy.ts` already has `eventEffectiveEndAt` (endAt, or start+6h when absent) and QR/admission/transfer helpers — there is **no sales-window helper**. *[S, verified]*
2. *SSR page forwards raw cookie.* `apps/guest-portal/src/app/profile/saved/page.tsx` sends `cookies().toString()` straight to the gateway; the gateway only recognises `__Secure-better-auth.session_token`; the BFF translates via `withGatewayCookieName` (in `src/lib/bff/gateway-proxy.ts`). *[H+S, verified]*
3. *Session posture.* BFF rescopes the cookie to host-only, `Secure=false`; no CSP header; `/api/auth/session` is `Cache-Control: public`; `/api/auth/refresh` returns `accessToken` to JS; `/api/onboarding` returns full phone + DOB on every page. *[H]*

**Authoritative design for 040 (all enforcement layers).**
- **L1 Domain rule (single source) — FINAL (H4).** Add `eventSalesUnavailableReason(event, now)` beside the existing event-policy helpers (`packages/core/src/domain/models/event-policy.ts`, which already exports `eventEffectiveEndAt`). Online sales are available **iff** `event.status ∈ {published, started}` **and** `now < salesCloseAt`, where `salesCloseAt = eventEffectiveEndAt(event)` (`endAt` when present, else `startAt + 6h` — use the existing helper as-is; do **not** re-implement it). `now >= salesCloseAt` is unavailable (the end instant itself is **closed**). Not sellable regardless of time: `draft`, `sales_paused`, `postponed`, `cancelled`, `ended`. **Behaviour change to note:** today `assertOnSale` and `createRsvp` accept `published` only, so `started` events currently do **not** sell; H4 makes them sellable — Codex must confirm no downstream code (inventory, pricing phases, door/admission, analytics, Partner dashboard) assumes sales stop at `started`. Anomalous data (`endAt <= startAt`) follows the existing helper; add a test that pins the behaviour but do not invent a new rule.
- **L2 Enforcement at every money/entitlement-creating step**, all using the injected clock (`deps.config.clock.now()`), never `Date.now()`: quote, hold creation, payment-attempt creation, RSVP creation, waitlist-offer accept, ticket-access-code redemption, add-on selection. *Likely area:* `checkout-service.ts` (`assertOnSale` call sites; `createRsvp` ~L1043 has its own `published` check; hold path ~L894–943; confirmation/conversion ~L1378–1700), plus waitlist/ticket-access services (**confirm by grep**).
- **L3 In-flight money rule — FINAL (H4).** (a) A **hold created before cutoff and still within its existing TTL (10 min) may complete** — payment confirmation/webhook/verify for an attempt created before cutoff **may finish after cutoff** if the hold is valid. (b) **No new payment attempt may be created at/after cutoff**, including for a hold created before cutoff (conservative reading, stated explicitly: a Guest with a pre-cutoff hold who has not yet started the attempt when the cutoff passes is blocked and the hold lapses by TTL/release). (c) An expired or released hold, or a payment captured without a valid hold, flows into the **existing compensation/refund path**. Codex implements (a)–(c) as written; if the owner wants a pre-cutoff hold to be allowed to *start* an attempt after cutoff, that is a one-line owner override recorded **before** the payment-attempt change is coded. *Verified at Payment Acceptance (E).*
- **L4 Lifecycle.** Correctness must **not** depend on a cron. Primary mechanism = derived/effective status computed from time. Secondary (optional, same milestone only if trivial): a scheduled sweeper that advances `published → ended` after `effectiveEnd + grace` for analytics/Partner dashboards. *Uncertainty:* Partner dashboard and door app semantics for `started/ended` — **read before touching**; do not change stored statuses used by Partner without verifying consumers.
- **L5 Public read contract.** Public event/tier DTOs gain an explicit **`salesStatus`** (`on_sale | sold_out | sales_paused | ended | cancelled | postponed`) computed server-side; `/api/v2/public/events` default excludes ended events (discovery already filters; the unfiltered list returned 39 past events). Tier endpoint returns not-on-sale reason rather than silently empty. Contract lives in the shared `contracts` package (backend and frontend copies exist — **keep them in sync**, see Risk R6).
- **L6 Client state.** Event page, home/explore cards, drawer and checkout page render from `salesStatus` (Ended / Sales paused / Sold out / Cancelled); no CTA when not `on_sale`; drawer refuses to open; direct `/checkout/<slug>` for an ended event shows the not-on-sale state and cannot reach Pay. Stable server error code (e.g. `event_not_on_sale`) is mapped by the checkout client (feeds M3's error mapping).
- **L7 What is not done:** no hiding-only fix; no frontend-only date check.

**003 design.** Introduce/confirm **one** server-side helper for gateway calls with the user's cookie (the existing `withGatewayCookieName` path) and migrate every SSR caller that forwards `cookies().toString()` (grep `cookies()` + `createApiClient` in `apps/guest-portal/src/app`). Replace the swallowed catch on the saved-events page with distinct states: unauthenticated → login redirect, transient → retry state, empty → proper empty state. Do not widen cookie names accepted by the gateway.

**007/008-PII design.** (a) Session cookie: set `Secure` when served over HTTPS (env-aware, so local HTTP dev keeps working); keep `HttpOnly`, `SameSite=Lax`. Confirm proxy.ts accepts both cookie names (it does). (b) `Cache-Control: private, no-store` on all `/api/auth/*` JSON. (c) **CSP**: introduce in **Report-Only first**, enumerate required sources (Razorpay checkout script/frames, Firebase/Google reCAPTCHA hosts, `storage.googleapis.com` images, Next/Vercel), then enforce only after a clean hosted observation window. (d) `accessToken` in refresh body: decision — keep (it is the BFF/direct-client Bearer path) **only** with CSP enforced; otherwise plan removal. (e) `/api/onboarding`: stop returning raw phone/DOB to non-onboarding pages — return `{complete, phoneVerified, displayName}` for guards, and masked phone; full values only inside onboarding/profile-edit flows. *Likely areas:* `src/lib/bff/auth-proxy.ts`, `src/lib/bff/guest-onboarding.ts`, `src/app/api/auth/*`, `next.config.ts` headers, onboarding contract in `packages/contracts`.

**Expected implementation areas (marked).** Backend core event-policy + checkout/RSVP/waitlist/access-code services *(verified for checkout/RSVP; others inferred)*; gateway public routes + response schemas *(inferred)*; shared contracts *(verified exist)*; guest-portal event/explore/home/checkout components, saved-events page, BFF helpers, `next.config.ts` *(verified exist)*.

**Required behaviour after remediation.**
- Quote/hold/attempt/RSVP/waitlist/access-code against an ended event → rejected with stable code; no order/hold/entitlement/inventory change.
- Boundary table verified: before end ✔ (including after start while `started`), exactly at cutoff ✖, after ✖; `endAt` null → start+6h; `cancelled`/`postponed`/`sales_paused`/`draft`/`ended` ✖; future paid/free events unaffected.
- `/profile/saved` loads for a signed-in Guest (empty state or list); signed-out → login redirect; a transient failure shows retry, not a generic dead-end.
- `better-auth.session_token` carries `Secure` on HTTPS; auth JSON is `no-store`; CSP present (Report-Only or enforced per gate); onboarding guard payloads contain no raw phone/DOB.

**Explicit non-goals.** Payment execution; fee policy; redesigning event cards; Partner dashboard changes; new cron infrastructure unless required by H4; account deletion; Google config (M2).

**Dependencies.** None blocking. H4 is **decided** (Decision log). H8 token rotation recommended before hosted re-acceptance.

**Human/provider actions.** None required to start. Owner may later override the L3(b) reading (see L3). H8.

**Tests (focused).**
- Backend unit: `eventSalesUnavailableReason` matrix with injected clock (boundaries, null `endAt`, statuses, timezone ISO strings).
- Backend service: quote/hold/attempt/RSVP/waitlist/access-code each reject for ended; hold-created-before-cutoff completes within TTL; expired hold rejected; stale-client direct service call cannot bypass.
- Gateway route: ended event → 4xx with stable code; `/public/events` default excludes ended; DTO includes `salesStatus`.
- Contracts: schema round-trip (backend + frontend copies).
- Frontend: event page/drawer/checkout page render states for each `salesStatus`; saved-events page (unauth/empty/list/transient); helper unit test for cookie translation; `/api/auth/*` cache headers; onboarding payload minimisation.
- Do **not** run the whole monorepo while iterating.

**Hosted acceptance (Claude, staging).** `halloween` (ended): page shows Ended, no CTA; direct `POST /api/checkout/quote` (via BFF) and `POST /api/rsvp` rejected with the stable code; `/api/v2/public/events` excludes it; discovery unchanged; a future event still quotes (₹650 Early Bird example). `/profile/saved` with the QA Guest: empty state; save one event → listed → unsave (own data, restored). Header check: session cookie `Secure`, auth JSON `no-store`, CSP header present. `/api/onboarding` on `/tickets` contains no raw phone/DOB. *(Hold/Pay rejection and in-flight rule → Payment Acceptance register.)*

**Definition of done.** All M1 tests green at the release gate once; PR CI green on exact head; independent review; merged; staging deployed; every hosted check above passes; no regression in Explore/Event/Checkout-to-quote (smoke).

---

### M2 — Authentication & commercial configuration

> **Decision impact (H2/H3/H7).** (H2) Codex must **not** choose fee percentages; M2 delivers policy-driven disclosure copy and a fail-closed production guard only, so **GUEST-004 remains OPEN until the owner provides the approved production policy**; M2 can merge without closing it. (H3) Scope is `guest.thec1rcle.com` only (trusted origins, CORS, Google redirect `https://guest.thec1rcle.com/api/auth/google/callback`); root-domain cutover and deployment-protection policy are **not** M2 work. (H7) Staging-only test-phone bypass: owner sets `NEXT_PUBLIC_FIREBASE_TEST_PHONE` on the staging build; **Codex adds a guard + test so the variable is ignored (and a production build fails or warns) when the environment is production.**


**Goal.** Google sign-in initiates and completes on staging; the Guest-visible commercial policy is production-grade; launch-domain protection/CORS/trusted origins are correct; phone entry works for Indian users; QA can exercise OTP.

**Findings covered.** 002, 004, 005 (cond.), 045, 032, 053.

**Root causes.** Configuration (not code) for 002/005/045; hard-coded non-production copy for 004 (`BookingFeeDisclosure.tsx` literally prints "Test pricing policy… production rates are not approved"; the `feePolicy` object is `m4-nonproduction-test-v1`); raw-E.164 text input for 032 (`OnboardingClient.tsx` + `phone.ts`); no focus management after failed login for 053.

**Expected implementation areas.**
- *Config (human):* Render env `BETTER_AUTH_TRUSTED_ORIGINS` (+ `ALLOWED_ORIGINS`) include `https://guest.thec1rcle.com` and the production origin; `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` set (`…/api/auth/google/callback` on the Guest origin — gateway validates pathname + HTTPS); Google Cloud console authorised redirect/JS origins; Vercel protection decision; Firebase test-phone env `NEXT_PUBLIC_FIREBASE_TEST_PHONE` on the staging build; Firebase authorised domains.
- *Code (small):* fee-disclosure component driven by `feePolicy` fields (no hard-coded "test" language); **gateway fail-closed guard** so a production environment cannot serve a non-production fee policy; onboarding phone control (country selector defaulting to India, searchable, normalisation to E.164 — *library choice is Codex's, keep bundle impact small*); failed-login focus + `aria-invalid`/`aria-describedby`. *Likely areas:* `features/booking/components/BookingFeeDisclosure.tsx`, gateway fee-policy config *(location inferred — find where `m4-nonproduction-test-v1` is defined)*, `features/onboarding/*`, `features/auth/components/*`, `app/login/login-page-client.tsx`.

**Required behaviour.** `POST /api/auth/google` returns a Google authorisation URL for the staging origin; callback returns to the intended `next` and creates one Guest account (no duplicates, no loops); error → `/login?reason=google` message. Review screen shows approved fee wording with **no** "test/non-production" text when the active policy is production-approved; backend refuses to start (or quote) with a non-production policy when `environment=production`. Phone: typing `9876543210` with India selected yields `+919876543210`; a pasted `+91 <10-digit number>` with spaces still works; resend cooldown retained; test-number bypass works on staging for the configured number. Failed login focuses the error and marks the field invalid.

**Non-goals.** Real SMS delivery; reCAPTCHA replacement; changing fee *amounts* (decision is H2's); account linking policy changes.

**Dependencies.** H1/H1b (Google console + Render env values) and H7 (staging env var) for hosted acceptance; **H2 approved policy only for closing GUEST-004** (not for merging M2 code); M1 cookie change merged (callback sets session cookies).

**Human/provider actions.** See §E (H1/H1b, H7 setting, H2 policy values). **Codex must not guess secrets, env values or fee rates.**

**Tests.** Frontend: fee-disclosure renders policy-driven copy for production/test policies; phone component normalisation table (India default, `+91`, spaces, leading 0, other countries, invalid) ; login error focus/ARIA. Backend: fee-policy production guard (non-production policy + `environment=production` ⇒ refusal); trusted-origin parsing/Google config validation (existing `getGoogleAuthConfig` tests extended); callback origin must be trusted (already enforced at boot).

**Hosted acceptance.** Origin probes: trusted origin ⇒ Google URL (not 403/404). **Human gate:** READY FOR GOOGLE LOGIN — user selects account; verify callback → session → onboarding decision (existing user not re-onboarded) → return intent; no loops/duplicates. Checkout review shows no test language (while the policy is production-approved). Phone step end-to-end with the Firebase test number on staging (Claude can drive once bypass exists; otherwise human solves reCAPTCHA). Vercel/CORS checks per H3.

**Definition of done.** Google login completed by a human on staging once and recorded; fee guard + policy-driven copy + production-bypass-guard + phone-normalisation tests green; hosted checks pass; `guest.thec1rcle.com` CORS/trusted origin verified by header probes. **GUEST-004 closes only when the owner-approved production fee policy is deployed and the review screen shows approved wording with no test language; until then it is reported STILL EXTERNALLY BLOCKED, not FIXED.**

---

### M3 — Checkout & pricing correctness

**Goal.** Every price a Guest sees agrees with what the backend will charge; checkout errors say what actually went wrong; Guests see the Host refund policy before buying.

**Findings covered.** 030, 014, 025 (quote/offline/wallet-hang parts), 031, 009, 010, 048.

**Root causes.** (1) `startingPricePaise` stored on the event and *not* recomputed when pricing phases change → card "From ₹800" vs Early Bird ₹650 *[H]*. (2) `CheckoutFlowClient` has exactly two quote-error messages (any non-401 → "Check you are signed in"; with promo → blames the promo) *[H+S, verified at L1237–1241]*. (3) Drawer cap `min(available, 10)` ignores `maxPerOrder` (tiers API exposes it) *[H]*. (4) 8 `Intl.NumberFormat` instances with `minimumFractionDigits: 0` → `₹442.5` *[S+H]*. (5) Host `refundPolicy` (`no_refunds | until_cutoff | organizer_reviewed`) is in the API but never rendered *[H+S]*. (6) `Back to event` link does not dismiss the drawer *[H]*.

**Design.**
- **Price truth.** "From price" is a **server-computed read** of the *currently effective* tier price (phase-aware) in the public mapper, not a stored value; if a stored value is retained for sorting, it must be recomputed at phase boundaries. Frontend consumes it; no client arithmetic. *Likely area:* backend public event mapper / `public-service`, pricing phase resolver; **verify where `startingPricePaise` is written before choosing**.
- **One money formatter** in a shared util (₹, Indian grouping, 0 decimals only when whole rupees, 2 decimals otherwise) and use it in checkout, confirmation, cards, tickets. Do not touch unrelated formatters.
- **Quote error contract.** Map server error codes to distinct states: `event_not_on_sale` (M1), `max_per_order` (use server's message), `sold_out/insufficient_inventory`, `promo_invalid/expired/exhausted` (use server's message, **keep totals visible without the promo**), `validation` (eligibility), `unauthorized` (login), `server/network` (retryable, honest wording). Only promo-attributable codes may blame the promo.
- **Quantity limits** derive from the tier DTO (`maxPerOrder`, availability, `maxPerUser` if exposed); the server stays the authority.
- **Refund policy disclosure** on event page and in checkout review in plain language per policy kind (cutoff date shown in IST); consistent with the existing rule that cancelled/postponed/material-change are always refundable. Dedupe the doubled description while there (GUEST-010).
- **Drawer.** "Back to event" closes the drawer. Nothing else about drawer design changes.

**Non-goals.** Pay/hold/expiry behaviour (Payment Acceptance), promo engine changes, new checkout steps, URL-addressable checkout (C), pre-selection dark-pattern decision (C), redesign.

**Dependencies.** M1 (`salesStatus` + error code). Fee wording is policy-driven (H2 values owner-supplied; Codex must not invent rates).

**Tests.** Backend: public mapper returns phase-aware "from" price across phase boundaries (before/at/after phase switch), free/multi-tier cases. Frontend: formatter table; error-mapping table (every code → message, promo vs non-promo); quantity clamp from `maxPerOrder`; refund-policy renderer for the 3 kinds + null; drawer Back control; totals remain visible on promo failure. Contract test that frontend error codes ⊆ backend codes.

**Hosted acceptance.** `C1RCLE STAGING ACCEPTANCE 001`: card, CTA, drawer, tiers API, quote all ₹650; `STAGE001` still −₹65, fees/tax ₹51.78, total ₹636.78 (regression anchor); qty 5 → message states the 4-per-order limit and drawer stops at 4; invalid promo → "not found" wording and totals still shown; 500/409/network injected via browser routing → distinct honest messages; money shows two decimals where needed; refund policy visible for events with each policy kind (staging data approval if no sample exists); Back-to-event closes drawer. **Pay is not pressed.**

**Definition of done.** Matrix above passes; pricing anchor unchanged; no CTA/price mismatch across ≥3 events (incl. phase event, free, multi-tier).

---

### M4 — Directory, data integrity & observability

**Goal.** Public pages tell the truth: missing ≠ timed out; invalid ≠ HTTP 200; sold-out is stated; the public feed contains only real sellable/ended-appropriate content; failures are visible to operators.

**Findings covered.** 038, 043, 011, 001r, 039, 022, 020, 013, (021 retest).

**Root causes.** (1) Event/venue/host SSR fetches use a ~5s timeout and the `catch` renders a *not-found-style* state with HTTP 200 *[H+S]*. (2) Invalid entities don't call `notFound()`. (3) Tiers list empty for sold-out ⇒ no CTA, no copy *[H]*. (4) Test/QA/stale events were created through normal host flows and never retired; no read-side "is this publicly presentable" rule *[H]*. (5) Tickets page fans out N+1 direct gateway calls and swallows failures; three overlapping wallet endpoints *[S+H]*. (6) `/api/payments/recovery` returns 404 for the normal "nothing pending" state *[H]*. (7) No frontend error capture; `x-request-id` not exposed *[H+S]*.

**Design (each issue gets the right mechanism, not "hide the error").**
- *Read normalisation + UI state:* distinguish **404** (entity truly absent → real HTTP 404 via `notFound()`), **transient/timeout** (error boundary with Retry, HTTP 5xx/`no-store`, never "off the circuit"), **empty** (valid, none). Retry once server-side with a bounded budget; consider short stale-while-revalidate for directory reads. *Likely areas:* `src/app/venue/[venueId]`, `src/app/host/[hostId]`, `src/app/event/[eventId]`, `features/directory/*`, `app/event/[eventId]/page.tsx` (5s client constructed there).
- *Sold-out/full:* use `salesStatus` from M1; tier DTO keeps sold-out tiers visible with `availableQuantity: 0` (or explicit flag) so the page can say "Sold out"/"Fully booked" and disable cleanly.
- *Data:* (a) **migration** (staging, approval-gated) to retire/unpublish QA/test/stale events and to null the two 403 `vercel.app` poster URLs; (b) **write validation** already exists for localhost posters — extend the rule to reject non-public/preview hosts (`*.vercel.app` preview domains) *[S: verify existing guard in `event.ts`/`event-service.ts`]*; (c) **read normalisation** for any remaining bad media; (d) optional **presentability rule** for the public feed (title/poster/description minimums) is a *product decision* — default: do not invent one; (e) **scheduled maintenance** is *not* part of this milestone unless M1's optional sweeper was built.
- *Tickets page:* move enrichment server-side (single BFF aggregate for event+venue per ticket) or batch endpoint; surface partial-failure state instead of silent `null`; reconcile or document overlapping wallet endpoints (do **not** delete endpoints used by the scanner/partner apps without checking consumers).
- *Recovery 404:* return `200 {status:'none'}` (or 204) and update the one consumer; keep 404 semantics only for unknown holds.
- *Observability:* expose `x-request-id` on gateway/BFF responses and include it in user-visible error states for support; add frontend error capture (Sentry DSN wiring is already schema-supported but unset — **needs H-decision on tool/DSN**) with PII scrubbing; log hold/payment ids in structured logs; document the "paid but no ticket" trace runbook (execution proof = Payment Acceptance).

**Cleanup candidate workflow (H5 — prepare only).** Codex produces (1) a **candidate list** (markdown/CSV in the PR) with, per record: collection/id, slug, title, status, start/end, org/host, why it is a candidate (QA/test naming, past-but-published, duplicate, bad poster host), proposed action (**unpublish/retire, not delete**; poster → null), reversibility note, and an empty `OWNER_APPROVED (Y/N)` column; (2) a **migration script that defaults to dry-run**, takes the approved ID list as an explicit input file, refuses any ID not on it, logs before/after, and is reversible. **No record is changed without the owner's explicit record-level approval**, and the migration is **never run by Codex or Claude** unless the owner names an approved list. Public-feed behaviour for ended events is handled by M1 (read-side), so cleanup is hygiene, not correctness.

**Non-goals.** Redesigning directory pages; new search; pagination redesign; deleting production data; inventing a content-quality ruleset; Firestore schema migrations beyond the approved cleanup.

**Dependencies.** M1 (`salesStatus`, effective status). H5 is decided: Codex prepares; **the owner approves per record before any execution** (see *Cleanup candidate workflow*). Observability tool/DSN (H9) still open for hosted error capture.

**Tests.** Frontend: directory/event pages for 404 vs timeout vs ok (mock fetch rejecting/timeouts/404), asserting status semantics and Retry; sold-out rendering; recovery consumer. Backend: poster-host validation (preview domains), public mapper normalisation, recovery endpoint contract, request-id header present on success and error responses; tickets aggregate (if added) partial-failure behaviour.

**Hosted acceptance.** Repeat the cold-load experiment (3 loads × venue/host/event pages after idle): **no** "off the circuit" for existing entities; nonexistent slug → real 404; injected slow backend → Retry state; sold-out event states "Sold out"; discovery/public lists contain no QA/test/stale events (after approved cleanup) and no bad posters; `x-request-id` header present and shown in an induced error; `/tickets` no console CORS/ERR and partial-failure injection shows a message; payments/recovery no longer 404s in console; frontend error capture receives a synthetic test error (if tool chosen).

**Definition of done.** Hosted checks pass; cleanup performed only on approved records and listed in the PR; no entity that exists is ever labelled missing in the 3×3 cold-load run.

---

### M5 — Performance

**Goal.** Remove the measured launch-visible latency without architectural rewrites.

**Findings covered.** 008 (waterfall), 012, 026, 054 (server-render share only), 016 (only if the fix is a by-product).

**Measured baselines to beat (hosted, one region).** `/profile` LCP 4.3–5.1s; every route TTFB ≈1.0–2.0s no-store SSR; serial `session → refresh → onboarding`; Profile "View all" 3.8s before URL change; home HTML ≈427 KB/≈1,700 image refs/172 `<img>`/≈490–570 KB transferred.

**Design.**
- *Auth waterfall:* resolve session once per request server-side and pass to client (avoid client-side `session → refresh → onboarding` chain); `refresh` only when expiry is near; onboarding fetch only on routes that need it (M1 already minimises payload). *Likely areas:* `@c1rcle/auth` client, `OnboardingGuard`, layout/providers, `app/api/auth/*`.
- *Profile LCP:* identify the LCP element (likely hero/avatar/event card images or blocked render) before changing; fix cause (priority/size/lazy, fetch parallelism). *Unknown cause — investigate first.*
- *Homepage:* stop rendering the decorative marquee as 1,700 image references (render each image once, duplicate via CSS/aria-hidden clone sparingly, or reduce duplicates); size images properly; keep visual result materially identical (no redesign).
- *Caching where safe:* public, user-independent pages (home/explore/venue/host/event shells) may use short revalidation **only if** the sale-status and visibility semantics from M1 remain correct (existing comment: visibility must change immediately) — default is **no change** unless a safe ISR/`stale-while-revalidate` with explicit tags is proven.
- *Prefetch:* ensure Profile query views are prefetched or avoid server round-trip for view switches (lightweight).

**Non-goals.** Perceived-performance polish (skeletons, transitions), bundle rewrites, framework changes, CDN changes, image pipeline replacement, anything marked C.

**Dependencies.** M2 (auth flow stable), M4 (error contract).

**Tests.** Unit/integration: auth bootstrap makes ≤N network calls (assert call counts with mocks); onboarding fetch gated by route; homepage render has ≤ budgeted `<img>` count (static count test) and no duplicate decorative requests. No flaky timing tests.

**Hosted acceptance.** Re-measure the same pages/viewports with the audit harness: `/profile` LCP target **≤ 2.5s** (stretch), no route regresses vs baseline, home HTML target **≤ 150 KB** and image refs ≤ ~60 (targets, to be confirmed with Codex's findings), auth calls per page reduced (document before/after), "View all" URL change **≤ 1.0s**. Report as before/after tables.

**Definition of done.** Targets met or an evidence-backed, user-accepted exception is recorded; no functional regressions in login/session; Web Vitals CLS stays 0.

---

### M6 — Mobile, accessibility and account/settings minimums

**Goal.** Close browser-testable accessibility/mobile defects and the minimum account policy items, without redesign.

**Findings covered.** 024, 034, 049, 050, 051, 052, 006, 023 (deletion entry only).

**Design.**
- *Inputs:* all Guest text inputs/selects ≥16px on mobile (search, promo, settings, Explore filters at 10px) — preserve look via padding/scale, not by shrinking text. Keep `maximum-scale` untouched.
- *Touch targets:* ≥24px minimum (aim 44px on primary controls) for carousel dots (6×6), `/app` dots (10×10), footer links (15px), "View all events →", privacy checkboxes (18×18), search field hit area — via padding/hit-area expansion, not visible redesign.
- *Dialogs:* Sign-out confirm dialog gets a real focus trap and returns focus to its trigger (reuse the pattern that already passes in the tickets/mobile-menu/drawer dialogs rather than inventing another).
- *Landmarks:* remove nested `<main>` on `/hosts`; confirm single `main` everywhere.
- *Contrast (browser-testable minimum):* inactive nav links (2.87:1), primary CTA text on orange (3.65:1), "Unlock" (3.98:1), 9–10px date pills on home (1.4–1.7:1) must meet AA via token adjustments localised to those components; **no global palette redesign** (C).
- *Mobile layout (034):* make 320px drawer Review CTA reachable without scroll (sticky within drawer) — minimal.
- *Account/Settings (H6 decided):* a **support-mediated account-deletion request** is the V1 deliverable: an "Account deletion request" entry in Account & security that creates a support request through the existing help-desk (category Account), with clear copy (what is deleted, expected timeline, confirmation by email) — **no automated erasure pipeline**. Notification-preference UI is **not built** (no Guest marketing/in-app notifications exist). Wallet/Orders/Notifications routes are **explicitly not built**. Renaming the "My Orders" heading stays Class C unless trivial.

**Non-goals.** Visual hierarchy/spacing/motion redesign, skeleton philosophy, flagship aesthetics, full colour-system overhaul, new pages, automated account erasure pipeline, screen-reader acceptance.

**Dependencies.** M3 (drawer), M5 (nav behaviour stable). H6 is decided.

**Tests.** Component tests: sign-out dialog focus trap/restore; no nested `main`; programmatic checks of input font-size classes (≥16px at mobile breakpoint); contrast unit checks for the changed tokens; target-size assertions for listed controls; deletion-request form posts the right support payload. Optional Playwright e2e at 320/390 for drawer CTA reachability.

**Hosted acceptance.** Re-run the audit's computed-contrast script on the same pages (failures listed in GUEST-051 resolved; no new <3:1 among measurable text); keyboard script on sign-out dialog (Tab stays inside, Esc restores focus to trigger); touch-target script at 390 (no listed control <24px); `main` count = 1 on `/hosts`; input font sizes 16px on search/promo/settings/Explore at 390; 320px drawer CTA within viewport; deletion request creates a help ticket visible in `/help`. **iOS Safari and screen reader remain deferred (E).**

**Definition of done.** Scripts pass; no layout overflow regression at 320/375/390/430; no new a11y failures vs the Phase 27 baseline.

---

## E. Configuration / human-action checklist (what *you* must do)

| # | Action | Needed by | Notes |
|---|---|---|---|
| H1 | **Google Cloud console:** create/confirm OAuth client; authorised JS origin + redirect URI `https://guest.thec1rcle.com/api/auth/google/callback` (and production origin later) | M2 | Gateway requires HTTPS callback path exactly `/api/auth/google/callback`. |
| H1b | **Render env (api gateway):** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`; add `https://guest.thec1rcle.com` (and production origin) to `BETTER_AUTH_TRUSTED_ORIGINS` and `ALLOWED_ORIGINS` | M2 | **Do not paste secrets in chat/commits**; set in Render. |
| H2 | **Fee-policy values:** supply the approved production rates / who-pays / GST handling and wording. **Not invented by Codex.** | closes GUEST-004 | Until supplied, GUEST-004 stays OPEN (staging policy remains non-production). |
| H3 | **DECIDED:** `guest.thec1rcle.com` is the authoritative Guest domain for remediation. **Still yours:** add it to Render `BETTER_AUTH_TRUSTED_ORIGINS`/`ALLOWED_ORIGINS` (with H1b); keep or lift Vercel Deployment Protection as you choose for QA access. **Later release decision:** root-domain (`thec1rcle.com`) cutover and its CORS/trusted/Google/Razorpay/Firebase domains. | M2 / launch cutover | GUEST-005 becomes a launch-cutover gate. |
| H4 | **DECIDED** (Decision log). No action. Optional override of L3(b) only. | — | M1 ready. |
| H5 | **DECIDED:** Codex prepares candidate list + dry-run migration. **You approve each record** before any execution. | M4 | Nothing runs without your named list. |
| H6 | **DECIDED:** support-mediated deletion request for V1. No further action. | M6 | — |
| H7 | **APPROVED (staging only).** You apply `NEXT_PUBLIC_FIREBASE_TEST_PHONE` on the **staging** Vercel build + redeploy and confirm Firebase authorised domains; never set in production. Codex adds the production guard. | M2 | — |
| H8 | **Rotate the Vercel bypass token** issued in the audit | now | Token was shared in chat. |
| H9 | **Observability tool/DSN decision** (e.g. Sentry) and PII-scrubbing expectations | M4 | Needed only if you want hosted error capture. |
| H10 | Provide/approve QA accounts for re-acceptance and a mailbox/phone for Google/OTP human gates | re-acceptance | Real SMS stays a separate final gate. |

---

## F. Deferred acceptance register (remediation cannot close these)

| Item | Why deferred | Execute WHEN | Closes |
|---|---|---|---|
| **Payment Acceptance** (Razorpay test mode: Pay, hold creation, hold TTL, quote→hold re-pricing, ticket issuance, payment recovery) | needs payment | After M1–M6 pass re-acceptance | 010-hold paths, 025 hold-expiry, 004 end-to-end fee, **040 hold/Pay rejection + in-flight rule** |
| **Finished-event rejection at hold/Pay level** | cannot create hold without Pay | Payment Acceptance, step 1 | 040 (final) |
| Paid-but-no-ticket trace | needs a real payment | Payment Acceptance | 013 (final) |
| **Transfer execution** (invite, pending, QR rule, accept) | needs controlled ticket from payment | After Payment Acceptance | 035 (decide QR-while-pending rule) |
| **Refund execution** | needs paid ticket | After Payment Acceptance | refund surfaces |
| **Real SMS delivery** | needs real number/carrier | Final launch gate | 032/045 (real path) |
| **Google login (human)** | human account selection | M2 hosted acceptance | 002 |
| Real iOS/Safari (zoom, 100vh, blur, keyboard, safe areas) | needs device | After M6, before launch | 024, 034 |
| **Screen reader acceptance** | needs real AT | After M6 (manual) | Phase 27 remainder |
| DB-layer integrity (Firestore) | no DB access | When access is granted, after M4 | Phase 22/31, 011 |
| Production-domain/provider verification (**GUEST-005 root-domain cutover — owner release decision, H3**) | prod not live; cutover is a later release decision | At cutover | 005 (cutover part), Google/CORS/Razorpay/Firebase on root domain |
| Retest `/terms` TTFB | single sample | M5 re-measure | 021 |
| Load/concurrency | no tooling approved | Pre-launch, after Payment Acceptance | reliability |

These stay on the launch-readiness scorecard as **open** until executed; the final gate (§J) requires each to be closed or explicitly accepted by you.

---

## G. Codex handoff (paste-ready implementation contract)

```
ROLE: You are implementing the C1RCLE Guest Portal remediation plan at
docs/acceptance/GUEST_PORTAL_REMEDIATION_PLAN_2026-11-17.md. Read it fully first.
Repos: C1RCLE-FRONTEND (apps/guest-portal, packages/*) and C1RCLE-BACKEND (api-gateway, packages/core, contracts).
Audit (frozen, authoritative): docs/acceptance/GUEST_PORTAL_LAUNCH_AUDIT_2026-11-16.md @802d9a4.

RULES
1. Milestones M1..M6 are FIXED. Work ONE milestone at a time, in order. Do not invent new
   milestones/sub-milestones. If you find a genuinely new architectural blocker, stop and record it
   in the PR description; do not expand scope silently.
2. Scope = only the findings listed for the milestone. No unrelated cleanup, no formatting sweeps,
   no refactors that are not required by the milestone. Do NOT touch: Experience Quality Pass items
   (animation, skeletons, visual hierarchy, flagship aesthetics), payment execution logic beyond
   the sale-eligibility checks specified, Partner/door semantics unless verified safe.
3. Backend stays authoritative. Never weaken a server-side check because the UI changed.
4. Do not guess secrets, env values, Google/Render/Vercel/Firebase settings. Anything in
   plan section E is a HUMAN action: list what you need, do not fabricate.
5. Do not change staging data. Data cleanup (M4, H5) = candidate list + dry-run-default migration script only; the owner approves per record and NOTHING is executed without that. Do not invent fee percentages (H2): fee work is policy-driven + fail-closed only.
   owner approves before anything runs.
6. Keep contracts in sync: backend and frontend copies of shared contracts must both change.
7. H4 is DECIDED (see Decision log): online sales stay open for `published` and `started` events and close when `now >= eventEffectiveEndAt(event)` (`endAt`, else start+6h); no new quote/hold/payment-attempt/RSVP/waitlist/access-code entitlement at/after cutoff; a valid pre-cutoff hold/attempt may complete within its 10-min TTL; no new attempt after cutoff (plan M1 L3). M1 is READY. Before coding M2, confirm the H1/H1b/H7 owner actions are done or listed as pending in the PR.

TESTING CADENCE
- While iterating: focused tests for affected behaviour + relevant package typecheck/lint only.
  Do NOT rerun the full monorepo suite or full build after each small edit.
- When the milestone diff is complete: reconcile the diff against the milestone spec, then run the
  full CI-equivalent validation ONCE (confirm exact commands from package.json / .github/workflows;
  expect lint, typecheck, unit tests, build). Fix proven failures as a batch; rerun only the failed
  gate unless the final change invalidates earlier evidence or release policy requires a full rerun.
- GitHub CI on the exact PR head is the authoritative gate.

RELEASE PROCESS (per milestone)
implement -> focused regression -> final diff review -> final local release gate -> PR (template, no
credentials) -> GitHub CI -> required independent review -> merge -> staging deploy ->
hosted verification by Claude. Do NOT merge/deploy because local tests pass. Do NOT self-certify
the Guest Portal: Claude performs independent re-acceptance (plan section H).

PER-MILESTONE OUTPUT (put in PR description)
- Findings addressed (GUEST-### list) and root cause fixed
- Files/areas changed; anything uncertain from the plan that you resolved (and how)
- Tests added; commands run; results
- Hosted-verification instructions for Claude (exact URLs/steps) and any human actions still pending
- Explicit list of what was NOT done

STOP CONDITIONS: stop and ask if (a) a human action in section E blocks you, (b) a change would
alter Partner/door-app behaviour, (c) you cannot reproduce a finding from the audit evidence,
(d) the fix needs a product decision not recorded in the plan.
```

Milestone one-liners for the prompt: **M1** sale integrity (040) + saved-events cookie (003) + session/PII hardening (007, 008-PII). **M2** Google/trusted origins/fee policy/domain/phone UX (002, 004, 005, 032, 045, 053). **M3** pricing & checkout truth (030, 014, 025, 031, 009, 010, 048). **M4** directory/data/observability (038, 043, 011, 001r, 039, 022, 020, 013). **M5** performance (008-waterfall, 012, 026). **M6** mobile/a11y/account minimums (024, 034, 049, 050, 051, 052, 006, 023).

---

## H. Claude re-acceptance specification (independent QA)

Claude re-enters **after all six milestones are merged and deployed to staging**. Codex's own evidence is an input, not proof. Process:

1. **Source of truth reload** — frozen audit + this plan + merged PR descriptions; confirm deployed build is the merged head (request a build identifier; if none is exposed, note it and verify behaviour only).
2. **Environment preflight** — Vercel bypass (rotated), sandbox allowlists, Render health, test accounts (Guest, new-signup account), data-state snapshot of events/orders touched.
3. **Per-milestone hosted verification** exactly as written in each milestone's *Hosted acceptance* using the frozen harness lessons (no bypass header on cross-origin calls; don't clear cookies mid-run; scope selectors; wait for hydration before clicking; retry/medians for latency; classify instrumentation artefacts before logging findings).
4. **Regression sweep** — Explore/search/filters, event detail (paid, free, multi-tier, sold-out, paused, ended), checkout to pre-Pay incl. the **₹650 / STAGE001 / ₹636.78 anchor**, RSVP create→duplicate→cancel (one synthetic RSVP, restore capacity), profile/settings persistence (restore), login/logout/second-tab/old-cookie 401, Phase 15 sweep subset, Phase 27 scripts.
5. **Human gates** — READY FOR GOOGLE LOGIN; READY FOR REAL OTP/test OTP as applicable; no step skipped.
6. **Verdict per finding** using the matrix below: **FIXED / PARTIALLY FIXED / REGRESSED / NEW DEFECT / STILL EXTERNALLY BLOCKED**. New defects get new IDs (GUEST-056+). Codex cannot self-certify.
7. **Report** appended to a new `docs/acceptance/GUEST_PORTAL_REACCEPTANCE_<date>.md`; score recomputed from evidence only.

### Re-acceptance matrix (every active finding; "Final status" is filled by Claude later)

| GUEST-### | Original state | Expected corrected state | Automated evidence | Hosted verification | Final status |
|---|---|---|---|---|---|
| 002 | Google 403 (origin) / 404 (provider) | Google URL returned; human login completes; no loop/duplicate | config validation tests | origin probes + human Google gate | — |
| 003 | `/profile/saved` always errors | list/empty/login/retry states | helper + page tests | QA Guest: empty, save, list, unsave | — |
| 004 | Test-fee copy visible | no test wording once the owner-approved policy is deployed; production guard fail-closed | disclosure + guard tests | review screen + policy probe | **STILL EXTERNALLY BLOCKED until H2 values supplied** |
| 040 | Ended event quotable | all sale paths reject ended | boundary + service + gateway tests | `halloween` page/quote/RSVP/public feed | — (hold/Pay in PA) |
| 005 | SSO/CORS/trusted gaps | `guest.thec1rcle.com` trusted/CORS correct (H3); root-domain cutover verified at release | — | guest-domain header/origin probes now; root-domain probes at cutover | — (cutover part EXTERNALLY BLOCKED) |
| 006 | Missing surfaces | support-mediated deletion request entry (H6 decided); no new routes | form test | `/help` deletion request visible | — |
| 007 | `Secure=false`, no CSP, `public` session | Secure cookie, `no-store`, CSP | header tests | header probes | — |
| 008 | waterfall + PII | PII minimised (M1); ≤N auth calls (M5) | payload + call-count tests | network capture | — |
| 009 | promo failure blanks totals | totals stay; honest promo copy | error-map tests | invalid promo run | — |
| 010 | no refund policy; dup description | policy shown; no dup | renderer tests | event pages (3 policy kinds) | — |
| 011 | test/past data public | feed clean (approved cleanup) | mapper tests | public API + UI lists | — |
| 012 | Profile LCP 4.3–5.1s | per M5 target | — | LCP re-measure | — |
| 013 | no error capture/request-id | header + capture | header test | induced error | — (trace → PA) |
| 023 | thin settings, no deletion | deletion request entry | form test | settings walk | — |
| 024 | 14px/10px inputs | ≥16px on mobile | class tests | font-size probe 390 | — (iOS → device) |
| 025 | misleading quote errors; wallet hang | honest per-code messages | error-map tests | injected 400/409/500/network | — |
| 026 | 427 KB / 1,700 refs | per M5 budget | img-count test | HTML size + req count | — |
| 030 | card ₹800 vs ₹650 | consistent phase-aware price | mapper tests | 3 events UI vs API | — |
| 031 | UI allows 6, max 4 | clamp to `maxPerOrder` | clamp tests | qty 5 run | — |
| 032 | no country picker | India default + normalisation | normaliser tests | phone step | — (SMS → final gate) |
| 038 | cold "off the circuit" | no false-missing; Retry | timeout/404 tests | 3×3 cold loads | — |
| 039 | silent sold-out | "Sold out" state | render tests | sold-out event | — |
| 049 | sign-out no trap | trap + restore | dialog test | keyboard script | — |
| 051 | contrast fails | AA on listed items | token tests | contrast script | — |
| 001r | 2 × 403 posters, 47 none | cleaned/validated | host-validation test | feed + image status | — |
| 014 | `₹442.5` | 2 decimals when needed | formatter table | checkout totals | — |
| 015 | dead Wallet control | **parked (C)** | — | confirm unchanged | — |
| 016 | inert pre-hydration | **parked (C)** | — | note | — |
| 017 | VIP preselected | **parked (C)** | — | note | — |
| 018 | mobile layout | **parked (C)** | — | note | — |
| 019 | copy/help redirect | **parked (C)** | — | note | — |
| 020 | recovery 404 noise | `200/204` none state | contract test | console clean | — |
| 021 | `/terms` 5.9s | retest | — | median of 5 | — |
| 022 | N+1 + swallowed | aggregate + partial-failure UI | aggregate tests | network capture | — |
| 027 | stale code | **parked (C)** except absorbed | — | note | — |
| 028 | confirm dialog | **parked (C)** | — | note | — |
| 033 | state not in URL | **parked (C)** | — | note | — |
| 034 | 320px CTA, small selects | reachable CTA; ≥16px | layout test | 320 run | — |
| 035 | QR while pending | decision at Transfer Acceptance | — | — | EXTERNALLY BLOCKED |
| 041 | RSVP CTA stale | **parked (C)** | — | note | — |
| 042 | stale QR copy | **parked (C)** | — | note | — |
| 043 | soft 404 | real 404s | status tests | status probe | — |
| 044 | "TOTAL PAID ₹0" | **parked (C)** | — | note | — |
| 045 | no test-phone bypass | bypass on staging | — | phone step run | — |
| 046 | 201 replay vs 409 doc | **parked (C)** (doc only) | — | note | — |
| 048 | Back-to-event inert | closes drawer | control test | drawer run | — |
| 050 | nested main | single main | DOM test | `/hosts` | — |
| 052 | tiny targets | ≥24px | size tests | target script | — |
| 053 | login focus | focus + aria | a11y test | login failure | — |
| 054 | slow nav no feedback | **parked (C)**; server share via M5 | — | timing note | — |

Parked rows are verified only as "unchanged/no regression"; they carry into the Quality Pass backlog.

---

## I. Risk register (fixes most likely to cause regressions)

| # | Risk | Area | Mitigation / watch |
|---|---|---|---|
| R1 | **Sale cutoff blocks legitimate sales, or `started` events now sell unexpectedly** (end-time/timezone mistakes, events running past midnight, `endAt` missing → start+6h, door/admission/analytics code assuming sales stop at start) | Checkout, RSVP, door, Partner | Boundary matrix with injected clock incl. `started`; read door/inventory/pricing/analytics code for such assumptions before enabling `started` sales; door-sales path untouched; hosted smoke on future events (and a started-state event only with owner-approved test data) |
| R2 | **In-flight payments rejected after cutoff** (money taken, no ticket) — specifically attempt creation after cutoff for a pre-cutoff hold (L3(b)) | Checkout/payments | Pre-cutoff attempts finish within TTL; compensation path tested; owner may override L3(b); verify at Payment Acceptance |
| R3 | `salesStatus` changes public DTOs → **Partner/scanner/other consumers break** | Public APIs, Partner | Additive fields only; keep old fields; grep consumers; contract tests |
| R4 | **Cookie `Secure`/rescoping change logs everyone out or breaks callback** | Auth | Env-aware flag; test both cookie names; hosted login/logout/2nd-tab/old-cookie run; do before Google go-live |
| R5 | **CSP enforcement breaks Razorpay/Firebase/reCAPTCHA/images** | Checkout, Auth, Media | Report-Only first; source inventory; enforce only after clean window |
| R6 | Backend/frontend **contract copies drift** | All | Change both in same milestone; contract round-trip tests |
| R7 | Onboarding payload minimisation breaks the onboarding guard/forms | Auth/onboarding | Keep separate full-data endpoint for onboarding/profile edit; e2e new-signup flow |
| R8 | Price "from" recomputation changes sort/filter results or Partner displays | Discovery | Compute at read; verify price-sort and card/CTA parity on 3+ events |
| R9 | Fee-policy guard blocks staging/production start | Gateway | Guard keyed to `environment=production`; H2 policy ready before M2 merge |
| R10 | Directory error-state change hides real outages (retry loops, masked 5xx) | Directory | Bounded retries; explicit 5xx; request-id in UI |
| R11 | Tickets enrichment aggregate breaks Wallet consumers | Ticketing | Keep existing endpoints; add, don't replace; consumer check |
| R12 | Performance work (auth bootstrap, caching) reintroduces stale auth/visibility | Auth, Discovery | No caching of user-specific or visibility-sensitive data; call-count tests |
| R13 | Data cleanup unpublishes events Partners rely on | Data | Owner-approved list; reversible (unpublish, not delete) |
| R14 | Touch-target/contrast changes cause overflow at 320px | Mobile | Re-run overflow checks at 4 widths |
| R15 | Stub of Google config merges before provider ready → login worse | Auth | Config done first by human; hosted probe before enabling button copy |

Highest regression exposure: **R1/R2 (checkout), R4 (auth), R3/R8 (public APIs/discovery)**.

---

## J. Final readiness gate

`GUEST PORTAL FUNCTIONALLY CLEAN — READY FOR EXPERIENCE QUALITY PASS` may be stated only when **all** are true:

1. **P0 = 0 and P1 = 0** — including **GUEST-004 closed with the owner-approved fee policy deployed (H2)**, and GUEST-002/003/040 FIXED. GUEST-005 is verified for `guest.thec1rcle.com`; its **root-domain cutover part is carried to the launch-cutover gate (§F), not this gate** (H3). 
2. Every **A and B** finding scheduled in M1–M6 is **FIXED** in Claude's re-acceptance (no PARTIALLY FIXED/REGRESSED); every **D** item is done or an explicit owner-accepted exception is recorded.
3. No **NEW DEFECT** ≥ P2 open from the re-acceptance sweep; regression anchors hold (₹650 / `STAGE001` / ₹636.78; RSVP create→duplicate→cancel with capacity restored; login/logout/old-cookie 401).
4. Google login **completed by a human on staging**; new-signup + email verification + onboarding + phone step (test number) passes; existing users are not re-onboarded.
5. `halloween`-class events (ended, still `published` in storage) are rejected on every sale path *at API level*, not only hidden in UI.
6. Performance targets in M5 met (or exceptions accepted by you in writing); no CLS regression.
7. Phase 27 browser-testable items re-run clean (contrast list, dialog focus, landmarks, targets); screen reader and real iOS **explicitly listed as still open** in the register (they gate *launch*, not this milestone).
8. The §F register is **carried forward intact** — Payment Acceptance, Transfer/Refund execution, real SMS, device/screen-reader, DB-layer, production-domain verification remain required **launch** gates; "functionally clean" does **not** mean "launch ready".
9. Claude's re-acceptance report is committed; score recomputed from evidence only.

Only then does the Guest Experience Quality Pass (Phases 17/33) get planned — separately.
