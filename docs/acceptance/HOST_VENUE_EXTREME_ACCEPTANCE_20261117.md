# C1RCLE Host + Venue — Extreme End-to-End Acceptance Audit (v2)

- **Date:** 2026-11-17 (UTC morning; IST afternoon)
- **Scope:** Host Studio + Venue Studio (Promoter excluded by instruction), with Guest-side reconciliation.
- **Mode:** AUDIT ONLY. No product code, no PR, no deploy. Staging only. Razorpay **Test Mode** only.
- **Supersedes nothing:** extends `PARTNER_DASHBOARD_LAUNCH_AUDIT_20261117.md` (commit `babd14e`). Where today's hosted evidence differs, **current evidence wins** and the change is recorded in §X.
- **Credentials:** none appear in this document. Guest staging was reached using user-authorized temporary deployment-protection bypass access (value not recorded). Test-phone, OTP, card and payment-instrument values are deliberately omitted.

---

## A. Executive verdict

**C1RCLE cannot yet be handed to a real nightclub Host and Venue operator.** Individual pieces work well — payments in Test Mode, Guest publication, price/fee arithmetic, QR rules, capacity accounting, edit guards, tenant isolation — but the *operating loop* between Host and Venue is broken at its centre:

1. **The Venue Studio is still ownership-centric.** With 11+ Host events at Test Venue, its Overview says "No upcoming events", its Events list defaults to 0, its Analytics says ₹0 / 0 tickets / 0 paid orders (while two paid orders and three RSVPs exist), its Marketing audience is empty, its search cannot find those events, and its Door buttons lead to "Event unavailable".
2. **The Host's Create wizard and the Venue's published availability are incompatible.** A request created through the real wizard inside a Venue-published open window **cannot be accepted** ("The event conflicts with a Venue calendar slot"), and the failed accept leaves the request `accepted` with **no event**, unrecoverable by replay; the Venue cannot unpublish its window.
3. **Money labels still contradict** (event "revenue" = buyer gross; "Net revenue" is not payable; org overview stale).
4. **Lifecycle changes (reject, cancel, postpone) do not notify**, and cancelled events keep the Venue's slot.

Counts of **active findings: P0 0 · P1 7 · P2 30 · P3 19.**

---

## B. Environment and build provenance

| Item | Evidence |
|---|---|
| Frontend `staging` | `0c7d5f75` (PR #123) — unchanged through the audit (SOURCE VERIFIED via `git ls-remote`) |
| Backend `staging` | `7c181a07` (PR #192) — unchanged (SOURCE VERIFIED) |
| Partner staging | Vercel, region iad1 (HOSTED VERIFIED) |
| Guest staging | Vercel, behind Deployment Protection; accessed via user-authorized temporary bypass (HOSTED VERIFIED) |
| Backend | Render service (nginx → Fastify gateway), taken from the app's CSP/BFF config (HOSTED VERIFIED) |
| Deployed SHA == HEAD | **Not provable externally.** The gateway has `/api/v2/internal/version`, but the nginx edge deliberately exposes only `/internal/health` (SOURCE: `client-ip.conf.template`), so the 404 is by design — **not** evidence of a stale deploy. A CI gate reads Render's own commit metadata (LIMITATION) |
| Firebase project | Not directly identified; phone verification and email sign-in worked against staging (HOSTED VERIFIED). Project id not exposed to this session (ENVIRONMENT BLOCKED) |
| **Razorpay mode** | **TEST — proven three independent ways before paying:** (1) payment-attempt response carried a publishable key with the test prefix; (2) the quote's fee policy reports `environment: test` and "Non-production test fees"; (3) the checkout opened Razorpay's `gateway/mocksharp` demo bank ("This is just a demo bank page"). HOSTED + API VERIFIED |
| Network changes | At user's approval I allow-listed `staging.thec1rcle.com`, the three Razorpay hosts and two Firebase auth hosts in the sandbox policy |

**Baseline before mutation (API VERIFIED):** Host events 7; Venue-visible events 7; Host paid orders 2; ledger rows 3; Host notifications 6; Venue notifications 0; Host pending balance ₹552.50; Venue slot requests 13 (all accepted/none pending).

---

## C. Synthetic event / record inventory (cleanup candidates are listed in §Z)

| Label | Event id (8) | Purpose | Final state |
|---|---|---|---|
| HV ACCEPTANCE 001 (A) | `969a1da1` | Standard paid, GE ₹1,000 / VIP ₹2,500; accepted **via Venue UI click** | published |
| HV ACCEPTANCE 002 (B) | `1a5e984f` | Early Bird: base ₹1,200, Early Bird ₹900 now, ₹1,100 later | published; **1 paid Test order** |
| HV ACCEPTANCE 003 (C) | `33b20c9f` | Free RSVP (30), edited, then cancelled | **cancelled** (had Guest RSVP) |
| HV ACCEPTANCE 004 (D) | `b567434f` | Multi-tier GE / VIP / **Couple** | published |
| HV ACCEPTANCE 007 (G) | `3c83af79` | Lifecycle candidate | **postponed** |
| HV ACCEPTANCE 005 (H) | `bb257a3a` | RSVP event starting tonight (QR window test) | published; 1 Guest RSVP |
| HV ACCEPTANCE 008 (I) | `9c5d183a` | RSVP event starting ~08:55 UTC (live scan) | published; 1 Guest RSVP |
| HV ACCEPTANCE 002 (orphan) | `f6beb07f` | **Orphan draft** from a failed accept | draft (evidence of PARTNER-032) |
| HV ACCEPTANCE 006 (resubmitted) | see API | Resubmission after rejection (interval request, no window) | published |
| HV ACCEPTANCE 009 (UI wizard) | — (no event) | Created through the real wizard | request `728f365e` **accepted without event** (PARTNER-031) |
| Rejected requests | — | 006 (F) + three recovery rejects | rejected |
| Availability windows | — | 12 Dec windows etc.; 6 Dec window destroyed by Host cancel | open/booked |
| Guest records | — | 1 paid order (B), 3 RSVPs (C, H, I), 1 refund-review ticket | see §Z |
| Other | — | 1 invitation (revoked), 1 support ticket, 1 settings toggle (restored), 1 door code ×3, 1 scanner session | see §Z |

---

## D. Host Studio — page by page (hosted unless noted)

| Page | Result |
|---|---|
| Overview | Correct after activity: next event card ("17 NOV · HV ACCEPTANCE 008 — 1 tickets sold"), Door-mode link, recent orders, upcoming list. Cancelled event's RSVP still appears among recent orders without a status. Grammar "1 tickets sold" |
| Events | Lists all Host events incl. drafts and the cancelled/postponed ones; "Live" badge for any published event (PARTNER-019) |
| Create wizard | 7 steps executed in the browser (§F). Validation + focus management good |
| Event workspace | Summary / Analytics / Revenue / Crowd / Compare / Postpone / Cancel present; headline figures mislabelled (PARTNER-004) |
| Guests / Marketing | Audience shows paid + RSVP holders (names + spend only — good minimum-necessary). **Campaign composer advertises WhatsApp / Email / SMS / Notification but states "Preview only · sending is not connected"** (PARTNER-044) |
| Partners | Tabs Venues / Promoters / Staff; Test Venue listed; no destructive action performed |
| Finance | Balance, ledger, orders — see §M |
| Analytics | Gross ₹1,687 / Net ₹1,687 / 6 tickets / 2 paid orders (see §L) |
| Notifications | 13 items; only "event published" (+1 partnership) — no reject/cancel/postpone/refund-request items (PARTNER-035/040/049) |
| Support | Ticket submitted and listed (API); copy contains jargon (PARTNER-011) |
| Settings | Partner-settings read/toggle/validation/persist/restore all work (API) |
| Door | Launcher only (PARTNER-006) |
| Waitlist | Still calls a V1-disabled endpoint: "Request failed with status 410" + live "Offer next guest" controls (PARTNER-010 reconfirmed) |
| Edit | §N |

## E. Venue Studio — page by page

| Page | Result |
|---|---|
| Overview | **"Create your first event… No upcoming events… 0 tickets sold"** with 11+ Host events (PARTNER-001 reconfirmed) |
| Events | Default **Venue** tab = 0; **Hosts** tab lists Host events (drafts correctly hidden in UI) but no "Hosted by", poster or sold count (PARTNER-002) |
| Calendar | Day detail for a booked day: only "Reserved… Review the linked event" (no event identity); heading "All events this month" |
| Slot requests | Pending cards show Host, date/time, "N ticket tiers" — **no price, capacity or poster**; Accept/Decline one-click; **no acknowledgement and stale list after Accept** (PARTNER-036) |
| Partners / Staff / Settings / Support | Load; Staff = 1 member; Settings persist |
| Marketing | Audience **0** (Host sees holders of events at this Venue) |
| Analytics | **₹0 / 0 tickets / 0 paid orders** (PARTNER-003 reconfirmed) |
| Finance | `venue_share` ledger rows exist (₹0, pending); orders list empty |
| Notifications | **0** despite 12+ accepts/publications |
| Door | List offers "Open Door Mode" per Host event → destination says **"Event unavailable"**; Venue cannot mint door codes (404) (PARTNER-037) |
| Event workspace | Good header ("Hosted by …"), tiers, Early Bird phase; **single Overview tab**; shows ₹1,200-style base prices |
| Global search | Cannot find Host events at its own Venue ("HV ACCEPTANCE" → 0) (PARTNER-038) |

---

## F. Event creation matrix

| Event | Config | Created via | Result |
|---|---|---|---|
| A | GE ₹1,000 ×50, VIP ₹2,500 ×10, max/order 4/2 | API request + Venue UI accept | ✅ published, tiers created, notification to Host |
| B | Early Bird + second release phases | API | ✅ **sells at ₹900**; every summary says ₹1,200 (PARTNER-012) |
| C | Free RSVP ×30 | API | ✅ RSVP 30→29, duplicate de-duplicated |
| D | GE/VIP/**Couple** (guestCount 2, bundle) | API | ✅ quotes: attestation required; max/order enforced |
| E | Never-submitted draft | wizard draft | ✅ not visible to Venue as event/request (draft **record** stays Host-private) — but see PARTNER-007/046 |
| F | Rejected request | API reject | ✅ rejected; **reason not returned to Host**; no Host notification (PARTNER-035) |
| G | Lifecycle | API | ✅ postponed (see §N) |
| UI wizard | 009 | **Browser** | Reached Review with no poster; submitted OK; **cannot be accepted** (PARTNER-031) |

**Wizard UI findings (HOSTED VERIFIED):** empty name → "Finish these items before continuing — Add an event name." with focus moved to the field (good); poster is optional (events publish with no artwork → "Event artwork unavailable" cards in Guest); the date picker shows **green "open time" on every day** whether or not the Venue published availability and sends a synthetic `free-…` slot, never a real Venue slot id; the draft is **not cleared after submit** (DELETE then immediate PUT re-creates it; the next "Create event" reopens with the submitted event's data — PARTNER-046); click→navigation after submit ≈ 9.6 s.

## G. Host → Venue workflow evidence

1. Venue publishes availability (max 24 h per window — enforced). 2. Host submits request with embedded draft (≈ 3.8 s). 3. Venue sees it (Host, date, "N tiers"). 4. Accept (≈ 7 s API latency) **materializes and publishes** the event with tiers (Host notified "is live"). Pending requests do **not** appear as Host/Venue events (no pre-accept leak).
Failure/edge evidence (all API/HOSTED VERIFIED): a failed accept leaves an **orphan draft event** and keeps the request pending (PARTNER-032); a Host **cannot cancel its own pending request** that carries a draft ("live or unverifiable linked event" — source: `cancel()` looks up an event that does not exist until accept) (PARTNER-033); a Host cancel **removes the Venue's published window** while the availability endpoint still lists it "booked" (PARTNER-034); same-Host overlap is refused ("already has a request"); overlap with a live Venue event is refused; **cancelled events still block their night** (PARTNER-039); cross-Host collision could not be exercised with a single Host account (SOURCE: guard excludes cancelled/archived events and blocks live ones — HUMAN/ENV BLOCKED for live proof).

## H. Guest publication reconciliation

Public API and Guest Portal show each accepted event with title, Host, Venue, date/time; active price and availability come from the tiers endpoint. Guest event page CTA: **"Get tickets · From ₹900"** (B) — correct; Partner list/detail and the public event *summary* show **₹1,200** (PARTNER-012). No localhost posters on new events (they have none). Pre-existing QA events still carry `localhost:3001` poster URLs in the Partner API (PARTNER-008 reconfirmed). Edits propagate (title, +1 h time) to Venue, public API and Guest "My Tickets". Postponed and cancelled events disappear from the public API (404) while ticket holders still see their pass.

## I. Paid transaction reconciliation (B, Test Mode)

| Item | Value |
|---|---|
| Quote → hold → payment attempt → Razorpay Checkout → demo-bank "Success" → verify → confirmation | all HOSTED VERIFIED (click→confirmation ≈ 15 s after bank page) |
| Base ticket (Early Bird) | ₹900.00 |
| Platform fee (buyer, 5 %) | ₹45.00 |
| Payment fee (buyer, 2.5 %) | ₹22.50 |
| GST on fees (18 %) | ₹12.15 |
| **Guest total** | **₹979.65** (= provider amount) |
| Host ledger | ticket revenue ₹900.00 · platform fee (host-side, 15 %) ₹135.00 · **host payable ₹765.00 (pending)** |
| Venue ledger | `venue_share` ₹0 (pending) |
| Host pending balance | ₹1,317.50 (= ₹552.50 + ₹765.00 ✓) |

Alternative path observed: a second payment attempt for the **same event** while one is pending is blocked server-side ("existing checkout is still pending") until the hold expires (~10 min); a different event is not blocked. Buyer-paid fees (₹79.65) do not appear in the Host ledger (expected if they are platform revenue, but **no surface I can read proves where they are journaled** — HYPOTHESIS, Admin finance not available).

## J. Free RSVP reconciliation

C: capacity 30→29; duplicate RSVP returned success without a second order (capacity stayed 29); Guest My Tickets shows pass; Host finance orders/audience show 1; analytics `ticketsSold` 1; Venue list shows `ticketsSold` 1 in API but **the Venue UI shows no sold count**. After cancelling C: Guest ticket `void`, QR refused with a clear message, order `cancelled` with cancellation info. Order status for ₹0 RSVP is literally `paid` (PARTNER-047).

## K. Orders / attendees reconciliation

Host finance orders list the Guest by name (names + totals only; no email/phone — good); Host marketing audience likewise. Venue: orders list empty by design; audience empty (policy decision needed, PARTNER-003). Search/filter/export on orders **not exercised** (NOT DONE — see §Y).

## L. Analytics reconciliation (B + prior order)

| Surface | Tickets | "Revenue" |
|---|---|---|
| Event analytics (B) | 1 | ₹979.65 (**buyer gross**) |
| Host Analytics page | issued 6 / paid orders 2 | Gross ₹1,687 · **Net ₹1,687** (earlier today: Net ₹0 for the first order) |
| Host org overview API | 1 | ₹707.53 — **did not include the new order** and counts only paid, not RSVPs |
| Host payable (ledger) | — | ₹1,317.50 |
| Venue Analytics page / org overview | **0 / 0 / ₹0** | **₹0** |
"Net revenue" is net-of-refunds, not net-of-fees; "Money made" on the event page is gross. Labels are unstable and unexplained (PARTNER-004/042).

## M. Finance reconciliation

Ledger arithmetic is internally consistent (§I). Discrepancies: Host finance **order row shows GST ₹0** while the Guest order carries ₹12.15 (PARTNER-041); payout is correctly disabled ("Payout requests are currently disabled"); jargon "controlled journal transition" is shown to the Host (PARTNER-011). No payout or bank change was made.

## N. Lifecycle change reconciliation

| Action | Host | Venue | Guest / public | Notifications |
|---|---|---|---|---|
| Edit title | ✅ immediate | ✅ immediate | ✅ immediate | none |
| Time +1 h (correction) | ✅ allowed in slot | ✅ | ✅ (Guest ticket shows 7 PM) | none (source: >12 h or venue change = material) |
| Time/venue outside slot | refused (misleading message for venue change) | — | — | — |
| Stale `If-Match` | 409 (good) | — | — | — |
| Venue PATCH / cancel / postpone / door-code on Host event | — | **404 on all** (good) | — | — |
| Tier capacity below sold+held | refused (good); price change after sale allowed, existing orders unchanged | — | public availability recomputed | — |
| Poster localhost URL | 422 generic "Validation failed" | — | — | — |
| `visibilityMode: code` | refused: private access feature not enabled in this deployment | — | — | — |
| **Postpone (G)** | `postponed` | `postponed` | public event **404** | **none to Host or Venue** |
| **Cancel (C, had RSVP)** | `cancelled` | `cancelled` | ticket `void`, QR refused, order cancelled; public 404 | **none to Host or Venue**; **Venue slot stays booked**; night cannot be re-requested (PARTNER-039/040) |
| Guest refund review on B | order stays `paid`; Host **not informed**; completion needs Admin (**HUMAN BLOCKED**) | — | open review created | none (PARTNER-049) |

**EDIT EVENT — CURRENT STATE (executed):** Host can edit title/summary/description, in-slot start/end, tier price/capacity/max-per-order (with floors), postpone, cancel. Cannot edit venue, poster (UI not exercised), visibility (flag-gated), refund policy (not exercised). **REQUIRED FUTURE CAPABILITY:** material-change classification, refund-right and notification previews, poster/media edit, promoter changes, Venue-visible change notices — unchanged from the first audit.

## O. Partners / staff / settings / support

Invitations (API): invite → pending (expires 14 days) → duplicate refused ("already pending") → invalid role → 422 → revoke OK. Members list shows the owner only. Settings: persist and validate (`handle` pattern error is field-specific). Support: ticket created/listed. Partners tabs load; remove/suspend not exercised (non-synthetic relationship — SAFETY).

## P. Calendar / notification findings

Calendar API returns generic "Host requested time" blocks (no event, no Host name); UI "Reserved". Venue availability: windows ≤ 24 h, cannot be unpublished ("Only blocked slots can be unblocked"), and — critically — **an open window makes wizard requests inside it un-acceptable** (PARTNER-031/045). Notifications: Host gets only `event.published`; Venue gets none (PARTNER-013/035/040).

## Q. Door / Scanner findings

- **Partner Door UI:** launcher only (scanner codes + "Start scanner shift"); no attendee list, search, manual check-in, live counts. Host can mint door codes (API 201); **Venue gets 404** and its "Open Door Mode" CTA leads to "Event unavailable" (PARTNER-006/037).
- **QR rules (API VERIFIED):** rotating 30 s payload for events within 24 h; far-future events → 409 "Your QR becomes available 24 hours before the event starts."; void tickets → 409 clear message.
- **Scanner session (API VERIFIED):** a door code + an authenticated operator create a device session; a session is bound to its event (wrong event → 401).
- **Admission opens only at event start:** pre-start scans are denied with `denyReason: event_closed` and message "Admission has not opened yet" (mislabelled code — PARTNER-048). Denials do not consume the ticket.
- **Live scan of event 008 (`9c5d183a`), run at event start with the Guest's live QR (API VERIFIED):** valid scan → `consumed`; Guest ticket → `redeemed`, scan count 1; Host event analytics check-ins → 1 (propagated); **QR cannot be re-issued after use** ("available only while the entitlement is active"), so a second Guest-side presentation is impossible; tampered/unsigned payload → `denied: invalid_signature`; stale replay of the entitlement id → `denied: invalid_signature`; a session for another event → 401. **NOT TESTED:** an exact byte-for-byte replay of the consumed signed payload within its 30 s window (I did not retain it), couple confirmation, cancelled-ticket scan, offline sync. Venue API shows the sold count but the Venue UI shows no check-in awareness (PARTNER-003/037).

## R. Mobile (emulation only — **no real device**)

Drawer navigation at 390 px works (scoped link taps); Create Event loads with 48 px step chips and no overflow; earlier 320/390/430 sweep showed no page-level overflow. Header icon controls remain 20–36 px wide (PARTNER-016, revised: the "29×29" Create controls in the first audit were calendar arrows — retracted). Not done: Edit, Guests, Finance, Door interaction on touch; keyboard-sensitive forms.

## S. Accessibility (browser-verified only; **screen reader NOT used**)

Notification dialog: focus enters, stays trapped over 8 Tabs, Escape closes, focus returns to the trigger. Wizard validation moves focus to the invalid field. Landmarks/headings/labels as in the first audit; sidebar focus ring still not visibly distinct (PARTNER-025).

## T. Performance (populated data, desktop, cloud container)

| Route | TTFB | FCP | LCP | API calls | duplicate |
|---|---|---|---|---|---|
| Host overview | 3.17 s | 3.66 s | 6.77 s | 10 | `access` ×2 |
| Host events | 1.03 s | 1.40 s | 5.52 s | 6 | `access` ×2 |
| Host event workspace | 1.08 s | 1.62 s | 2.52 s | 6 | `access` ×2 |
| Host finance | 1.03 s | 1.40 s | 3.76 s | 6 | `access` ×2 |
| Host analytics | 2.25 s | 2.60 s | 5.26 s | 6 | `access` ×2 |
| Host settings | 0.93 s | 1.25 s | 5.29 s | 7 | `access` ×2 |
| Venue overview | 1.25 s | 1.53 s | 3.82 s | 9 | `access` ×2 |
| Venue events (Hosts) | 0.91 s | 1.24 s | 6.09 s | 6 | `access` ×2 |
| Venue calendar | 1.40 s | 1.69 s | **8.36 s** | 9 | `access` ×2 |
| Venue slot requests | 1.44 s | 1.72 s | 4.28 s | 7 | `access` ×2 |
| Venue event workspace | 0.95 s | 1.48 s | 1.48 s | 6 | `access` ×2 |
| Venue settings | 1.44 s | 1.76 s | **8.48 s** | 10 | `access` ×2 |
Interaction latencies: accept request ≈ 7 s (API); wizard submit→navigate ≈ 9.6 s; request creation ≈ 3.8 s; login→overview ≈ 8–9 s. The `access` duplicate fires on **every** page (PARTNER-015 reconfirmed). The Guest home never reached network idle in 60 s (PARTNER-052, HYPOTHESIS: long-polling/analytics).

## U. Security / tenant isolation (fresh data)

| Probe | Result |
|---|---|
| Venue reads Host **draft** via list | **Included** in `venue-events` list (PARTNER-007 reconfirmed) |
| Venue reads same draft by id | 404 |
| Venue GET Host event / tiers | 404 |
| Venue PATCH / cancel / postpone / door-code on Host event | 404 each |
| Venue GET Host finance | 403 |
| Host GET Venue-only `venue-events` | 403 |
| Host publish Venue availability | 404 |
| Guest session against Host events / finance | 403 |
| Venue → Host/Promoter org-scoped GET sweep (previous audit) | denied |
No cross-tenant write was possible in any probe. Host calling Venue accept returned 400 (validation) rather than 403 on a fabricated id — ordering, not exposure (PARTNER-024).

## V. Data integrity

Orphan draft event (002) and an **accepted-without-event** request (009) prove accept is not atomic. Duplicate titles exist (orphan 002 vs live 002). Host `stats.events` counts include orphans/cancelled. Database not accessed (**ENVIRONMENT BLOCKED**): all integrity statements are API-level.

## W. Observability

Every error body carries `requestId`; response header exposes `X-Request-Id`. Order ids are traceable Host↔Guest↔ledger (`ORD-pay_…` links Guest order, Host order row, three ledger entries, Venue ledger row). Gaps: no request id surfaced in any UI error; no outbox/trace id; notification emission not traceable; Razorpay payment id appears only on the Guest receipt.

---

## Resend / email investigation (SOURCE VERIFIED unless noted)

**What Resend is here:** the single email provider behind `ResendEmailSender` (`apps/api-gateway/src/lib/notifications/resend-email-sender.ts`, 293 lines + 305 lines of tests), wired in `v2-services.ts` and shared by OTP, staff invitations, credential reset, onboarding notices and the outbox-driven transactional consumer. Config: a provider credential held only in the host's protected environment, a from-address setting, a non-production test-recipient setting, a strict allow-list switch, and a separate OTP hashing key. The provider domain is reported verified and the sender is a no-reply address on the company domain (operator-supplied facts in the repo's own remediation notes — not independently re-checked).

**Two send paths with different quality:**
| Path | Used for | Idempotency | Retry | Failure behaviour |
|---|---|---|---|---|
| the auth-email method | OTP, staff invitation, credential reset, onboarding changes-requested | **none** | **none** | throws a generic "Unable to send…"; callers log-and-swallow in several flows |
| the transactional-email method | receipts, ticket/transfer, cancellation/postponement, refunds, partner-application, promoter, payout status, cover/add-on | `Idempotency-Key` header = stable key | outbox retry on 408/409/429/5xx; permanent on other 4xx | 10 s timeout; records `captured_locally` outside production |

**Environment gating:** non-production only sends to one allow-listed test recipient and otherwise *captures locally* (transactional) or throws a permanent error (auth). `render.yaml` sets `NODE_ENV=production`, so staging sends to any recipient **if** a key is bound — whether staging carries the key, the from-address and the allow-list flags is not provable from outside (**ENVIRONMENT BLOCKED**). `BACKGROUND_WORKERS_ENABLED=false` in the manifest means the periodic outbox drain does not run; inline handlers still fire (in-app "published" notices arrived immediately) but **failed email deliveries would never be retried** (PARTNER-058).

**Email families that exist (43 reviewed variants; founder visual acceptance still pending per repo notes):** purchase receipt/RSVP, ticket issuance/upgrade, assignment and transfer notices, partner application (received / changes requested / approved / rejected), promoter assignment/suspension, event cancellation and postponement/material change (to **ticket holders**), refund review/settled/declined (purchaser), payment support, payout status, cover/add-on. Waitlist excluded from V1.

**What does *not* exist for Host/Venue (the root cause of PARTNER-013/035/040):** no email or in-app producer for slot-request submitted/accepted/rejected/cancelled, event published/edited, postponement/cancellation *to the Host or Venue*, Guest refund-review request *to the Host*, or Guest purchases *to the Host/Venue*. The repo's deferred-findings table also lists **"Unassigned invitation email" as a P1 deferred item**.

**Staff-invitation behaviour (PARTNER-055/056):** inviting an address creates the invitation, then **provisions a brand-new login with a temporary sign-in credential** and emails it **in plaintext**; the account is created before acceptance and **revoking the invitation does not remove it**; provisioning or email failure is caught and only logged (two warn-level log events), so the Host sees a normal "pending" invitation. My synthetic invitation (revoked) therefore very probably left a provisioned account behind — listed under cleanup candidates; I could not verify it from outside.

**What I could not do:** observe any actual delivery. The synthetic Guest and invitee inboxes are on a public disposable-mail site. I added it to the sandbox allow-list at the user's request, but the session's permission classifier **denied** the automated inbox read, so I did not attempt it (**HUMAN CHECK**: please open the Guest inbox for the Test-Mode receipt of order B, and the invitee inbox for the staff invitation, and report whether and when they arrived). The Admin communications view (delivery metadata + provider request id) needs an Admin. Evidence levels therefore stop at "the product advertises/records the receipt on screen" — Guest receipts are shown in-app (HOSTED VERIFIED) — not "an email arrived".

## X. Finding ledger (continuing `PARTNER-###`)

Legend: **R** = reconfirmed hosted/API · **N** = new · **Rv** = revised · **X** = retracted/changed · **—** = not re-tested.

### P1 (7)
| ID | Status | Role | Summary |
|---|---|---|---|
| 001 | R | Venue | Overview: no Host events ("Create your first event") |
| 002 | R | Venue | Events default tab = 0; calendar anonymous; no "Hosted by" in list |
| 003 | R | Venue | Analytics/marketing/search/event sales blind to Host events (now with 2 paid orders + 3 RSVPs at the venue) |
| 004 | R / Rv | Host | Money labels: event "revenue" ₹979.65 = buyer gross; payable ₹765; Net ₹1,687 (not payable; was ₹0 earlier); org overview stale |
| 005 | R | all | `onboarding/me?requestedType=…` → 500 (host and venue retested) |
| 006 | R | Host/Venue | Door = launcher only; Venue cannot mint codes (404) |
| **031** | **N** | Host + Venue | **Wizard requests ignore Venue open windows; accept fails ("conflicts with a Venue calendar slot"), leaving request `accepted` with no event; replay cannot recover; Venue cannot unpublish the window** |

### P2 (30)
007 R draft in Venue API list · 008 R localhost poster URLs in Partner API · 009 R/Rv expired session on event root and unknown id → generic error (other routes now redirect to the login page with a callback parameter) · 010 R waitlist 410 UI · 011 R jargon/dead routes ("route not found… Partner V3 foundation yet" for unknown event with a valid session) · 012 R starting price ₹1,200 vs ₹900 · 013 R Venue gets 0 notifications · 014 — (Promoter, not re-tested) · 015 R perf/duplicate `access` · 016 Rv header tap targets only · 017 Rv Edit minimal (executed) · 018 R Venue edit URL: header + "Event unavailable" · **032 N** accept not atomic: orphan draft event · **033 N** Host cannot withdraw a pending request with draft · **034 N** Host cancel deletes Venue window; availability vs calendar disagree · **035 N** rejection reason not returned; no Host notification for reject/cancel · **036 N** Accept: no acknowledgement, stale list, ~7 s · **037 N** Venue Door CTA → "Event unavailable" · **038 N** Venue search cannot find Host events · **039 N** cancelled/postponed events keep the slot; night cannot be re-requested · **040 N** no notifications for postpone/cancel; public 404 for postponed/cancelled · **041 N** Host finance order GST ₹0 vs Guest ₹12.15; buyer fees not visible in any Host/Venue journal · **042 N** org overview stale/excludes RSVPs · **043 N** Guest onboarding bypass: signed-in user lands on Explore with phone step incomplete, hard 403 only at quote (user-observed + HV) · **044 N** campaign composer advertises unavailable channels · **045 N** Venue cannot unpublish an open availability window · **046 N** wizard draft not cleared after submission · **055 N** staff invitation **auto-provisions a login and emails a plaintext temporary sign-in credential**; revoke does not deprovision (§Resend) · **056 N** email/credential failures are swallowed — invitation returns 201 with no failure signal; auth emails have no retry/idempotency (§Resend) · **057 N** no email/in-app producer exists for Host/Venue operational events (slot request, accept, reject, publish, edit) — root cause of 013/035/040 (§Resend).

### P3 (19)
019 R "LIVE" for any published event · 020 R capacity "Not set" with tiers set · 021 R duplicate titles/QA data · 022 X partially: crash only with revoked session; valid session now shows "route not found" jargon (folded into 009/011) · 023 R login response returns access token (Guest too) · 024 R 422-before-403 ordering · 025 R focus ring · 026 R buyer name in Host finance (policy) · 027 — permission model not partner-type aware · 028 — legacy code debt · **047 N** formatting/semantics: "₹1,088.5", "₹22.5", "1 tickets sold", ₹0 RSVP order `paid` · **048 N** `event_closed` for "not opened yet" · **049 N** Host not informed of Guest refund request · **050 N** misleading validation messages (venue change → "timing must remain within slot"; localhost poster → generic 422) · **051 N** client-supplied tier ids are globally unique (`tier-1` reused → "identifier already in use") · **052 N** Guest home never idle (HYP) · **053 N** events can publish with no poster · **054 N** Venue availability windows are optional/unenforced for requests (product semantics unclear) · **058 N** email/outbox operational risks: background workers disabled in the manifest (failed deliveries never retried), a personal founder address hard-coded in config as the only allow-listed test recipient, staging mail unverifiable (§Resend).

### Retractions this pass
The "tier identifier already in use" accept failure (first attempt at event B) was **my harness reusing local ids** — recorded as PARTNER-051 hazard only, not a defect of the accept path. The "29×29 Create step controls" claim (first audit) is retracted (they were calendar arrows).

---

## Y. Phase 0–47 completeness matrix

| Phase | Status | Evidence | Remaining |
|---|---|---|---|
| 0 Baseline | FULLY EXECUTED | §B | — |
| 1 Host surface map | SOURCE + TESTS ONLY (first audit) + HOSTED sample | Not every route re-walked with Back/Forward/mobile | Executable: per-route Back/Forward/mobile sweep |
| 2 Venue surface map | same | same | same |
| 3 Auth/session | FULLY EXECUTED | logout, revoked session (event root/unknown id → generic error; others redirect), deep link, **mid-edit expiry → automatic redirect to login (unsaved edits lost, no expiry message)** | — |
| 4 Host overview w/ state | FULLY EXECUTED | §D | — |
| 5 Venue overview | FULLY EXECUTED | §E | — |
| 6 Create matrix | HOSTED VERIFIED | §F (events A–D,G,H,I,UI wizard; E/F partial) | Executable: refund-policy / promo variants |
| 7 Wizard | HOSTED VERIFIED | all 7 steps; validation; submit; mobile only to entry | Executable: more invalid-value cases, mobile steps |
| 8 Host→Venue submission | FULLY EXECUTED | §G | — |
| 9 Accept | FULLY EXECUTED | UI + API; replay | — |
| 10 Reject | FULLY EXECUTED | reject, Host view, **resubmit-after-reject succeeded** | — |
| 11 Collision | HOSTED VERIFIED + SOURCE | same-Host, live-event, cancelled-event | **HUMAN BLOCKED**: cross-Host needs 2nd Host account |
| 12 Host workspace | HOSTED VERIFIED (partial) | tabs sampled | Executable: every tab/control |
| 13 Venue workspace | FULLY EXECUTED | §E/§U | — |
| 14 Edit | HOSTED+API VERIFIED | §N | Executable: poster/refund-policy/end-time edit |
| 15 Active price | FULLY EXECUTED | 12 surfaces compared (partial list) | — |
| 16 Guest discovery | HOSTED VERIFIED | §H | — |
| 17 Paid purchase | FULLY EXECUTED | §I | — |
| 18 Paid reconciliation | FULLY EXECUTED | §I/§L/§M | Admin column **HUMAN BLOCKED** |
| 19 Capacity | FULLY EXECUTED | 40→39, 30→29, floors | — |
| 20 RSVP | FULLY EXECUTED | §J | — |
| 21 Orders | FULLY EXECUTED | list, status tabs, search, empty state ("No orders match these filters.") all work; order ids truncated | — |
| 22 Attendees | HOSTED VERIFIED (partial) | no search/filter/export | Executable |
| 23 Analytics | FULLY EXECUTED | §L | — |
| 24 Finance | FULLY EXECUTED | §M | — |
| 25 Refund | HUMAN BLOCKED | review opened; decision is Admin's | Admin |
| 26 Postpone | FULLY EXECUTED | §N (no ticket holders on G) | postpone-with-tickets not exercised |
| 27 Cancel | FULLY EXECUTED | §N | refund completion Admin |
| 28 Waitlist | FULLY EXECUTED | 410 UI | — |
| 29 Partners | HOSTED VERIFIED (partial) | tabs only | Executable: request/accept with synthetic partner (no 2nd account) |
| 30 Staff/invitations | FULLY EXECUTED (API) | §O | UI path not walked |
| 31 Settings | FULLY EXECUTED (API) | §O | UI not walked |
| 32 Support | FULLY EXECUTED (API) | §O | — |
| 33 Search | FULLY EXECUTED (API) | PARTNER-038 | — |
| 34 Notifications | FULLY EXECUTED (API) + SOURCE | Host/Venue in-app; email path traced in §Resend; **real inbox receipt not observable** | ENV BLOCKED (inbox host not allow-listed; Admin delivery view) |
| 35 Calendar | FULLY EXECUTED | §P | — |
| 36 Door mode | FULLY EXECUTED | §Q | — |
| 37 Scanner | HOSTED/API VERIFIED (partial) | live valid/invalid/stale/wrong-event scans + propagation | exact-payload duplicate, couple confirm, cancelled-ticket scan, offline sync NOT TESTED |
| 38 Marketing | FULLY EXECUTED | PARTNER-044 | — |
| 39 Performance | FULLY EXECUTED | §T | — |
| 40 Mobile | HOSTED VERIFIED (partial; **not real device**) | §R | Executable: touch interaction of Edit/Guests/Finance |
| 41 Accessibility | HOSTED VERIFIED (partial; **no screen reader**) | §S | Executable: Edit/finance dialogs |
| 42 Error states | FULLY EXECUTED | 401/403/404/409/410/422/500 | — |
| 43 Tenant isolation | FULLY EXECUTED | §U | — |
| 44 Data integrity | API-level only | §V | **ENVIRONMENT BLOCKED**: DB |
| 45 Observability | HOSTED VERIFIED (partial) | §W | outbox ids need log access |
| 46 Source reconciliation | SOURCE VERIFIED | roots for 005(HYP), 031, 032, 033, 039, 048 | — |
| 47 Experience baseline | FULLY EXECUTED | findings 011/044/047 | — |

## Z. Human-blocked items and cleanup

**Human/environment gates:** (1) Admin: complete the refund and confirm Admin finance views; (2) second Host account for cross-Host collision; (3) real-device mobile and screen-reader runs; (4) database/Firestore access (005 index, integrity, outbox); (5) **human check of the two synthetic inboxes** (Guest receipt for B; staff invitation) to confirm Resend delivery; (6) deployed-SHA provenance.

**SYNTHETIC QA CLEANUP CANDIDATES (nothing deleted):** events `969a1da1`, `1a5e984f`, `33b20c9f`(cancelled), `b567434f`, `3c83af79`(postponed), `bb257a3a`, orphan draft `f6beb07f`, and event 008; stuck request `728f365e` (accepted, no event); rejected/cancelled requests; availability windows for 5–13 Dec and 17 Nov; Guest order for B, RSVP orders for C/H/I, refund-review ticket; 3 door codes + scanner sessions; revoked invitation; support ticket. The Host's pre-existing draft was snapshotted and **restored**; the settings toggle was **restored**.


---

## Scorecard (0–100; not inflated by volume of tests)

| Area | Score | Area | Score |
|---|---|---|---|
| Host Studio | 62 | Orders | 70 |
| Venue Studio | 28 | Finance | 55 |
| Host↔Venue workflow | 30 | Analytics | 35 |
| Guest publication reconciliation | 78 | Door (Partner UI) | 22 |
| Mobile | 58 | Performance | 45 |
| Reliability | 50 | Security | 84 |
| Data integrity | 40 | Accessibility | 68 |
| Operational readiness | 36 | | |

## Final result

**HOST/VENUE EXTREME ACCEPTANCE COMPLETE** (with the open items listed in §Y/§Z)

P0 — 0
P1 — 7
P2 — 30
P3 — 19

`HOST STUDIO — 62/100`
`VENUE STUDIO — 28/100`
`HOST/VENUE OPERATIONAL ACCEPTANCE — 36/100`
`HOST/VENUE LAUNCH READY — NO`
`SAFE EXECUTABLE PHASES REMAINING — 9/48` — Phases 1, 2, 7 (mobile steps), 12, 14 (poster/refund-policy edit), 22 (attendee search/export), 29 (partner request flows), 40 and 41 (touch/dialog coverage beyond the sampled pages). They were stopped at sampled depth because of the session's usage budget, not because they are blocked; every other non-executed item has a specific blocker in §Z.
