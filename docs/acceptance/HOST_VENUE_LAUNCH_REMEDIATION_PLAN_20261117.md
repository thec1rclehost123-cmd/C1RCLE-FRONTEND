# C1RCLE Host + Venue — Launch Remediation Plan

- **Date:** 2026-11-17 · **Type:** planning document only. No code, config or data was changed to produce it.
- **Built from:** `PARTNER_DASHBOARD_LAUNCH_AUDIT_20261117.md`, `HOST_VENUE_EXTREME_ACCEPTANCE_20261117.md`, `FINANCIAL_ENGINE_FORENSIC_AUDIT_20261117.md`, and the email/Resend investigation inside the second report.
- **Scope:** Host Studio + Venue Studio, the backend they depend on, and the Guest-side items that block Host/Venue revenue. **Excluded by instruction:** Promoter Studio (PARTNER-014 carried forward untouched).
- **Lifecycle assumed:** this plan → Codex implementation per milestone → Claude independent re-acceptance per milestone → (after M5) the separate Partner Experience Quality Pass → final experience acceptance.
- **Sizing:** one *work unit* ≈ one engineer-focused-week including tests. Five milestones of **20 units each (100 total)**, sequenced so each ends in something that can be re-accepted on staging.

---

## 1. What "launch ready" means here (the exit bar)

A real Host and a real Venue operator can, on staging and then production, without engineering help:

1. Publish availability, request a night, have it reviewed and accepted, and see the event published — **every time**, with no wedged or orphaned records.
2. Run the Venue's night from the Venue Studio (see Host events at its venue, sales/attendance it is entitled to, calendar identity, notifications, door).
3. Trust every money number they see, with definitions, and understand what they will be paid and when.
4. Be told (in-app and by email) when something that affects them happens.
5. Operate on a phone, with truthful error states and no internal jargon.
6. Have refunds, cancellations, disputes and payouts handled by a safe, reconciled financial engine under a **written, approved commercial policy**.

Anything not on that list (guestlists, curated approval, code-gated tiers, polished Edit/Door UI, Promoter redesign, animations) is **post-launch** (§8).

## 2. Decisions the business owner must make first (they block engineering)

Engineering must not choose these. Most can be answered in one working session; **M4 and parts of M5 cannot start until D1–D14 are answered.** Product decisions P1–P6 block M2/M3 items.

| # | Decision | Blocks |
|---|---|---|
| D1 | Do Guests pay platform + payment fees? (currently 5 % + 2.5 % + GST on fees, test policy) | W4.1, W4.2, W4.5 |
| D2 | Does the Host also pay a plan fee, and do they stack? (currently 15 % Basic) | W4.1, W4.2 |
| D3 | Is a Basic/Silver/Diamond plan system in V1, or one flat rate / per-Host override? | W4.2 |
| D4 | Who absorbs payment-processing cost? | W4.5 |
| D5 | What do "Money made", "Gross", "Net revenue", "Proceeds" mean for a Host? | W4.4 |
| D6 | Venue share: optional, mandatory, or none in V1? | W2.4, W4.4 |
| D7 | Order of Promoter commission vs Host fee | W4.2 |
| D8 | Settlement timing (currently 75 % at 24 h, 100 % at 72 h after event end) | W4.3 |
| D9 | Reserve policy (currently a delay, not a deduction) | W4.3, W5.1 |
| D10 | Refund economics (guest: admission only; organizer-caused: full incl. fees) | W5.1 |
| D11 | Host-caused cancellation liability and clawback | W5.1 |
| D12 | Tax treatment of the Host plan fee and who remits what | W4.5 |
| D13 | Chargeback policy (automatic hold? reserve?) | W5.2 |
| D14 | Payout mode (manual operator transfer vs automated provider) | W5.1, W5.2 |
| P1 | Exactly which Host-owned metrics a Venue may see (sold count, revenue, attendee names, audience) — read-only | W2.4 |
| P2 | Is Venue-published availability a **hard constraint**, a hint, or optional? | W1.1 |
| P3 | May a Venue mint scanner codes for Host events at its venue? | W2.6, W5.3 |
| P4 | Which notifications are mandatory vs optional, and which also go to email? | W3.1 |
| P5 | Waitlist: remove from V1 UI or implement? (backend already returns 410) | W3.5 |
| P6 | Marketing composer: hide until channels exist, or build one channel for launch? | W3.6 |

## 3. Milestone overview

| M | Name | Units | Primary layers | Exit gate |
|---|---|---:|---|---|
| **M1** | Host↔Venue request/publish loop integrity | 20 | backend + Partner FE | 20 consecutive loops incl. failure injection leave zero orphans |
| **M2** | Venue-centric Studio | 20 | backend read models + Partner FE | Venue sees and can operate every Host event at its venue, read-only |
| **M3** | Notifications, email, lifecycle and honest error states | 20 | backend + email + Partner FE | every state change notifies; no dead-end or jargon states |
| **M4** | Financial truth and Host transparency | 20 | backend finance + Partner FE | one definition per number; journal v2 verified on staging; approved policy |
| **M5** | Operational safety, Door, performance, launch | 20 | backend + FE + ops | independent re-acceptance passes; go/no-go |

**Sequencing:** M1 and M2 can start together (different files; M2's calendar work depends on M1's slot model after W1.1). M3 starts after M1's request model is stable. **M4's decisions (D1–D14) should be collected during M1–M2** so M4 can start immediately after M2. M5 is last and contains the final re-acceptance.

---

## 4. Milestone 1 — Host↔Venue request/publish loop integrity (20 units)

**Why first:** this is the operating loop. Today a wizard-created request inside a Venue's published window cannot be accepted and ends wedged; failed accepts leave orphans; Hosts cannot withdraw; hosts cannot see why a request was rejected.

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W1.1 | **One availability model** (decide P2). Wizard must bind a request to a real slot when one is open, or create an interval that cannot collide with the Venue's own open window; Venue must be able to edit/unpublish an open window; availability endpoint and calendar must agree | 4 | PARTNER-031, 045, 054 | `venue-service` request/accept overlap logic; `/venues/{id}/availability` vs `/calendar`; wizard date/time step (`free-…` slot synthesis) | A request made in the browser inside an open window is accepted first time; unpublishing works; availability and calendar return identical sets |
| W1.2 | **Atomic accept + repair.** Accept must create the event, tiers and slot booking as one unit (or compensate fully); idempotent replay must recover; one-off data repair tool for the wedged request and the orphan draft | 4 | PARTNER-032, 031 (data) | `acceptRequest` (event create → tier create → slot transition); idempotency store | Injected failure at each step leaves either full success or full rollback; replay converges; zero orphan drafts; wedged request `728f365e` repaired or archived |
| W1.3 | **Withdraw/cancel a pending request** with an embedded draft; window state on cancel is correct (does not destroy the Venue's window); same for Venue decline | 3 | PARTNER-033, 034 | `venue-service.cancel` (`eventId` pre-allocation vs event existence); slot transitions | Host can withdraw any pending request; Venue window survives; no phantom "booked" slots |
| W1.4 | **Reject with reason, Venue request detail, resubmit.** Reason stored and returned; Venue sees price, capacity, poster, summary and any collision before deciding; resubmit-after-reject path is explicit | 3 | PARTNER-035 (reason), Phase 8/9/10 gaps | request DTO + Slot Requests screens (`slot-requests/*`) | Host sees reason; Venue can judge a night from its detail screen; resubmit keeps edits |
| W1.5 | **Decision UX:** Accept/Decline shows progress, success and failure immediately, list refreshes, buttons disable; reduce the ~7 s accept latency (parallelise tier creation / measure) | 2 | PARTNER-036 | slot-request action hook + BFF route | Click → visible acknowledgement < 300 ms; final state < 3 s p95 on staging |
| W1.6 | **Wizard hygiene:** clear the draft after successful submit; require/decide poster policy; surface field-specific validation messages (venue change, localhost poster, capacity); populate event capacity; stop globally-unique client tier ids from colliding | 3 | PARTNER-046, 053, 050, 020, 051 | wizard draft persistence (delete-then-put sequence), event contract capacity, tier id generation | "Create event" opens blank after submit; submit without poster follows policy; errors name the field |
| W1.7 | **Loop test harness:** automated E2E for request → accept/reject/withdraw → publish, with failure injection and a **second Host account fixture** (enables cross-Host collision proof) | 1 | Phase 11 gap, regression for all of M1 | `apps/api-gateway/scenarios`, Partner e2e | CI runs the matrix; second-Host collision case proven |

**M1 exit:** Claude re-runs Phases 6–11 of the acceptance audit hosted, including: UI-created request inside an open window, forced accept failure, Host withdraw, reject-with-reason, resubmit, cross-Host collision.

---

## 5. Milestone 2 — Venue-centric Studio (20 units)

**Why second:** the audit's central product requirement. The Venue must see *what is happening at its venue* without owning the events, with **visibility ≠ ownership** preserved.

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W2.1 | **Venue read model** for events at the venue (upcoming/live/past, status, Host name, poster, sold count per P1), excluding Host **drafts** and unaccepted drafts from list responses; consistent list/detail eligibility | 3 | PARTNER-007, 001 (data) | `listForVenueOrganization` / `getForVenueOrganization`; 1,000-order scan | Drafts never appear for Venue; list and detail agree; payload includes what the UI needs |
| W2.2 | **Venue Overview + Events rewiring:** overview cards, upcoming list and performance use the venue read model; Events default shows all events at the venue with Host/Venue/All filter (no hidden "Hosts" toggle); cards show Hosted by, poster, date, sold; status vocabulary ("On sale" vs "Live now") | 4 | PARTNER-001, 002, 019 | `lib/overview/*`, `lib/events/load-partner-events.ts`, Venue screens | With 10+ Host events the Overview/Events show them with no extra clicks; empty state only when truly empty |
| W2.3 | **Calendar identity and slot lifecycle:** day detail shows event title, Host, status, link to workspace; default selected date = today; cancelled/postponed events release (or visibly reassign) the slot and no longer block re-request | 3 | PARTNER-002 (calendar), 039, 034 (calendar) | calendar API block labels, `venues/{id}/calendar`, venue calendar UI, overlap guard | Clicking a booked day opens the right event; cancelling an event frees its night; re-request succeeds |
| W2.4 | **Venue analytics, marketing/audience and attendee awareness** for Host events at the venue, within P1/D6: org-level and event-level aggregates, tickets/RSVPs/check-ins, read-only | 4 | PARTNER-003 | analytics service (`ownerOnly` filters), `marketing/audience`, venue analytics screens | Venue analytics equal the sum of the venue's events' authorised metrics; test order and RSVPs appear; no Host-only controls or PII beyond policy |
| W2.5 | **Venue event workspace:** tabs for summary/sales/crowd/door with truthful denial states; Host-only controls absent, not hidden; Edit URL shows a correct "view only" state instead of "Event unavailable" | 2 | PARTNER-018, 003 (workspace) | `components/venue/event-detail/*`, shared workspace permissions | Venue never sees Host actions; no contradictory "loaded header + unavailable" state |
| W2.6 | **Venue global search and Door entry:** search finds events at the venue; Door "Open Door Mode" works for Host events per P3 (or is removed) | 2 | PARTNER-038, 037 | partner search service, venue door screens, door-code authorization | Search returns venue events; Door CTA leads to a working screen or is absent |
| W2.7 | **Price truth everywhere:** one definition of "starting/current price" (active phase) in Host list, Host/Venue workspace, public summary, discovery; base price shown only as base | 2 | PARTNER-012 | `startingPricePaise` computation (event summary), public discovery DTO, workspace headers | Early Bird event shows the active price on every surface; transitions at phase boundaries |

**M2 exit:** Claude re-runs Phases 3, 5, 13, 15, 23, 33, 35 hosted; the Venue acceptance table in the audit (§E) must have no "Fail" rows other than items intentionally deferred.

---

## 6. Milestone 3 — Notifications, email, lifecycle and honest error states (20 units)

**Why third:** once the loop and Venue views are correct, every state change must reach the right person, email must be safe, and the UI must never lie about failures.

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W3.1 | **Notification producers + inbox for Host/Venue** (decide P4): request submitted/accepted/rejected/cancelled, event published/edited, postponed/cancelled, Guest refund request, purchases (digest), with preferences and email where mandatory | 4 | PARTNER-013, 035, 040, 049, 057 | notification events + consumers (producers currently absent), `partner-inbox` BFF | Every transition in the M1 matrix yields the right in-app notice for the right org; none duplicated on replay |
| W3.2 | **Lifecycle + Edit Event baseline:** postpone/cancel flows notify Host, Venue and ticket holders; Guest still reaches tickets; liability/refund messaging; Edit Event adds poster, material-change warning (venue change or >12 h) with refund-right preview, and reflects changes to Venue | 4 | PARTNER-040 (lifecycle), 017, Phases 21/26/27 | event lifecycle service, edit screen, public availability rules | Postpone/cancel on an event with tickets produces correct tickets state, notices and Venue calendar state; Edit shows impact before save |
| W3.3 | **Staff-invitation and auth-email hardening:** no plaintext temporary sign-in credential in email (accept-link flow); revoke deprovisions any account created for the invite; email/provisioning failures surfaced to the inviter; idempotency key + bounded retry for auth emails | 4 | PARTNER-055, 056 | `organization-service.createInvitation`, credential provisioner, `ResendEmailSender` auth path | Invite → accept works with no credential in the message; revoke leaves no account; a forced mail failure shows "not delivered" to the Host |
| W3.4 | **Email/outbox operations:** decide and enable workers in staging (outbox drain/retry), remove the hard-coded personal test-recipient from config, define provider environment per stage, delivery verification procedure (inbox + Admin delivery view), alerting on permanent failures | 3 | PARTNER-058, FIN-013, Resend §| config validation, `render.yaml`/environment docs, communications admin route | A synthetic receipt, invitation and cancellation email are delivered and visible in the delivery record; failures retry and alert |
| W3.5 | **One honest state system:** distinct not-found / forbidden / signed-out / server-failure / feature-unavailable components; revoked-session event routes redirect to sign-in; waitlist UI removed/disabled per P5; internal jargon and dead routes removed; money/number formatting and plural grammar; "LIVE"-style status copy | 3 | PARTNER-009, 010, 011, 022, 019 (copy), 047 | Partner `error.tsx`/route guards, waitlist screens, copy | Every previously-observed dead-end renders the correct state; no "endpoint", "tenant-scoped", "Partner V3 foundation", "HTTP status" text in UI |
| W3.6 | **Marketing composer** (P6): hide or ship one real channel; no screen advertises an unavailable channel | 1 | PARTNER-044 | marketing screen | Composer matches reality |
| W3.7 | **Onboarding/KYC path:** fix `onboarding/me?requestedType` 500 (verify index deployment); prove "no operational access before KYC approval" with pending/rejected fixtures; **Guest-side:** stop sending phone-incomplete users to Explore or make the gate visible earlier | 1 | PARTNER-005, PARTNER-043 (Guest), Phase 1 gap | onboarding service + Firestore indexes; Guest onboarding step logic | Wizard resume works; pending/rejected Partner is confined; Guest cannot reach a late hard 403 unexpectedly |

**M3 exit:** Claude re-runs Phases 3, 27, 28, 34, 42 hosted plus an email delivery check by a human (inbox) — the report's open HUMAN CHECK is closed.

---

## 7. Milestone 4 — Financial truth and Host transparency (20 units)

**Prerequisite:** D1–D14 answered. **Why here:** the engine is arithmetically sound but inconsistent in what it exposes and what is configurable; real money is structurally blocked until a production policy exists.

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W4.1 | **Written commercial policy spec** from D1–D14 (rates, stacking, plan model, tax, settlement, reserve, refund/cancellation, payout mode) with an owner sign-off record | 2 | FIN decisions 1–14 | docs; policy version string | Signed policy v1 referenced by code |
| W4.2 | **Single source of truth for fees and policy:** one Host-fee source; delete dead fee tables/constants; Admin controls either drive the live calculation or are removed (platform fee rate, commission adjust, accounting policy); fix naming collisions; **versioned production booking-fee policy** replacing the test-only type; migrate onboarding/org fields; frozen-snapshot guarantees retained | 4 | FIN-001, 003, 006, 007, 016 | `onboarding.ts` plan table, `ledger.ts` tier table, `platform-settings`, `admin-ops-service.adjustCommissionFromProposal`, `booking-fee-policy`, config validation | Changing the Admin fee demonstrably changes a *new* order and no existing order; one table remains; production-eligible policy exists behind approval |
| W4.3 | **Journal v2 becomes the read model, verified on staging:** run backfill → compare → cut-over with rehearsed rollback; decide workers; align accounting-policy metadata with the real settlement schedule; confirm staged settlement against time-travel tests | 4 | FIN-002, 014, 007 | `journal-transition-service`, `finance-service.getBalances`, settlement tests | Staging reads v2 with zero discrepancies; 24 h/72 h behaviour proven with controlled event dates; rollback rehearsed |
| W4.4 | **Host/Venue finance surfaces with defined metrics:** gross, buyer fees, GST, platform fee, Venue share, promoter share, Host proceeds, payable, reserve, paid; correct labels ("Money made", "Net revenue"); show GST (DTO field); fix org-overview staleness and RSVP counting; Venue share view per D6; explanatory tooltips; order-level breakdown | 5 | PARTNER-004, 041(accounting), 042, FIN-008, 009 | finance/analytics services + DTOs (`financeOrderToDto`), Finance/Analytics screens | For the canonical Test order every Host/Venue number reconciles to the journal and carries a label equal to its meaning; no false ₹0 |
| W4.5 | **Tax and provider cost representation:** tax on fees per policy and on the Host fee per D12, journaled as liabilities; provider fee/tax recognised for every capture with a reconciliation report of the buyer payment fee vs actual cost; Razorpay settlement modelled to clearing | 3 | FIN-010, 011 | posting service, provider payment service, reconciliation | Journal shows tax liability for every taxable component; monthly margin report (fee revenue − provider cost) |
| W4.6 | **Arithmetic hardening:** replace floating-point split/rate math with integer basis points; property-based tests for conservation incl. odd paise and multi-party splits; clarify legacy ledger statuses | 1 | FIN-012, 017 | `computeSettlementSplit`, refund apportionment, ledger status semantics | Randomised tests prove split sums to gross and refunds never exceed paid |
| W4.7 | **Finance re-acceptance harness:** automated reconciliation of one order across Guest, provider, legacy, journal and UI | 1 | Phase 18/34 gap | scenarios + report | Re-runnable ₹-map check in CI |

**M4 exit:** Claude re-runs the financial forensic audit Phases 6, 8, 10, 11, 19, 25, 26, 34 and re-scores; the "₹979.65 money map" must have no unexplained rows.

---

## 8. Milestone 5 — Operational safety, Door Mode, performance and launch (20 units)

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W5.1 | **Refund, cancellation and payout safety:** payable-balance awareness for refunds, negative-balance handling and recovery (receivable/clawback per D11), Host-caused cancellation economics per D10/D11, provider-cost absorption rules, payout-mode decision D14 implemented (manual flow hardened or automation) | 4 | FIN-004, 015 | `refund-service`, `postRefund`, `payout-service`, admin payout service | Refund after payout is detected, recorded as a receivable and blocked/handled per policy; cancellation economics match the signed policy |
| W5.2 | **Disputes and reconciliation automation:** provider dispute events place automatic holds on Host proceeds (D13); scheduled reconciliation with alerts; payout gating on unreconciled state in every read model; worker enablement for these jobs | 3 | FIN-005, 018, 013 | webhook ingestion, dispute/chargeback postings, reconciliation service | A simulated dispute holds funds within one event cycle; unreconciled orders block payout |
| W5.3 | **Door Mode MVP:** attendee list and search, manual check-in, live counts, admission source, invalid/duplicate/cancelled states, Host and Venue access per P3, scanner launch, QR window and clear deny reasons (correct `not opened yet` vs `closed`) | 4 | PARTNER-006, 037, 048 | `door/*` services and routes, Partner Door screens | A synthetic night is operated end-to-end from a phone: scan, search, manual admit, duplicate, cancelled ticket, counts update for Host and Venue |
| W5.4 | **Performance:** remove the repeated bootstrap waterfall and duplicate `access` call, cache org/session safely, cut LCP on Create/Partners/Calendar/Settings, remove 1,000-order scans for counts, accept latency | 3 | PARTNER-015 | auth/bootstrap hooks, SSR loaders, read models | Targets agreed from baseline (e.g. LCP ≤ 3 s on key routes at the audit's baseline conditions); one `access` call per navigation |
| W5.5 | **Mobile + accessibility:** tap targets ≥ 44 px on header and calendar controls, visible focus on nav, single `main`, skip link on Create, keyboard paths for Accept/Door; real-device pass | 2 | PARTNER-016, 025 | shell components, CSS, calendar | Axe/keyboard checks clean; real-device test plan signed |
| W5.6 | **Security hardening:** stop returning the access credential in login JSON (or document and mitigate), authorization-before-validation ordering, partner-type-aware permissions, minimise Host-visible buyer names per policy | 1 | PARTNER-023, 024, 026, 027 | auth BFF, permission mapping | Re-run tenant-isolation matrix with zero regressions |
| W5.7 | **Retire dead code:** legacy `/venue`, `/host`, `/promoter` trees and `components/venue` superseded modules after import analysis; fixture data source; swallowed-error review | 1 | PARTNER-028, Phase 35 | frontend tree | Dead code removed with no route regressions |
| W5.8 | **Launch readiness:** deploy provenance (exposed build id behind auth or deploy record), synthetic QA data cleanup, monitoring/alerts, runbooks (refund, cancel, payout, journal rollback), data hygiene (021), final independent re-acceptance of Phases 0–47 and the financial audit, go/no-go | 2 | PARTNER-021, Phase 0/36/45, provenance limitation | ops + docs | Written go/no-go with all P0/P1 closed |

**M5 exit:** both launch questions answered: *safe to accept real customer money* and *safe to enable Host payouts* (these may land on different dates).

---

## 9. Coverage matrix (every finding → where it is fixed)

**Partner/Host-Venue findings**

| IDs | Milestone / item |
|---|---|
| 001, 002, 019 | M2 W2.2 (019 copy also M3 W3.5) |
| 003 | M2 W2.4, W2.5 |
| 004, 041, 042 | M4 W4.4 |
| 005 | M3 W3.7 |
| 006, 037 | M2 W2.6, M5 W5.3 |
| 007 | M2 W2.1 |
| 008 | M5 W5.8 (data cleanup of localhost posters) + M1 W1.6 (policy) |
| 009, 010, 011, 018, 022 | M3 W3.5 (018 also M2 W2.5) |
| 012 | M2 W2.7 |
| 013, 035 (notify part), 040, 049, 057 | M3 W3.1, W3.2 |
| 015 | M5 W5.4 |
| 016, 025 | M5 W5.5 |
| 017 | M3 W3.2 |
| 020, 046, 050, 051, 053 | M1 W1.6 |
| 021 | M5 W5.8 |
| 023, 024, 026, 027 | M5 W5.6 |
| 028 | M5 W5.7 |
| 031, 045, 054 | M1 W1.1 |
| 032 | M1 W1.2 |
| 033, 034 | M1 W1.3 (034 calendar part M2 W2.3) |
| 035 (reason) | M1 W1.4 |
| 036 | M1 W1.5 |
| 038 | M2 W2.6 |
| 039 | M2 W2.3 |
| 043 (Guest) | M3 W3.7 |
| 044 | M3 W3.6 |
| 047 | M3 W3.5 |
| 048 | M5 W5.3 |
| 052 (Guest home never idle) | Guest backlog (see §10); not a Host/Venue item |
| 055, 056 | M3 W3.3 |
| 058 | M3 W3.4 |
| 014 (Promoter Settings) | **Out of scope by instruction** |

**Financial findings**

| IDs | Milestone / item |
|---|---|
| FIN-001, 003, 006, 007, 016 | M4 W4.2 |
| FIN-002, 014 | M4 W4.3 |
| FIN-008, 009 | M4 W4.4 |
| FIN-010, 011 | M4 W4.5 |
| FIN-012, 017 | M4 W4.6 |
| FIN-013 | M3 W3.4 / M5 W5.2 |
| FIN-004, 015 | M5 W5.1 |
| FIN-005, 018 | M5 W5.2 |

**Acceptance-audit gaps that were not executable and are scheduled**

| Gap | Where closed |
|---|---|
| Cross-Host collision (needed a second Host account) | M1 W1.7 |
| KYC pending/rejected gating | M3 W3.7 |
| Real email delivery verification | M3 W3.4 (+ human inbox check) |
| Refund completion / Admin finance views | M5 W5.1, W5.8 (Admin access required) |
| Real-device mobile, screen-reader | M5 W5.5 |
| Database/Firestore verification, outbox traces | M4 W4.3, M5 W5.8 (DB access required) |
| Deployed-SHA provenance | M5 W5.8 |
| Door/Scanner exact duplicate, couple confirm, cancelled-ticket scan, offline | M5 W5.3 |

## 10. Deferred (post-launch) and out-of-scope items — explicit

- **Promoter Studio redesign, guestlists, curated approval, controlled/private inventory, code-gated tiers and events, invite → signup → claim flow** (register §11 of the acceptance audit): product expansion, depends on D-decisions and a data-model design pass; not needed for first Host/Venue launch.
- **Polished Edit Event and polished Door UI:** M3 W3.2 and M5 W5.3 deliver the *functional baseline*; visual/interaction polish belongs to the Partner Experience Quality Pass.
- **Experience Quality backlog** (skeletons, animation, microinteractions, empty-state polish, chart transitions): unchanged, after M5.
- **Guest-side items surfaced here** and owned by the Guest team: PARTNER-043 (onboarding order — included in M3 W3.7 as the Host/Venue-blocking part), PARTNER-052 (home page never idle), Guest currency formatting (₹1,088.5 / ₹22.5), "Google sign-in unavailable".
- **Promoter finance:** only the shared financial engine paths (allocation, refunds) are in scope.

## 11. Cross-cutting engineering requirements (apply to every milestone)

1. **Repo rules (from the repos' own CLAUDE.md):** pnpm lockfile discipline (`--frozen-lockfile` in CI; re-add the lockfile after any install); Expo/native versions pinned by the SDK (not relevant to Partner, but do not drift); use the code-review graph for impact analysis, then read the source.
2. **Branching/PRs:** one PR per work item (≤ ~1 week), behind feature flags where behaviour changes for live data; no financial change without its own migration/rollback note.
3. **Tests per item:** unit (domain), contract (API), Partner e2e (Playwright), and a hosted acceptance script that reproduces the audit's original failure and shows it fixed. Finance items add property tests (conservation) and ledger-vs-journal reconciliation.
4. **Data migrations:** every item that changes stored shapes ships a dry-run, a reversible plan and a verification query; **no mutation of existing finance records except through the journal-transition tooling.**
5. **Observability:** surface request ids in UI errors; add trace ids to order → journal → notification; dashboards for accept failures, orphan drafts, email failures, unreconciled orders.
6. **Environment/access needed by the team:** second Host test account; Admin test account with read paths; database/Firestore read access for verification; an inbox for the synthetic addresses; Razorpay Test Mode only until D1–D14 are signed and the production policy exists.
7. **Per-milestone gate:** Claude independent re-acceptance (hosted) → issues fixed → next milestone. A P0/P1 found at gate blocks the milestone.

## 12. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Decisions D1–D14 arrive late | M4/M5 slip | collect during M1–M2; M4 starts only with answers |
| Availability-model change (W1.1) breaks existing windows/requests | regressions in live data | feature flag, migration for open windows, keep accepted history intact |
| Atomic accept (W1.2) is hard on the current store | partial failures persist | saga with compensation + replay + repair tool; failure-injection tests |
| Journal cut-over (W4.3) discrepancies | wrong balances | comparison gate, staged rollback rehearsal, never add models |
| Enabling workers surfaces latent retry bugs | duplicate emails/effects | idempotency audit first; enable in staging with synthetic data |
| Venue visibility becomes a privacy leak | trust/legal | P1 decision, read-only, minimum fields, tenant-isolation re-test every milestone |
| Scope growth into Promoter/guestlist | schedule | §10 firewall |

## 13. Definition of done per milestone (re-acceptance checklist)

- **M1:** hosted loop matrix (accept, reject-with-reason, withdraw, resubmit, forced failure, cross-Host collision) clean; zero orphan drafts and zero `accepted` requests without events in a full sweep.
- **M2:** Venue acceptance table has no Fail; Venue analytics reconcile to Host events; drafts never visible; no Host actions on Venue screens; calendar and search show venue events; early-bird price consistent on all surfaces.
- **M3:** all state changes notify the right org (and email where mandatory); invitation flow safe; no dead-end/jargon states; waitlist/marketing honest; KYC gating and onboarding resume verified.
- **M4:** signed policy; one source of truth per fee; journal v2 live on staging; every Host/Venue money number defined and reconciled; tax and provider cost represented.
- **M5:** refund/dispute/payout safeguards proven by simulation; Door operates a full synthetic night on a phone; performance and a11y targets met; final audit passes; go/no-go recorded.

## 14. Effort summary

| Milestone | Units | Items |
|---|---:|---|
| M1 Request/publish loop | 20 | W1.1 4 · W1.2 4 · W1.3 3 · W1.4 3 · W1.5 2 · W1.6 3 · W1.7 1 |
| M2 Venue-centric Studio | 20 | W2.1 3 · W2.2 4 · W2.3 3 · W2.4 4 · W2.5 2 · W2.6 2 · W2.7 2 |
| M3 Notifications, email, errors | 20 | W3.1 4 · W3.2 4 · W3.3 4 · W3.4 3 · W3.5 3 · W3.6 1 · W3.7 1 |
| M4 Financial truth | 20 | W4.1 2 · W4.2 4 · W4.3 4 · W4.4 5 · W4.5 3 · W4.6 1 · W4.7 1 |
| M5 Safety, Door, launch | 20 | W5.1 4 · W5.2 3 · W5.3 4 · W5.4 3 · W5.5 2 · W5.6 1 · W5.7 1 · W5.8 2 |
| **Total** | **100** | |

The estimates are planning figures from audit evidence, not commitments; the first week of each milestone should re-baseline them against the real code, and the M1 estimate in particular depends on how hard atomic accept (W1.2) is on the current store.
