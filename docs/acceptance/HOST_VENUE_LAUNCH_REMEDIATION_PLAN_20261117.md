# C1RCLE Host + Venue — Launch Remediation Plan (rev 2, Model A)

- **Date:** 2026-11-17 · **Type:** planning document only. No code, config or data was changed to produce or revise it.
- **Built from:** `PARTNER_DASHBOARD_LAUNCH_AUDIT_20261117.md`, `HOST_VENUE_EXTREME_ACCEPTANCE_20261117.md`, `FINANCIAL_ENGINE_FORENSIC_AUDIT_20261117.md` (incl. the Resend investigation), revised by the **owner decisions R1–R10** below, which are authoritative over earlier text.
- **Scope:** Host Studio + Venue Studio, the backend they depend on, and Guest-side items that block Host/Venue revenue. **Excluded:** Promoter Studio redesign (only shared financial-engine compatibility is kept).
- **Lifecycle:** this plan → Codex implementation per milestone (bounded packets) → Claude independent hosted re-acceptance per milestone → after M5 the separate Partner Experience Quality Pass → final experience acceptance.
- **Sizing:** one work unit ≈ one engineer-focused-week including focused tests. Five milestones of **20 units each (100 total)**.

## 0. What changed in this revision

| Area | Change |
|---|---|
| Commercial model | **Model A locked:** no Host-side C1RCLE fee. M4 is rewritten around one buyer-side policy and retirement of legacy Host-fee machinery (no "better configurable Host-fee system"). |
| Venue visibility | Venue gets **operational** visibility of Host events at its venue, **never** Host revenue, payable, fees, commission, settlement or profit. M2 W2.4/W2.5 and M4 W4.4 revised. |
| Event changes | New **material-change request lifecycle** (pending/approved/rejected, Venue reapproval, public event unchanged until approved, ticket validity + refund right, Postpone flow when no replacement). Moved into M3 as the largest item (W3.2). |
| Communications | Resend must reliably carry material-change/postponement/cancellation ticket-holder emails; Host/Venue operational notices; no plaintext temporary-credential invitations (M3). |
| Settlement | Staged 0 % / 75 % / 100 % retained and kept **separate from fees**; the delayed 25 % is Host reserve, not C1RCLE revenue (M4 W4.3). |
| Engineering process | **No one-PR-per-item rule.** Bounded implementation packets, coherent PR boundaries, batched fixes, focused tests while building, full CI-equivalent validation only at the milestone packaging gate (§11). |
| Decision register | Split into **Resolved / Open / Made irrelevant by Model A** (§2). D2/D3/D7/D12 no longer imply a Host platform fee. |
| Preserved | Audit-to-finding coverage (§9), milestone count, 20-unit balance, deferred items (§10). |

## 1. What "launch ready" means here

A real Host and a real Venue operator can, without engineering help:

1. Publish availability, request a night, have it reviewed and accepted, and see the event published — every time, with no wedged or orphaned records.
2. Change an accepted event **only through Venue approval**, with ticket holders protected and informed.
3. Run the Venue's night from the Venue Studio using **operational** information (event, Host, schedule, capacity, ticket/RSVP counts, expected attendance, check-ins/crowd, door) — without seeing the Host's money.
4. Trust every money number they are entitled to see: a Host sees proceeds starting at 100 % of ticket face value less only agreed Venue share / Promoter commission; a Venue sees only money attributable to the Venue.
5. Be told in-app and by reliable email when something that affects them happens, and have ticket holders told reliably about material change, postponement and cancellation.
6. Operate on a phone with truthful states and no internal jargon.
7. Have refunds, cancellations, disputes and payouts handled by a safe, reconciled engine under a written, approved **buyer-side** commercial policy.

Post-launch (see §10): guestlists, profiling/nominations, controlled inventory, code-gated tiers/events, redesigned Promoter Studio, UX polish.

## 2. Owner-decision register

### 2.1 RESOLVED by the owner (authoritative)

| ID | Decision | Effect on plan |
|---|---|---|
| **R1** | **Commercial Model A:** no Host-side C1RCLE platform fee. The Basic/Silver/Diamond 15 %/12 %/10 % Host fee is removed from the intended production model **for new orders**. Historical order snapshots remain immutable. | M4 rewritten; supersedes D2, D3, D7, D12 |
| **R2** | **Host economics:** Host proceeds start at 100 % of ticket face value; only separately authorised allocations (Venue share, Promoter commission) reduce them. C1RCLE monetises on the buyer side. | Allocation math, Host finance labels (M4) |
| **R3** | **Venue operational visibility ≠ Host financial visibility.** Venue sees Host-owned events at its venue and operational data (identity, Host, schedule, capacity, ticket/RSVP counts, expected attendance, check-ins/crowd, other authorised operational metrics). Venue must **not** automatically see Host revenue, Host payable, C1RCLE fees, Promoter commission, Host settlement balances or Host profit/net revenue. Venue financial surfaces show **only money attributable/payable to the Venue**. | M2 W2.1/2.4/2.5, M4 W4.4; resolves old P1 (metrics) |
| **R4** | **Material changes after Venue acceptance need Venue reapproval.** Model as a change-request lifecycle (pending/approved/rejected). Until approved, the existing authoritative public event is unchanged. A Host cannot unilaterally change an accepted event's material schedule/Venue. | M3 W3.2 |
| **R5** | **Sold-ticket material change:** an approved change keeps existing tickets valid for the approved replacement event, notifies affected Guests, and creates/exposes the applicable refund-request right. With no known replacement schedule, use **Postpone**, not ordinary Edit. | M3 W3.2 |
| **R6** | **Resend** must reliably deliver material-change, postponement and cancellation ticket-holder communications and appropriate Host/Venue operational notifications, using idempotency, retry/outbox, delivery evidence and safe environment configuration. **No plaintext temporary-credential staff invitations.** | M3 W3.1–W3.4 |
| **R7** | **Settlement stays separate from fees:** 0 % eligible before 24 h after effective event end, 75 % from 24 h to 72 h, 100 % at 72 h+. The delayed 25 % is Host money/reserve, **not C1RCLE revenue**. | M4 W4.3 (verify, don't redesign) |
| **R8** | **Promoter Studio redesign out of scope**; keep only shared financial-engine compatibility (Promoter commission as an allocation). Guestlists, nominations, controlled inventory, code-gated tiers/events remain a later project. | §10 |
| **R9** | **Bounded implementation packets / coherent PR boundaries**, not one PR per work item. | §11 |
| **R10** | **Testing cadence:** focused checks while implementing; batch related fixes; full CI-equivalent validation only at the milestone packaging gate on the final diff, then GitHub CI and independent hosted re-acceptance. | §11 |

### 2.2 STILL OPEN (genuinely need the owner)

| ID | Decision | Current behaviour | Blocks |
|---|---|---|---|
| **O1** | **Guest-side production fee model:** which fees (platform fee, payment/convenience fee), and their **percentages**. *Not chosen here.* | 5 % + 2.5 % + GST on fees, labelled non-production test policy | M4 W4.1/W4.2 (production policy) |
| **O2** | Who absorbs payment-processing cost; is the payment fee a C1RCLE-priced fee or a pass-through? | C1RCLE-priced fee booked as revenue; provider cost recorded separately only when reported | M4 W4.5 |
| **O3** | **Tax treatment of buyer-side fees:** rate/basis, who remits, whether any other component is taxable. (Host-fee tax is moot under Model A.) | 18 % GST on fees only, journaled as a liability | M4 W4.5 |
| **O4** | **Refund economics for fees:** guest-requested refunds (currently admission only) vs organiser/C1RCLE-caused (currently full incl. fees); who bears provider cost on refunds | as stated | M5 W5.1 |
| **O5** | **Host-caused cancellation liability and clawback** (post-payout recovery, receivable) | not enforced | M5 W5.1 |
| **O6** | **Chargeback policy** (automatic hold, reserve size) | recorded as facts; manual Admin action | M5 W5.2 |
| **O7** | **Payout mode** (manual operator transfer vs automated provider) and when payouts open | manual, gated off | M5 W5.1/W5.2 |
| **O8** | **Venue share mechanics:** how it is agreed/configured (per partnership, mandatory or optional in V1) and its basis | optional per partnership, default 0 % | M2 W2.4, M4 W4.4 |
| **O9** | **Additional refund/dispute reserve** beyond the staged 25 % delay (rolling reserve?) | none beyond staging | M5 W5.2 |
| **O10** | **Venue availability model (old P2):** are published windows a hard constraint, a hint, or optional? | optional/unenforced, but an open window blocks requests inside it | **M1 W1.1** |
| **O11** | **Definition thresholds for change handling:** engineering default proposed — *any* change to start/end/Venue of an accepted event needs Venue reapproval; the **refund right** applies only where the existing materiality rule triggers (Venue change, or start moved > 12 h). Confirm or amend. | in-slot time changes are currently allowed unilaterally | M3 W3.2 |
| **O12** | **Venue attendee-level identity:** may a Venue see names of ticket holders (R3 permits counts/check-ins; names are not stated)? | Venue currently sees none | M2 W2.4 |
| **O13** | Scanner codes: may a Venue mint door codes for Host events at its venue? (old P3) | Venue gets 404; its Door CTA is broken | M2 W2.6, M5 W5.3 |
| **O14** | Waitlist: remove from V1 UI or implement? (backend returns 410) | UI calls disabled endpoint | M3 W3.5 |
| **O15** | Marketing composer: hide until channels exist, or ship one channel? | "Preview only, sending not connected" | M3 W3.6 |
| **O16** | Notification preferences: which Host/Venue notices are mandatory, which optional, which also email (R6 fixes only the ticket-holder lifecycle emails and "appropriate" Host/Venue notices) | none produced | M3 W3.1 |

### 2.3 MADE IRRELEVANT by Model A (retired from the register)

| Old ID | Old question | Why retired |
|---|---|---|
| D2 | Does the Host also pay a plan fee; do fees stack? | No Host fee (R1). |
| D3 | Is a Basic/Silver/Diamond plan system in V1? | The plan's only economic effect was the Host fee; it is retired for new orders. Any non-fee plan concept is not required for launch. |
| D7 | Order of Promoter commission vs Host fee | No Host fee; Venue share and Promoter commission both reduce the Host's proceeds from face value (engineering note: apply on the same face-value base; exact base/rounding rules documented in W4.1). |
| D12 | Tax treatment of the Host plan fee | No Host fee, so no such tax. (Buyer-fee tax remains open as O3.) |
| D1 (old form) | "Do Guests pay fees?" | Answered by R2 (monetisation is buyer-side). Only the **percentages/structure** remain open (O1). |
| D5 | Meaning of Host "Money made / Net revenue" | Answered by R2/R3: Host proceeds begin at 100 % of face; labels derive from that (W4.4). |
| D8 | Settlement timing | Answered by R7. |
| D9 (partial) | Reserve policy | The staged 25 % delay is resolved (R7); any extra rolling reserve is O9. |
| P1 (old) | Which Host metrics a Venue may see | Answered by R3 (operational yes; financial no); attendee-level identity left as O12. |
| P4 (partial) | Which notices are mandatory/email | Ticket-holder lifecycle emails and "appropriate" Host/Venue notices fixed by R6; preference detail is O16. |

## 3. Milestone overview

| M | Name (final) | Units | Primary layers | Exit gate |
|---|---|---:|---|---|
| **M1** | Host↔Venue request/publish loop integrity | 20 | backend + Partner FE | loop matrix with failure injection leaves zero orphans |
| **M2** | Venue-centric Studio (operational visibility) | 20 | backend read models + Partner FE | Venue operates every Host event at its venue, with no Host financial data |
| **M3** | Change management, communications and honest states | 20 | backend + outbox/Resend + Partner FE | material change/postpone/cancel lifecycle and notifications proven end-to-end |
| **M4** | Financial truth under Model A | 20 | backend finance + Partner FE | one buyer-side policy; legacy Host fee retired for new orders; journal v2 verified |
| **M5** | Operational safety, Door Mode, performance and launch | 20 | backend + FE + ops | independent re-acceptance passes; go/no-go |

**Sequencing:** M1 and M2 start together (M2 calendar work follows M1 W1.1). M3's change-request lifecycle needs M1's request/slot model stable. Collect open decisions **O1–O9** during M1–M3 so M4 can start right after M2/M3; **O10 must be answered before M1 W1.1**, **O11 before M3 W3.2**, **O12/O13 before M2 W2.4/W2.6**.

---

## 4. Milestone 1 — Host↔Venue request/publish loop integrity (20 units)

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W1.1 | **One availability model** (needs **O10**). A wizard request binds to a real slot when one is open, or creates an interval that cannot collide with the Venue's own open window; the Venue can edit/unpublish an open window; availability and calendar endpoints agree | 4 | PARTNER-031, 045, 054 | `venue-service` request/accept overlap logic; `/venues/{id}/availability` vs `/calendar`; wizard time step (`free-…` slot synthesis) | A browser-created request inside an open window is accepted first time; unpublish works; availability == calendar |
| W1.2 | **Atomic accept + repair.** Event creation, tier creation and slot booking succeed or compensate as one unit; idempotent replay converges; repair tool for the wedged request and the orphan draft | 4 | PARTNER-032, 031 (data) | accept path (event → tiers → slot), idempotency store | Injected failure at every step leaves full success or full rollback; zero orphans; wedged records repaired/archived |
| W1.3 | **Withdraw a pending request** that carries a draft; Host cancel does not destroy the Venue's window; Venue decline likewise | 3 | PARTNER-033, 034 | `venue-service.cancel` (pre-allocated `eventId` vs non-existent event); slot transitions | Host can withdraw any pending request; windows survive; no phantom "booked" |
| W1.4 | **Reject with reason; Venue request detail; resubmit.** Reason stored/returned; Venue sees price, capacity, poster, summary and collisions before deciding | 3 | PARTNER-035 (reason), Phases 8–10 | request DTO + Slot Requests screens | Host sees reason; Venue can judge a night from detail; resubmit keeps edits |
| W1.5 | **Decision UX:** Accept/Decline shows progress/success/failure, list refreshes, buttons disable; reduce ~7 s accept latency | 2 | PARTNER-036 | slot-request action hook + BFF | Acknowledgement < 300 ms; settled state < 3 s p95 |
| W1.6 | **Wizard hygiene:** clear draft after submit; poster policy; field-specific validation messages; populate event capacity; avoid colliding client tier ids | 3 | PARTNER-046, 053, 050, 020, 051 | wizard draft persistence, event contract, tier id generation | Create opens blank after submit; errors name the field |
| W1.7 | **Loop test harness** incl. a **second Host account** fixture for cross-Host collision proof and failure-injection matrix | 1 | Phase 11 gap | gateway scenarios + Partner e2e | CI runs the matrix; cross-Host collision proven |

**M1 exit:** Claude re-runs Phases 6–11 hosted (browser-created request in an open window, forced accept failure, Host withdraw, reject-with-reason, resubmit, cross-Host collision).

---

## 5. Milestone 2 — Venue-centric Studio, operational visibility (20 units)

**Rule for every item (R3):** the Venue sees *operations*, never the Host's money.

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W2.1 | **Venue operational read model** for events at the venue: identity, Host, status, schedule, capacity, ticket/RSVP counts, expected attendance, check-ins; **excludes Host drafts** and unaccepted drafts; list and detail eligibility agree; **no revenue/payable/fee fields in the DTO** | 3 | PARTNER-007, 001 (data) | `listForVenueOrganization`/`getForVenueOrganization`; avoid per-request 1,000-order scans | Drafts never appear; DTO has no financial fields (contract test); list == detail |
| W2.2 | **Venue Overview + Events rewiring:** overview cards/upcoming/crowd use the read model; Events default shows all events at the venue (Host/Venue/All filter, no hidden toggle); cards show Hosted by, poster, date, counts; status vocabulary | 4 | PARTNER-001, 002, 019 | `lib/overview/*`, `load-partner-events`, Venue screens | With 10+ Host events they appear with zero extra clicks; empty only when truly empty |
| W2.3 | **Calendar identity and slot lifecycle:** day detail shows event title, Host, status, link; default date today; cancelled/postponed events release (or visibly reassign) the slot | 3 | PARTNER-002 (calendar), 039, 034 (calendar) | calendar API labels, venue calendar UI, overlap guard | Booked day opens the event; cancelling frees the night |
| W2.4 | **Venue operational analytics and awareness:** counts, capacity use, expected attendance, check-ins/crowd, aggregated by day/event/venue; attendee-level identity only if **O12** allows; **no Host revenue/net/payable/fees/commission anywhere**; Venue's own attributable money handled in M4 | 4 | PARTNER-003 (operational part) | analytics service (owner-only filters), venue analytics/audience screens | Venue analytics equal the sum of operational counts of its venue's events; test order and RSVPs counted; contract/tenant tests prove no financial leakage |
| W2.5 | **Venue event workspace (operational):** summary, crowd, door, schedule; Host-only controls absent; Edit/Host URLs show a truthful "view only / not yours" state; shows pending change requests (read-only until M3) | 2 | PARTNER-018, 003 (workspace) | `components/venue/event-detail/*` | No Host actions or financial tiles on Venue screens; no "loaded header + unavailable" |
| W2.6 | **Venue search and Door entry** per **O13**: search finds events at the venue; Door CTA works or is absent | 2 | PARTNER-038, 037 | partner search service; door authorization | Search returns venue events; no broken CTA |
| W2.7 | **Price truth:** one definition of "current/starting price" (active phase) in Host list, workspaces, public summary, discovery; base price shown only as base | 2 | PARTNER-012 | event summary computation, public DTO | Early Bird shows the active price everywhere |

**M2 exit:** Claude re-runs Phases 3, 5, 13, 15, 23, 33, 35 hosted and a **negative financial-visibility test**: Venue API/UI/search/exports contain no Host revenue, payable, fee, commission, settlement or profit.

---

## 6. Milestone 3 — Change management, communications and honest states (20 units)

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W3.1 | **Host/Venue operational notifications** (inbox + email where decided in O16): request submitted/accepted/rejected/withdrawn, event published/edited, change-request pending/approved/rejected, postponed/cancelled, Guest refund request, purchase digest; preferences; idempotent on replay | 3 | PARTNER-013, 035, 049, 057 | notification events + consumers; `partner-inbox` BFF | Every transition in the M1/M3 matrices yields the right notice for the right org, once |
| W3.2 | **Material-change request lifecycle (R4/R5):** `pending → approved/rejected` entity separate from the event; public/Guest/Venue-visible event stays unchanged until approval; Venue approve/reject UI with diff; Host sees status; on approval apply atomically; **ticket validity carried to the replacement event**; affected Guests notified; **refund-request right created/exposed** per O11 rule; **Postpone flow** when no replacement schedule; ordinary Edit limited to non-material fields (title, description, poster, tier price/capacity with existing floors); cancellation flow tied to slot release (M2) | 6 | PARTNER-017, 040 (lifecycle), Phases 14/21/26/27 | event lifecycle service, new change-request model/routes, Host Edit screen, Venue approval screen, ticket/QR state, public availability | Matrix proven hosted: no-ticket change; change with tickets; reject; duplicate request; concurrent change vs accept; postpone; cancel. Public event identical until approval; tickets remain valid; refund right visible |
| W3.3 | **Staff invitation hardening (R6):** no plaintext temporary credential — accept-link flow; revoke removes any account provisioned for the invite; credential/email failure surfaced to the inviter; invitation emails idempotent and retried | 3 | PARTNER-055, 056 | `createInvitation`, credential provisioner, auth-email path | Invite → accept works with no credential in the message; revoke leaves no account; forced failure shows "not delivered" |
| W3.4 | **Resend/outbox operations (R6):** reliable ticket-holder emails for material change, postponement, cancellation (and Host/Venue notices) via outbox with idempotency keys, bounded retry, permanent-vs-transient handling, **delivery evidence** (provider id + delivery record visible to Admin/ops), **safe environment configuration** (explicit allow-list per stage, remove the hard-coded personal test recipient), decide/enable workers in staging, alerts on permanent failure | 3 | PARTNER-058, FIN-013 | `ResendEmailSender`, transactional consumer, config validation, `render.yaml` | Synthetic change/postpone/cancel emails arrive and are recorded; failures retry and alert; no unintended recipients in staging |
| W3.5 | **One honest state system:** distinct not-found / forbidden / signed-out / server-failure / feature-unavailable; revoked-session event routes redirect to sign-in; waitlist per **O14**; remove jargon, dead routes, formatting glitches; status copy | 3 | PARTNER-009, 010, 011, 022, 047, 019 (copy) | `error.tsx`/guards, waitlist screens, copy | Every previously observed dead end renders the right state; banned strings absent |
| W3.6 | **Marketing composer** per **O15** | 1 | PARTNER-044 | marketing screen | Composer matches reality |
| W3.7 | **Onboarding/KYC and Guest gate:** fix the `onboarding/me?requestedType` 500 (verify index deployment); prove no operational access before KYC approval; Guest phone/onboarding gate before purchase | 1 | PARTNER-005, 043, Phase 1 gap | onboarding service + indexes; Guest onboarding logic | Wizard resume works; pending/rejected confined; no late surprise 403 |

**M3 exit:** Claude re-runs Phases 3, 14, 21, 26, 27, 28, 34, 42 hosted **plus a human inbox check** of synthetic change/postpone/cancel/invitation emails (closes the open HUMAN CHECK).

---

## 7. Milestone 4 — Financial truth under Model A (20 units)

**Prerequisite:** O1–O3 answered (buyer-side policy, processing-cost treatment, buyer-fee tax). *The plan does not choose the production Guest-side percentages.* **Goal (R1/R2):** one authoritative buyer-side commercial policy; retire misleading legacy Host-fee machinery for new orders; keep historical snapshots immutable; correct journal/finance/analytics semantics. This is **not** a project to build a better configurable Host-fee system.

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W4.1 | **Commercial policy spec v1 (Model A):** buyer-side fees (structure/rates as supplied in **O1**), payment-fee treatment (**O2**), tax on buyer fees (**O3**), Host proceeds = 100 % of face less agreed Venue share/Promoter commission (base/rounding documented), staged settlement unchanged (R7), historical-immutability rules, owner sign-off record | 2 | FIN decisions | docs + policy version identifier | Signed spec referenced by code |
| W4.2 | **One authoritative buyer-side policy; retire legacy Host-fee machinery:** replace the test-only policy type with a versioned production-eligible buyer policy; set Host platform allocation to **zero for new orders** (allocation = face − Venue share − Promoter commission; platform allocation line absent); **remove or retire** the plan fee table, the duplicate plan-tier table, the dead pricing constants, the organisation `platformFeePercent` fee semantics (and its `?? 15` default), the Admin `platformFeeRate`, the dual-control `COMMISSION_ADJUST` for Host fees, and the misleading accounting-policy metadata; **preserve readers for historical snapshots**; migration with dry-run/rollback | 4 | FIN-001, 003, 006, 007, 016 | `onboarding.ts` plan table, `ledger.ts` tier table, `pricing.ts` constants, `platform-settings`, `admin-ops-service`, `snapshotSaleAllocation`, config validation | A new order has no Host platform deduction on any surface; Admin has no control that appears to change Host fees; **old orders replay byte-for-byte** (golden tests); exactly one buyer-policy source remains |
| W4.3 | **Journal v2 as the verified read model + staged settlement (R7):** backfill → compare → cut-over on staging with rehearsed rollback; handle historical orders that carry a legacy Host allocation; time-travel tests for 0 %/75 %/100 % and boundaries; the delayed 25 % shown as Host reserve (never revenue); decide workers; legacy ledger no longer writes a Host `platform_fee` for new orders | 4 | FIN-002, 007, 014 | `journal-transition-service`, `finance-service.getBalances`, `settlement-policy`, `recordSettlement` dual write | Staging reads v2 with zero discrepancies; settlement behaviour proven with controlled dates; rollback rehearsed |
| W4.4 | **Host and Venue finance surfaces with defined metrics:** **Host** — gross ticket value, buyer fees (informational, not Host money), tax (buyer-fee), Venue share/Promoter commission deductions, **Host proceeds**, payable, staged reserve, paid; correct labels ("Money made", "Net revenue" replaced by defined terms); show GST from the DTO; fix org-overview staleness and RSVP counting. **Venue** — only amounts actually attributable/payable to the Venue (Venue share), nothing about the Host's economics. Explanatory tooltips | 5 | PARTNER-004, 041 (accounting), 042, FIN-008, 009 | finance/analytics services + DTOs (`financeOrderToDto`), Finance/Analytics screens | For the canonical test order every Host number reconciles to the journal and carries a label equal to its meaning; **Venue finance tests prove no Host-money fields**; no false ₹0 |
| W4.5 | **Tax and provider cost under Model A:** tax on buyer fees per **O3** journaled as a liability; provider fee/tax recognised on every capture with a margin report (buyer payment fee vs actual cost); provider settlement modelled to clearing | 3 | FIN-010 (buyer fees only), 011 | posting service, provider payment service, reconciliation | Journal shows tax liability for every taxable component; margin report available |
| W4.6 | **Arithmetic hardening:** integer basis-point math for Venue/Promoter allocation and refunds; property tests (conservation incl. odd paise, Venue + Promoter together); legacy ledger status clarification | 1 | FIN-012, 017 | allocation split, refund apportionment | Randomised tests prove splits sum to face and refunds never exceed paid |
| W4.7 | **Finance acceptance harness:** reconcile one new-model order and one **historical** order across Guest, provider, legacy ledger, journal and UI | 1 | Phase 18/34 gap | scenarios + report | Re-runnable ₹-map check in CI; historical snapshot unchanged |

**M4 exit:** Claude re-runs the financial forensic audit (Phases 6, 8, 10, 11, 19, 25, 26, 34) and re-scores. The money map for a new order must have **no Host platform fee**, every paisa explained, and **no Venue-visible Host financial field**.

---

## 8. Milestone 5 — Operational safety, Door Mode, performance and launch (20 units)

| WU | Work item | Pts | Findings | Layer / where to look | Acceptance |
|---|---|---:|---|---|---|
| W5.1 | **Refund, cancellation and payout safety:** refunds aware of the Host's payable position; negative-balance detection and recovery (receivable/clawback per **O5**); refund economics for fees per **O4**; cancellation interaction with staged settlement; payout mode per **O7** (harden the manual flow or implement automation) | 4 | FIN-004, 015 | `refund-service`, `postRefund`, payout services | Refund after payout is detected, recorded and handled per the signed policy; cancellation economics match policy |
| W5.2 | **Disputes and reconciliation automation:** provider dispute events place holds (**O6**, **O9**); scheduled reconciliation with alerts; payout gating on unreconciled state in every read model; enable the workers these need | 3 | FIN-005, 018, 013 | webhook ingestion, dispute/chargeback postings, reconciliation | A simulated dispute holds funds within one event cycle; unreconciled orders block payout |
| W5.3 | **Door Mode MVP:** attendee list and search, manual check-in, live counts, admission source, invalid/duplicate/cancelled states, Host and Venue access per **O13**, scanner launch, QR window, and correct deny semantics ("not opened yet" ≠ "closed") | 4 | PARTNER-006, 037, 048 | `door/*` services/routes, Partner Door screens | A synthetic night is operated from a phone: scan, search, manual admit, duplicate, cancelled ticket, live counts for Host and Venue |
| W5.4 | **Performance:** remove the repeated bootstrap waterfall and duplicate `access` call, cut LCP on Create/Partners/Calendar/Settings, remove 1,000-order scans for counts, accept latency | 3 | PARTNER-015 | auth/bootstrap hooks, SSR loaders, read models | Targets agreed from the audit baseline; one `access` call per navigation |
| W5.5 | **Mobile + accessibility:** tap targets ≥ 44 px, visible focus, single `main`, skip link on Create, keyboard paths for Accept/Door; real-device pass | 2 | PARTNER-016, 025 | shell, CSS, calendar | Automated + keyboard checks clean; real-device plan signed |
| W5.6 | **Security hardening:** access credential not returned in login JSON (or mitigated), authorization-before-validation ordering, partner-type-aware permissions, minimise Host-visible buyer names per policy; **re-run the tenant-isolation matrix incl. the R3 negative financial-visibility test** | 1 | PARTNER-023, 024, 026, 027 | auth BFF, permission mapping | Zero regressions; zero Venue financial leakage |
| W5.7 | **Retire dead code:** legacy `/venue`, `/host`, `/promoter` trees and superseded `components/venue` after import analysis; fixture data source; swallowed-error review | 1 | PARTNER-028 | frontend tree | Removed with no route regressions |
| W5.8 | **Launch readiness:** deploy provenance, synthetic QA data cleanup (incl. the localhost posters and QA records), monitoring/alerts, runbooks (refund, cancel, change request, payout, journal rollback), final independent re-acceptance of Phases 0–47 and the financial audit, go/no-go | 2 | PARTNER-008 (data), 021, Phases 0/36/45 | ops + docs | Written go/no-go with all P0/P1 closed |

**M5 exit:** two separate answers — *safe to accept real customer money* and *safe to enable Host payouts* (they may land on different dates).

---

## 9. Coverage matrix (every finding → where it is fixed)

**Partner / Host-Venue findings**

| IDs | Milestone / item |
|---|---|
| 001, 002, 019 | M2 W2.2 (019 copy also M3 W3.5) |
| 003 | M2 W2.4, W2.5 (operational only, per R3) |
| 004, 041, 042 | M4 W4.4 |
| 005 | M3 W3.7 |
| 006, 037 | M2 W2.6, M5 W5.3 |
| 007 | M2 W2.1 |
| 008 | M1 W1.6 (policy) + M5 W5.8 (data cleanup) |
| 009, 010, 011, 018, 022 | M3 W3.5 (018 also M2 W2.5) |
| 012 | M2 W2.7 |
| 013, 035 (notify part), 049, 057 | M3 W3.1 |
| 040 | M3 W3.2 (lifecycle), W3.1/W3.4 (notices) |
| 015 | M5 W5.4 |
| 016, 025 | M5 W5.5 |
| 017 | M3 W3.2 (replaced by the change-request lifecycle + limited Edit) |
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
| 043 (Guest gate) | M3 W3.7 |
| 044 | M3 W3.6 |
| 047 | M3 W3.5 |
| 048 | M5 W5.3 |
| 052 (Guest home never idle) | Guest backlog (§10) |
| 055, 056 | M3 W3.3 |
| 058 | M3 W3.4 |
| 014 (Promoter Settings) | **Out of scope** |

**Financial findings (re-framed under Model A)**

| IDs | Milestone / item |
|---|---|
| FIN-001 (Admin commission control is a placebo), FIN-006 (duplicate fee tables), FIN-016 (Diamond naming collision) | M4 W4.2 — **retire** the Host-fee controls/tables rather than fix them |
| FIN-003 (no production policy; test-only type) | M4 W4.1/W4.2 (buyer-side production policy; rates from O1) |
| FIN-007 (accounting metadata contradicts staged logic) | M4 W4.2/W4.3 |
| FIN-002, FIN-014 (v2 verification, dual write) | M4 W4.3 |
| FIN-008, FIN-009 (finance visibility, false GST ₹0) | M4 W4.4 |
| FIN-010 (tax) | M4 W4.5 — **buyer fees only**; Host-fee tax is moot |
| FIN-011 (provider cost) | M4 W4.5 |
| FIN-012, FIN-017 | M4 W4.6 |
| FIN-013 (workers) | M3 W3.4 / M5 W5.2 |
| FIN-004, FIN-015 | M5 W5.1 |
| FIN-005, FIN-018 | M5 W5.2 |

**Audit gaps that were not executable and are scheduled**

| Gap | Where closed |
|---|---|
| Cross-Host collision (second Host account) | M1 W1.7 |
| KYC pending/rejected gating | M3 W3.7 |
| Real email delivery verification | M3 W3.4 + human inbox check |
| Refund completion / Admin finance views | M5 W5.1, W5.8 (Admin access required) |
| Real-device mobile, screen reader | M5 W5.5 |
| Database/Firestore verification, outbox traces | M4 W4.3, M5 W5.8 (DB access required) |
| Deployed-SHA provenance | M5 W5.8 |
| Door/Scanner exact duplicate, couple confirm, cancelled-ticket scan, offline | M5 W5.3 |

## 10. Deferred (post-launch) and out-of-scope

- **Promoter Studio redesign, guestlists, profiling/nominations, curated approval, controlled/private inventory, code-gated tiers and events, invite → signup → claim** (R8): a later dedicated project; M4 keeps only the shared allocation compatibility (Promoter commission as a deduction from face value).
- **Polished Edit Event and polished Door UI:** M3 W3.2 and M5 W5.3 deliver the functional baseline; polish belongs to the Partner Experience Quality Pass.
- **Experience Quality backlog** (skeletons, animation, microinteractions, empty-state polish): after M5.
- **Guest-owned items surfaced here:** onboarding order (Host/Venue-blocking part in M3 W3.7), home page never reaching network idle, currency formatting ("₹1,088.5"), "Google sign-in unavailable".

## 11. Engineering process (revised: R9, R10)

1. **Implementation packets, not per-item PRs.** Each milestone is delivered as a small number of **bounded packets** (typically 2–4 PRs per milestone) cut along technical seams, e.g. M1: (a) request/slot/accept backend integrity W1.1–W1.3, (b) Host/Venue request UX and wizard hygiene W1.4–W1.6, (c) harness W1.7; M3: (a) change-request model + lifecycle W3.2, (b) notifications/outbox/Resend W3.1/W3.3/W3.4, (c) honest states W3.5–W3.7; M4: (a) buyer policy + Host-fee retirement W4.1–W4.2, (b) journal v2 + settlement W4.3, (c) finance surfaces/tax/arithmetic W4.4–W4.7. Packets keep a coherent diff and may span backend and frontend where a contract changes. **Do not create dozens of administrative PRs.**
2. **Testing cadence while building:** run focused tests/lint/typecheck for the area being changed; batch related fixes; **do not rerun the full monorepo suite after every correction.**
3. **Milestone packaging gate:** on the *final intended diff* run the CI-equivalent comprehensive validation once (lint, types, unit, contract, build, Partner e2e, scenarios), then rely on GitHub CI, then Claude's independent hosted re-acceptance against the milestone's exit gate. A P0/P1 found at the gate blocks the milestone.
4. **Repo rules (repos' own CLAUDE.md):** pnpm lockfile discipline (frozen lockfile in CI; re-add the lockfile after any install or conflict resolution); native/Expo versions stay SDK-pinned; use the code-review graph for impact analysis and read the source before changing behaviour.
5. **Feature flags and migrations:** behaviour that changes live data (availability model, change requests, Host-fee retirement, journal cut-over) ships behind a flag with a dry-run, a reversible plan and a verification query. **Historical order snapshots and journals are never rewritten** (golden replay tests in M4).
6. **Observability:** request ids visible in UI errors; trace ids across request → accept → publish and order → journal → notification; dashboards for accept failures, orphans, change-request ageing, email failures, unreconciled orders.
7. **Access needed by the team:** second Host test account; Admin read access; database read access for verification; inboxes for synthetic addresses; Razorpay Test Mode only until the signed policy and production approval exist.

## 12. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Open decisions O1–O3 arrive late | M4 slips | collect during M1–M3; M4 starts when answered; O10 gates W1.1, O11 gates W3.2 |
| Change-request lifecycle (W3.2) is the largest new model | schedule/complexity | build as a separate entity, public event untouched until approval; staged rollout behind a flag |
| Retiring Host-fee code breaks historical replay | wrong balances | keep snapshot readers; golden tests on real historical orders |
| Atomic accept (W1.2) is hard on the current store | partial failures persist | saga with compensation, replay, repair tool, failure-injection tests |
| Journal cut-over discrepancies | wrong balances | comparison gate, rollback rehearsal, never add models |
| Venue read model leaks Host financials | trust/legal | DTO contract tests, negative visibility test every milestone |
| Enabling workers surfaces retry bugs | duplicate emails/effects | idempotency audit first; synthetic data in staging |
| Scope growth into Promoter/guestlist | schedule | §10 firewall |

## 13. Definition of done per milestone

- **M1:** hosted loop matrix clean (accept, reject-with-reason, withdraw, resubmit, forced failure, cross-Host collision); no orphan drafts; no `accepted` request without an event.
- **M2:** Venue sees and can operate every Host event at its venue; no Host financial field reachable by a Venue (API, UI, search, export); drafts never visible; price truth consistent.
- **M3:** change requests work end-to-end (pending/approved/rejected; public event unchanged until approval; tickets valid for the replacement; refund right exposed; Postpone path); lifecycle emails delivered with evidence; invitation flow safe; honest states everywhere; KYC gating verified.
- **M4:** signed Model A policy; one buyer-side policy source; no Host platform fee on new orders and no misleading Host-fee controls; historical orders unchanged; journal v2 live on staging; settlement 0/75/100 proven; every Host/Venue money number defined, reconciled and role-appropriate.
- **M5:** refund/dispute/payout safeguards proven by simulation; Door runs a full synthetic night on a phone; performance and accessibility targets met; final audit passes; go/no-go recorded.

## 14. Effort summary

| Milestone | Units | Items |
|---|---:|---|
| M1 Request/publish loop integrity | 20 | W1.1 4 · W1.2 4 · W1.3 3 · W1.4 3 · W1.5 2 · W1.6 3 · W1.7 1 |
| M2 Venue-centric Studio (operational) | 20 | W2.1 3 · W2.2 4 · W2.3 3 · W2.4 4 · W2.5 2 · W2.6 2 · W2.7 2 |
| M3 Change management, communications, honest states | 20 | W3.1 3 · W3.2 6 · W3.3 3 · W3.4 3 · W3.5 3 · W3.6 1 · W3.7 1 |
| M4 Financial truth under Model A | 20 | W4.1 2 · W4.2 4 · W4.3 4 · W4.4 5 · W4.5 3 · W4.6 1 · W4.7 1 |
| M5 Safety, Door, performance, launch | 20 | W5.1 4 · W5.2 3 · W5.3 4 · W5.4 3 · W5.5 2 · W5.6 1 · W5.7 1 · W5.8 2 |
| **Total** | **100** | |

Estimates are planning figures from audit evidence, not commitments; re-baseline in the first days of each milestone. M1 depends on how hard atomic accept (W1.2) is on the current store; M3 depends on the final shape of the change-request model.
