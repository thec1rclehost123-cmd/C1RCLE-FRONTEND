# C1RCLE Financial Engine — Forensic Audit

- **Date:** 2026-11-17 · **Mode:** READ-ONLY. No code, config, fee, plan, flag, journal, payout or refund was changed. No payout, no worker enablement, no migration.
- **Basis:** backend `staging` `7c181a07`, frontend `staging` `0c7d5f75` (SOURCE VERIFIED), plus the real Test-Mode order from `HOST_VENUE_EXTREME_ACCEPTANCE_20261117.md` (HOSTED/API VERIFIED for legacy-ledger and order values).
- **Evidence labels:** `CODE IS AUTHORITATIVE` · `CONFIG IS AUTHORITATIVE` · `DOCUMENTATION ONLY` · `LEGACY/DEAD` · `UNRESOLVED` · `INFERRED` (derived from code, not observed in staging data) · `NOT TRACED`.
- **Honest limits:** I could not read the staging journal, provider-payment records, Admin finance views, platform-settings document or the journal-transition state (no Admin/DB access). Anything about those is `INFERRED` from code. Concurrency/transaction internals and the authorization matrix were sampled, not exhaustively traced (`NOT TRACED` where stated). Documentation was treated as a claim; where it conflicts with code, code wins.

---

## 0. Executive summary

1. **Money is calculated in three separate places that do not share configuration:** buyer pricing (basis-point policy), the Host/Venue/Promoter *allocation snapshot* (plan table), and read-time *settlement staging* (75 % / 100 %). They are internally consistent for a normal sale, and the buyer total, the allocation and the journal each reconcile to the paisa by construction.
2. **The "15 %" is a hard-coded Host-plan constant** (`basic: 15`), frozen onto each sale at hold creation. Several look-alike 15 %/0.15 values exist and **most are not live**; two **look configurable but are ignored by settlement** (Admin `platformFeeRate`, and the dual-control Admin `COMMISSION_ADJUST`).
3. **The buyer-side ₹79.65 is not missing — in the v2 journal it is recorded** (fees as C1RCLE revenue, tax as a GST liability). It is **absent from the legacy ledger**, which is what staging reads and what Host/Venue see. So the visible Host Finance is a partial view of the money.
4. **Staging cannot release money at all:** it reads `legacy_ledger_v1`, which hard-codes `available = 0`; the 24 h/72 h staged settlement exists only in the v2 read model, whose cut-over state I could not observe. Payouts are doubly gated off and are manual (operator-completed with transfer evidence).
5. **The engine cannot take real money today by design:** the fee policy type only permits `environment: test`, and configuration validation rejects any non-test Razorpay key. No approved production commercial policy exists in code.
6. **Key money risks:** refunds are not gated by or recovered from a Host's payable balance (post-payout refunds can drive the Host's payable negative with no clawback path found); provider disputes are recorded as facts but only act on the journal through an Admin path; Host-caused cancellation refunds the Guest in full including C1RCLE's fees while provider cost is not recoverable.

**Findings: P0 0 · P1 5 · P2 10 · P3 3.** Safety score and gates are in §23.

---

## 1. Financial system map (what exists, and whether it is live)

| Component | Where | Status |
|---|---|---|
| Ticket price, pricing phases (Early Bird) | tier + phase resolved in quote (`pricing.ts`, tiers API) | LIVE — phase price used as the line price (observed: ₹900 sold while base ₹1,200) |
| Promo discount | `calculatePricing` → `discountFor` | LIVE; fees are charged on the *discounted* base |
| Buyer platform fee (5 %), payment fee (2.5 %), GST on fees (18 %) | `booking-fee-policy.ts` basis points via `calculatePricing` | LIVE (default policy; admin-stored copy is read) |
| Free/₹0 orders | RSVP path → `postZeroValueEvidence` | LIVE; zero-value evidence journal only |
| Host platform allocation (plan %) | `snapshotSaleAllocation` → `PLAN_PLATFORM_FEE_PERCENT` | LIVE |
| Venue share | partnership `venueShareRate` (null → 0 %) | LIVE |
| Promoter commission | signed assignment terms (frozen paise) or performance-tier fallback | LIVE (not audited for UX) |
| Legacy compatibility ledger | `finance-service.recordTicketSale` | LIVE, written on every sale (dual write) |
| Financial journal v2 | `financial-posting-service` | LIVE write; **read model selected by a singleton** |
| Staged settlement (24 h/72 h) | `settlement-policy.ts` | LIVE only in v2 read model |
| Refunds, partial refunds | `refund-service`, `postRefund` | LIVE (Admin-approved, dual-control thresholds) |
| Chargebacks | `postChargebackHold/settleChargebackLoss` | LIVE code, **Admin-initiated** |
| Payouts | `payout-service`, `admin-payout-service` | LIVE code, **gated off**, manual completion |
| Reconciliation | `reconciliation-service` | LIVE code; not automatic (see §20) |
| Outbox / event bus | `eventBus.drain` | **Disabled by manifest** (workers off) |
| Admin platform settings | `platform-settings.ts` | PARTIAL (see §16) |
| Analytics revenue | `analytics-service.netPaise` | LIVE; = gross order total minus refunds |

## 2. Every money constant

| Constant | Value | File | Used by | Runtime active? | History / meaning |
|---|---:|---|---|---|---|
| Buyer platform fee | 500 bps (5 %) | `booking-fee-policy.ts` | quote/hold/order snapshot | **YES** (default policy; stored policy overrides) | "Non-production test fees — not approved production commercial rates" |
| Buyer payment fee | 250 bps (2.5 %) | same | same | **YES** | priced by C1RCLE; booked as C1RCLE revenue |
| GST on fees | 1,800 bps (18 %) | same | same | **YES** | applied to (platform+payment fee) only |
| Policy `environment` | `'test'` only | same (`snapshotBookingFeePolicy` rejects others) | quote, admin save | **YES — structural gate** | production policy cannot be represented |
| Guest/organizer refund rule | `admission_only` / `full_paid` | same | refund policy remedy | YES | guest refunds exclude fees; organizer/C1RCLE-caused refunds include fees+tax |
| `PLATFORM_FEE_PERCENT` | 5 | `pricing.ts` | none in calculation | **DEAD** | v1 constant; comment says "rates are constants because contractual" — contradicted by live policy object |
| `PAYMENT_FEE_PERCENT` | 2.5 | `pricing.ts` | none | **DEAD** | same |
| `GST_PERCENT` | 18 | `pricing.ts` | none | **DEAD** | same |
| Host plan fee | Basic 15 · Silver 12 · Diamond 10 % | `onboarding.ts` `PLAN_PLATFORM_FEE_PERCENT` | allocation snapshot at hold; org record at approval | **YES — authoritative for settlement** | "ported verbatim from v1 approveOnboarding" |
| Plan-tier fee table | basic .15 · silver .12 · gold .12 · diamond .10 | `ledger.ts` `PLAN_TIER_PLATFORM_FEE_RATE` | **no consumer found** | **DEAD (duplicate)** | comment: "no proven v1 table exists; defined per roadmap" — contradicts the table above; adds an unreferenced "gold" |
| Org `platformFeePercent` | copy of plan % at approval; `?? 15` default on read | `organization.ts`, org repository | **promoter-assignment validation only**; Admin `COMMISSION_ADJUST` writes it | YES but **not for settlement** | third live-looking holder of the Host fee |
| Admin `platformFeeRate` | 0.15 | `platform-settings.ts` | audit/log only | **PLACEBO** | no calculation reads it |
| Settlement split math | `round(gross × rate)` | `ledger.ts computeSettlementSplit` | allocation snapshot | YES | float multiplication (see §14) |
| Staged settlement | 0 % <24 h · 75 % 24–72 h · 100 % ≥72 h after effective end | `settlement-policy.ts` | v2 balances | YES (v2 only) | no end time → start + 6 h |
| Accounting-policy snapshot | `settlementDelayDays 3`, `reserveBasisPoints 0`, release schedule tag `event_end_24h_75_72h_100` | `financial-journal.ts` (`M4_ACCOUNTING_POLICY`) | stamped on orders/journals | YES as metadata | **contradicts** staged logic: "3 days / 0 bps reserve" vs 24 h/72 h and 25 % reserve — metadata ignored by `stagedSettlement` |
| Platform-settings `accountingPolicy` | version `m2-test-policy-v1`, 3 days, 0 bps | `platform-settings.ts` | payout reservation journals only | PARTIAL | sale snapshots use the M4 constant, not this |
| Promoter performance tiers | 10 / 12 / 15 / 18 / 20 % at 0 / 10 / 25 / 50 / 100 conversions ("Base…Diamond") | `partnership.ts` | commission fallback when no frozen terms | LEGACY BUT ACTIVE | a second "Diamond" (20 % commission) vs the Diamond plan (10 % fee) |
| Refund approvers | ₹500 single / ₹5,000 dual | `platform-settings.ts` | refund-service | YES | Admin-editable |
| Hold TTL | 10 minutes | `checkout-service.ts` | inventory/payment hold | YES | not a financial hold |
| Door/complimentary GST | 0 | door/complimentary services | zero-value paths | YES | free paths carry no tax |

**Multiple definitions of one concept:** Host fee has five holders (plan table, tier table, org field, Admin setting, default `?? 15`); buyer fees have two (dead constants + live policy); settlement timing has three (24/72 staging, "3 days" metadata, platform-settings copy).

## 3. Configuration precedence (who really controls what)

| Parameter | Controlling source | Ignored look-alikes |
|---|---|---|
| Buyer fee rates | **Stored `bookingFeePolicy` (Admin platform settings), else the hard-coded test default** — snapshotted per hold/order | `pricing.ts` constants |
| Host platform fee | **Host's `onboarding.plan` → plan table** (missing record → Basic 15 %) — frozen at hold | org `platformFeePercent`, Admin `platformFeeRate`, ledger tier table, Admin `COMMISSION_ADJUST` |
| Venue share | partnership `venueShareRate` at hold (null → 0) | none |
| Promoter commission | signed assignment terms (frozen paise); else tier fallback | none |
| Settlement timing | hard-coded schedule in `stagedSettlement` (read time) | accountingPolicy days/bps, platform-settings copy |
| Payout availability | `PAYOUTS_ENABLED` flag **and** read-model balance | — |
| Read model | singleton `journalTransition` record | — |
| Razorpay mode | config validation forces a test-prefixed key | — |
Example asked for: *if Admin says 10 %, plan says 15 %, environment says 5 %* → **plan (15 %) controls Host allocation; the Admin number and the org field are ignored; buyer fees follow the stored booking policy (5 % default), not the environment.**

## 4. Host plan economics

Plans Basic / Silver / Diamond (a "Gold" appears only in the dead tier table). Plan affects **only the platform fee percent (15/12/10)**; no feature, payout, settlement or commission differences exist in code. A missing/invalid onboarding record resolves to **Basic (highest)** by explicit design ("must never under-charge"). The plan is read **at hold time** and copied into `saleAllocation` (with onboarding id/version); later plan changes do not alter existing orders (§9). The org field `platformFeePercent` is written once at approval and is **not** re-read for settlement. `UNRESOLVED:` whether a plan system is intended for V1.

## 5. Buyer-side economics (equations)

Let `A` = discounted admission subtotal, `C` = cover subtotal, `X` = add-ons, `B = A + C + X` (discounted subtotal).
- `platform_fee = round_half_up(B × 500 / 10000)` (BigInt)
- `payment_fee  = round_half_up(B × 250 / 10000)`
- `GST = round_half_up((platform_fee + payment_fee) × 1800 / 10000)` — **fees only, not ticket value**
- `grand_total = B + platform_fee + payment_fee + GST`; `assertReconciles` runs on every calculation.
Discounts reduce the fee base (order: subtotal → discount → fees → GST). Fees **do not compound** (GST sits on fees, not on GST). Free orders carry no fees. Fees do **not** vary by payment method. The 2.5 % payment fee is **C1RCLE-priced, not Razorpay's actual cost** (see §7).

## 6. Host-side economics

Base `G = discounted admission subtotal` (cover and add-ons excluded; fees and GST excluded).
- `platform = round(G × plan%/100)`; `venue = round(G × venueShare%/100)`; `promoter = frozen assignment paise (else tier rate)`
- `host = G − platform − venue − promoter` (remainder, so the split **always sums to G exactly**)
All allocations use the **same base G** in parallel; the Host fee is **not** computed on top of commission. Promoter commission (pre-discount line basis per policy note) and the Venue share come out of the Host's remainder; a validation throws if any amount is negative, so an over-large commission **fails hold creation** (fail-closed). **Buyer fee and Host fee stack** (5 % + 2.5 % + GST on the Guest, 15 % on the ticket face to the Host) — the repo's own policy note lists whether this is intended as `UNRESOLVED` (decision 1).

## 7. Razorpay economics

- Amount sent = `grand_total` (order created from the hold; INR; confirmed ₹979.65 → 97,965 paise).
- Capture verified by provider read; webhook and browser verify converge on the payment id (idempotent claim).
- **Provider cost:** the adapter reads the payment's `fee` and `tax` and, when present on the capture fact, posts a separate `provider_fee_expense` journal (Dr expense / Cr provider clearing). Whether the Test-Mode capture for the audited order carried a fee is **unverified** (Admin/provider data unavailable).
- **The 2.5 % is a business fee, proven by code:** it is booked into `platform_fee_revenue` (C1RCLE revenue), *not* a pass-through liability, and actual Razorpay cost is a separate expense line. No code compares the two. Razorpay settlement (provider → C1RCLE bank) is **not modelled** beyond `provider_clearing`/`cash_bank_clearing` accounts.
- `CONFIG IS AUTHORITATIVE:` key-id validation requires a test-prefixed key; webhook verification uses a configured shared credential.

## 8. Tax / GST

GST = 18 % of (platform fee + payment fee) only. Credited to **`gst_tax_liability`** in the v2 journal (so a liability *is* created for new sales). **No tax is calculated on the Host's 15 % plan fee, Venue share, Promoter commission or ticket face value.** The Host Finance "GST ₹0" is a **display bug, not accounting**: `financeOrderToDto` omits `gstPaise` entirely and the contract defaults a missing value to 0 (the UI additionally hides GST when any refund exists). Who remits GST, and whether tax applies to the Host-side fee, are `UNRESOLVED` (no legal advice given).

## 9. Order financial snapshot (immutability)

Frozen **on the hold** (and copied to the order): full pricing breakdown incl. `feePolicy` (version, rates), `saleAllocation` (`sale-allocation-v1`: gross, platform, host, venue, promoter, org ids, partnership id/version, onboarding id/version), `accountingPolicy`, attribution terms. `recordSettlement` re-validates the stored allocation (`validateSaleAllocation`) and refuses to recompute if evidence is missing ("finance review required"). Consequence: **later plan changes, price changes, Admin fee-policy changes and commission changes do not alter existing orders — PROVEN by code path** (historical orders use stored snapshots; legacy orders reconstruct from their immutable ledger rows only if complete). Exception: **settlement staging is evaluated at read time** from the event's *current* dates/status (intentional).

## 10. Ledger / journal entries

**Legacy ledger** (per sale; append-only; idempotent per order+type): `ticket_revenue` (gross, settled) · `platform_fee` (settled) · `venue_share` (pending) · `host_payout` (pending) · `promoter_commission` (pending) · `refund`.
**Journal v2** (double-entry, `createPostedJournal`, idempotency keys `m2:ticket-sale:<order>:collection|allocation|provider-fee`):

| Entry/journal | Debit / credit | Created when | Counterparty | Mutable? | Used by |
|---|---|---|---|---|---|
| Collection | Dr `provider_clearing` (customer total) · Cr `ticket_collection_control` (net ticket) · Cr `event_cover_liability` · Cr `platform_fee_revenue` (platform+payment fee) · Cr `gst_tax_liability` | order fulfilled | Guest/provider | immutable (reversal only) | balances, reconciliation |
| Allocation | Dr `ticket_collection_control` · Cr `platform_commission_revenue` · Cr `host_payable` · Cr `venue_payable` · Cr `promoter_payable` · ± `rounding_adjustment` | same moment | Host/Venue/Promoter/C1RCLE | immutable | balances |
| Provider fee | Dr `provider_fee_expense` · Cr `provider_clearing` | when provider fee fact known | Razorpay | immutable | cost |
| Refund recognition/settlement | reverse revenue/liability/allocation lines pro-rata → Cr `customer_refund_liability`; then Dr liability · Cr `provider_clearing`/`refund_clearing` | refund approved/processed | Guest | immutable | balances |
| Chargeback hold / loss / release | `chargeback_loss_receivable`, `chargeback_reserve`, `partner_payable` | Admin action | Host/provider | immutable | holds |
| Payout reservation / completion / failure reversal | `partner_payable` → `payout_clearing` → `cash_bank_clearing` | payout request/complete/fail | Host bank | immutable | balances |
| Manual reversal | `manual_adjustment_control` | Admin | — | immutable | corrections |

Balance enforcement: the journal model asserts component conservation (`assertFinancialComponents`, rounding adjustment line) and the pricing path asserts `assertReconciles`; the allocation snapshot asserts `platform+host+venue+promoter == gross`. **Every sale-posting path I found goes through `postTicketSale`/`postRefund`/payout posters; I found no write that bypasses the journal**, but the **legacy ledger is written first and independently** (see §11) — `NOT TRACED:` every Admin adjustment path.

## 11. Legacy ledger vs financial journal v2

- **Both are written for every new sale** (dual write in `recordSettlement`: legacy first via the frozen allocation, then the journal using the legacy amounts). Reads use **exactly one** model, chosen by the singleton `journalTransition` (`readModel`); values are **never added** (documented and structural), so double counting across models cannot occur at read time.
- **Legacy view:** `available = 0` always, `pending = pending + (settled − paidOut − reserved − paid − cancellationHeld)`, message "Settlement eligibility requires the controlled journal transition." Contains **no buyer fees, no GST, no platform-fee-revenue**, and no staged settlement.
- **v2 view:** payable lines per order → `stagedSettlement` → refund exposure → dispute exposure → provider-verification hold (captured amount, currency, order, fulfilment state must match) → `available`, with separate `policyReserve`, `refundHeld`, `disputeHeld`, `providerHeld`.
- **Transition state machine:** `legacy_reads → backfill → comparison → journal_reads`. Cut-over requires a completed backfill, a completed comparison and **zero discrepancies**; rollback to legacy is always allowed; a backfill can restart only from legacy reads. Comparison compares per-org legacy payable vs journal payable.
- **Staging uses legacy** (observed: `readModel: legacy_ledger_v1`). Production intent is v2; **what must happen first:** run backfill for historical orders, run comparison to zero discrepancy, cut over, with workers/payout flags decided. Historical rows without complete allocation evidence cannot be backfilled safely (`allocationFromLedger` fails closed).

## 12. Settlement policy (proved from `settlement-policy.ts`)

Per **order**, on the order's remaining Host proceeds: event cancelled → 100 % into "cancellation held"; non-active status (draft, postponed, etc.) → 100 % pending; `elapsed = now − effectiveEnd`; `<24 h` → 0 % eligible; `24 h ≤ elapsed < 72 h` → `⌊p/4⌋·3 + ⌊(p mod 4)·3/4⌋` (≈75 %) eligible, the rest "policy reserve"; `≥72 h` → 100 %. `effectiveEnd = endAt`, else `startAt + 6 h`. Timestamps are epoch milliseconds (no timezone dependence); boundary: `elapsed == 24 h` is eligible, `== 72 h` fully eligible. **The 25 % reserve is Host money delayed, not revenue and not a fee.** It is then reduced by refund exposure, disputes and unverifiable provider state. Free orders have no payable. **Staging cannot show any of this** (legacy model).

## 13. Reserves and holds (not conflated with inventory holds)

| Hold | Created | Amount | Release | Owner | UI |
|---|---|---|---|---|---|
| Checkout inventory hold | quote→hold | tickets, 10 min TTL | expiry/payment | Guest/event | n/a (not money) |
| Settlement policy reserve | read time | 25 % in 24–72 h | automatic at 72 h | Host | Finance "Pending settlement/On hold" (v2 only) |
| Refund hold | active refund request | requested amount | resolution | Host | v2 only |
| Dispute hold | open dispute | dispute amount | resolution | Host | v2 only |
| Provider-verification hold | mismatch/uncertain capture | affected remaining | reconciliation | Host | v2 only |
| Cancellation hold | event cancelled | all proceeds | n/a (not released by code found) | Host | "On hold" |
| Chargeback reserve | Admin | exposure | Admin | Host/C1RCLE | none |
| Payout reservation | payout request | requested | complete/fail | Host | payouts |

## 14. Rounding

Buyer fees: **integer BigInt half-up** (`feeAtBasisPoints`). Promo percent: scaled integer (`applyPercent`). **Settlement split:** `Math.round(gross × rate)` with `rate = percent/100` — **floating-point multiplication** (Host remainder keeps the sum exact). Refund apportionment: float `(amount×weight)/total` then floor + **largest-remainder distribution** (sums exactly). Staged settlement: integer division. Edge cases: gross 1 paisa × 15 % → platform 0, Host 1 (conserved); 33.33 % style rates are not representable (whole-number plan %; Venue/Promoter rates are `÷100` floats). `NOT TESTED:` randomized property tests; the repo has unit tests but I did not run backend tests in this sandbox.

## 15. Idempotency (by operation)

| Operation | Key | Verdict |
|---|---|---|
| Quote | none (read) | n/a |
| Hold / payment attempt | request idempotency key; one pending attempt per user+event enforced (observed) | PROVEN (observed) |
| Payment confirmation / webhook | converges on provider payment id (browser verify + webhook) | PROVEN IDEMPOTENT (code + comments) |
| Order / ticket issue | `order.fulfilled`, stable ids | PARTIAL (repair service exists for failures) |
| Ledger entries | one per (order, type); replay returns existing | PROVEN |
| Journals | idempotency keys `m2:ticket-sale:<order>:…` | PROVEN |
| Refund | refund-request id; replays compared to stored components | PROVEN (code) |
| Capture compensation | deterministic `REF-COMP-<hash(order)>` | PROVEN |
| Payout | deterministic id from (org, key); replay compares bank/amount/user | PROVEN; conflict → error |
| Settlement release | none needed (read-time) | n/a |
| Provider events | recorded with ingestion de-dup (`idempotent_replay`) | PARTIAL |
Locking: payout creation uses `createWithinLimit` (atomic against the payable limit). `NOT TRACED:` Firestore transaction scope for every write; race scenarios (§17) are `UNPROVEN` except where noted.

## 16. Admin financial controls

| Control | Affects live engine? |
|---|---|
| Booking-fee policy (platform settings) | **YES** (read at quote); but type allows only `environment:test` |
| `platformFeeRate` | **NO — placebo** |
| `accountingPolicy` (platform settings) | **Partly** — payout reservation journals only; sale snapshots use the M4 constant |
| Refund approver thresholds | YES |
| `COMMISSION_ADJUST` (dual-control, TIER3) | **NO for settlement** — writes `org.platformFeePercent`, which only affects promoter-assignment validation |
| Refund approve/execute, payout freeze/release/complete/fail, dispute resolve, chargeback hold/loss/release, manual reversal | YES (Admin authority; `NOT TRACED` for every role check) |

## 17. Payouts, refunds, disputes, cancellation, postponement

**Payouts (disabled):** request → bank account must belong to org → deterministic id → `finance.getBalances` → `payableLimit = available + reserved + paid` → atomic create + reservation journal → operator `beginProcessing` → operator `completePayout` with transfer evidence (manual bank transfer; **no automated provider payout found**) → completion journal → or `failPayout` reversal. Gates: `PAYOUTS_ENABLED` (route guard; staging disabled) and the balance model (staging legacy → available 0). Duplicate request → idempotent. Provider timeout/callback failure: **not applicable** (manual). Bank-account change after request: payout is bound to the bank account id at creation. Refund/dispute after payout: **no clawback or negative-balance control found** (FIN-004).
**Refunds:** Guest-requested = admission only; organizer/C1RCLE-caused (cancel, material change) = full paid incl. fees and tax. Journal reverses revenue/GST/allocation lines **pro-rata**, pays customer from provider clearing; cannot exceed captured amount (`Refund exceeds the original customer payment`); inventory and ticket invalidation follow the order state. Refund execution is **not gated by the Host's payable balance** and no recovery mechanism was found.
**Disputes/chargebacks:** webhooks record refund/dispute **facts** for reconciliation only; journal hold/loss/release run through Admin-authority methods; recoverable amount = min(chargeback, allocation total), the rest `platformExposure` booked to `chargeback_loss_receivable`. **No automatic Host hold on provider dispute events.**
**Cancellation:** event cancelled → settlement 100 % to cancellation hold; Guests refunded in full via Admin-approved organizer-cancel refunds; C1RCLE's fee revenue and GST are reversed; **provider cost on refunded payments is not recovered anywhere in code**, so the intended "Host-caused cancellation must not cost C1RCLE" is **not enforced** (`UNRESOLVED` policy + FIN-015).
**Postponement:** non-active status → `held` (nothing eligible); dates retained are historical, so after a reschedule the settlement clock restarts from the new `endAt`. Journals untouched.

## 18. Venue and Promoter money; free orders

Venue: only `venue_share` (partnership rate, default 0 % → ₹0 row, as observed). No rental payment is modelled or paid (`CODE IS AUTHORITATIVE` — nothing posts rental). Promoter: commission allocated at hold from frozen assignment terms; deducted from the Host remainder **after/independent of** the platform fee; cannot exceed distributable value (fail-closed); reversed pro-rata on refunds. Free RSVP: marked `paid` for ₹0 because order state means "fulfilled"; touches **no ledger/journal money**, only a zero-value evidence journal, attribution and analytics counts.

## 19. Analytics and UI semantics

| Label | Formula | Source | Mismatch |
|---|---|---|---|
| "Money made" / event "revenue" / Gross revenue | `Σ (order.grandTotal − refunded)` over captured orders = **Guest gross incl. fees and GST** | analytics service | not Host money |
| Host Analytics "Net revenue" | gross − refunds (**not** net of fees) | same | not payable |
| Host Finance "earned/pending" | legacy `host_payout` rows | ledger | correct but excludes buyer fees |
| Finance order "GST" | field omitted by DTO → 0 | finance route | false zero |
| Org overview totals | bounded read model; excludes RSVPs; lagged | analytics | stale vs event analytics |
| Venue analytics | owned-events only | analytics | ignores Host events at Venue |

## 20. Environment, flags, workers, reconciliation, failure modes

Flags: `PAYOUTS_ENABLED` (off), `BACKGROUND_WORKERS_ENABLED` (off in manifest), M5 feature flags (private access, transfers, cover sales, add-ons…), Razorpay credentials (test-only validation), webhook credential, OTP hashing key, email provider config. **Workers off means:** the persisted-outbox drain/retry does not run (failed email/notification/fulfilment events are not retried automatically); promoter-assignment expiry and cleanup sweeps do not run. **Not worker-dependent:** settlement release (read-time), refunds/payouts (manual/Admin). Reconciliation (`amount/currency/provider-order/refund/chargeback/payout` mismatch kinds) is a service with Admin surfaces and feeds the v2 provider-verification hold; payout is blocked by it **only in the v2 read model**. Failure modes: capture without fulfilment → order flagged `compensationRequired`, deterministic capture-compensation refund request (approval-gated); hold expired before capture → compensation path; Firestore/outbox failure after payment → repair service (`fulfilment-repair`) — `UNPROVEN` end-to-end without workers.

## 21. Source-of-truth matrix

| Concept | Authoritative | Duplicate/ignored | Runtime consumer | Risk |
|---|---|---|---|---|
| Buyer fees | stored booking policy (test) | `pricing.ts` constants | `calculatePricing` | policy cannot be non-test |
| Host fee % | `onboarding.plan` table | tier table, org field, Admin setting, `?? 15` | `snapshotSaleAllocation` | Admin change is a placebo |
| Venue share | partnership | — | allocation | null → 0 silently |
| Promoter commission | frozen terms | tier table | allocation | naming collision |
| Settlement timing | `stagedSettlement` | accountingPolicy days/bps | v2 balances | metadata contradicts |
| Read model | transition singleton | — | `getBalances` | unobserved in staging |
| Revenue label | analytics gross | finance ledger | UI | misleading |

## 22. State machines (as coded)

- **Payment/order:** hold(active) → payment attempt → captured (provider-verified) → order `paid` + fulfilment `pending→fulfilled`; failure → `compensationRequired`; hold expiry → expired.
- **Refund:** pending → approved (single/dual approver by amount) → executing → settled | declined | failed(provider).
- **Settlement (derived, not stored):** held → (24 h) 75 % eligible → (72 h) 100 % eligible; cancelled/postponed → held.
- **Payout:** requested → processing → paid | failed (reversal). Invalid: payout above `payableLimit`; completing a non-processing payout.
- **Dispute:** open → reviewing → resolved (Admin); chargeback: hold → loss | release.
- **Journal transition:** legacy_reads → backfill → comparison → journal_reads; rollback → legacy_reads.

## 23. The ₹979.65 money map (order for the Early Bird ticket)

Observed (API VERIFIED): Guest total 97,965 paise; legacy ledger `ticket_revenue 90,000`, `platform_fee 13,500`, `host_payout 76,500`, Venue `venue_share 0`. Journal v2 postings below are `INFERRED` from `buildTicketSaleJournals` (journal not readable in staging).

| Component | Amount | Owner / liability | Journal location (v2) | Legacy ledger | Provider | Revenue? |
|---|---:|---|---|---|---|---|
| Ticket face (Early Bird) | ₹900.00 | Host (after allocation) | Cr `ticket_collection_control` → allocated | `ticket_revenue` | part of capture | no (gross custody) |
| Buyer platform fee 5 % | ₹45.00 | C1RCLE | Cr `platform_fee_revenue` | **not recorded** | part of capture | **yes** |
| Buyer payment fee 2.5 % | ₹22.50 | C1RCLE (priced fee) | Cr `platform_fee_revenue` | **not recorded** | part of capture | **yes** |
| GST on fees 18 % | ₹12.15 | tax authority | Cr `gst_tax_liability` | **not recorded** | part of capture | no — liability |
| Host plan fee 15 % | ₹135.00 | C1RCLE | Cr `platform_commission_revenue` | `platform_fee` | — | **yes** |
| Venue share | ₹0.00 | Venue | line omitted (zero) | `venue_share` 0 | — | no |
| Promoter commission | ₹0.00 | Promoter | line omitted (zero) | none | — | no |
| Host payable | ₹765.00 | Host | Cr `host_payable` | `host_payout` | — | no — liability |
| Razorpay fee + tax on fee | **unknown** | provider cost | `provider_fee_expense` (only if fact recorded) | not recorded | in Razorpay | expense |

Check: ₹900 + 45 + 22.50 + 12.15 = **₹979.65** ✓; allocation 135 + 765 = ₹900 ✓. **C1RCLE gross revenue recognized = ₹67.50 + ₹135.00 = ₹202.50** before provider cost; **liabilities = ₹765.00 Host + ₹12.15 GST**. **No paise is unexplained** in the designed journal. **Not represented / not verifiable:** Razorpay's actual fee for this capture (unknown, possibly unrecorded), tax on the ₹135 Host fee (no tax calculated), and the buyer-side ₹79.65 in the **legacy** ledger that Host/Venue read.

## 24. Financial invariants

| Invariant | Status |
|---|---|
| Guest total = sum of its components | ENFORCED (`assertReconciles`) |
| Captured amount = order total | ENFORCED in v2 provider-verification hold; PARTIAL for legacy |
| Allocation sums to gross | ENFORCED (`validateSaleAllocation`) |
| Journal conserves components | ENFORCED (`assertFinancialComponents` + rounding line) |
| Promoter/Venue/platform ≤ distributable | ENFORCED (fail-closed at hold) |
| Refund ≤ captured | ENFORCED |
| Payout ≤ available | ENFORCED (atomic `createWithinLimit`) — only meaningful under v2 |
| Held + available + paid reconcile | PARTIAL (v2 only; unobserved) |
| Refund cannot leave Host payable negative after payout | **NOT ENFORCED** |
| Duplicate webhook cannot duplicate money | ENFORCED (code) |
| Admin fee change must affect settlement | **NOT ENFORCED (placebo)** |
| Buyer fees visible in the Host/Venue ledger view | **NOT ENFORCED** |

## 25. Loss scenarios

Payment succeeds, ticket fails → compensation refund request (approval-gated; money owed back but manual); duplicate ticket → entitlement/order idempotency (low risk); duplicate refund/payout → deterministic ids (low); **Host paid before refund / refund after payout → negative Host payable, no clawback (HIGH when payouts enabled)**; chargeback after payout → `platformExposure` booked as a receivable, recovery manual; event cancelled after payout → same as refund-after-payout; wrong plan fee/missing onboarding → Basic fallback (conservative); Venue/Promoter exceeding proceeds → blocked at hold; provider fee > buyer payment fee → unrecorded margin loss (cost recognition depends on a capture fact; no comparison); tax on Host fee → not computed; journal transition → no double count (single read model) but **staging unverified**; workers off → retries never run (stuck notifications/fulfilment recovery).

---

## 26. Findings

### P1
- **FIN-001 · Admin `COMMISSION_ADJUST` is a placebo for settlement.** Evidence: `admin-ops-service.adjustCommissionFromProposal` writes `org.platformFeePercent`; `snapshotSaleAllocation` reads `onboarding.plan`; the org field only feeds promoter-assignment validation. Consequence: a dual-control Admin action appears to change a Host's fee but **changes no Host's actual deduction**. Parties: Hosts, C1RCLE. LIVE. Direction: single source of truth for the Host fee.
- **FIN-002 · Settlement/availability cannot work on the model staging uses.** `legacy_ledger_v1` hard-codes `available 0`; the 24 h/72 h staging, refund/dispute/provider holds exist only in v2, whose transition state is unobserved. Consequence: staged settlement is **untested in hosted environments** and any production cut-over is unproven. LIVE (staging).
- **FIN-003 · No approved production commercial policy exists in code; real money is structurally blocked.** The fee-policy type only permits `environment:test`; config validation rejects non-test Razorpay keys; docs say rates are not approved. Consequence: launch needs code + policy decisions, not just configuration.
- **FIN-004 · Post-payout refunds/cancellations have no recovery path.** Refund execution is not gated by the Host's payable balance; reversal journals are not capped by current balance; only chargebacks have a loss receivable. Consequence: negative Host payable and C1RCLE-borne loss once payouts are enabled.
- **FIN-005 · Provider disputes do not automatically hold Host money.** Webhooks record facts only; holds/loss require Admin action. Consequence: a chargeback can be paid out before anyone acts.

### P2
- **FIN-006** Five holders of the Host fee % and two of the buyer fee rates (dead `pricing.ts` constants; dead `PLAN_TIER_PLATFORM_FEE_RATE` that contradicts the live table's own provenance comment; org `?? 15` default).
- **FIN-007** Accounting-policy metadata (`settlementDelayDays 3`, `reserveBasisPoints 0`) contradicts the live 24 h/72 h and 25 % logic; platform-settings `accountingPolicy` is partly unread.
- **FIN-008** Legacy ledger (what Host/Venue see in staging) omits all buyer-side money (₹79.65 here) and GST; "Money made" is Guest gross; "Net revenue" is net of refunds only (ties to PARTNER-004).
- **FIN-009** Finance-orders DTO omits `gstPaise`; UI shows ₹0/none (false zero) and hides GST whenever any refund exists.
- **FIN-010** GST is computed only on buyer fees; **no tax on the Host plan fee** is calculated or journaled; remittance responsibility unresolved.
- **FIN-011** Provider fee/tax recognition depends on a capture fact; no reconciliation of actual Razorpay cost against the 2.5 % C1RCLE fee; Razorpay settlement not modelled.
- **FIN-013** Workers disabled in the manifest: outbox retry/drain and sweeps do not run; failed fulfilment/email/notification effects are not retried.
- **FIN-014** Dual write (legacy then journal) is not one atomic unit; a failure between them depends on the repair service (`UNPROVEN`).
- **FIN-015** Host-caused cancellation: Guest refunded in full incl. fees, C1RCLE revenue reversed, provider cost unrecoverable — conflicts with the stated intent that C1RCLE not absorb the loss.
- **FIN-018** Reconciliation is Admin-driven; payout blocking by reconciliation exists only under v2 (`NOT FULLY TRACED`).

### P3
- **FIN-012** Settlement split and Venue/Promoter rates use floating-point multiplication/division (sum still conserved by remainder).
- **FIN-016** Name collision: Diamond plan (10 % fee) vs Diamond promoter tier (20 % commission).
- **FIN-017** Legacy entry statuses (`settled` for ticket_revenue/platform_fee immediately, `pending` for payouts) are accounting-ambiguous and shown to users.

**Totals: P0 0 · P1 5 · P2 10 · P3 3.**

## 27. Business-owner decisions (policy, not engineering)

| # | Decision | Current behavior | Why you must decide | Options | Blocks |
|---|---|---|---|---|---|
| 1 | Should Guests pay platform + payment fees? | 5 % + 2.5 % + GST on fees, test policy | Revenue model and consumer price | keep / fold into price / drop | production policy, GST treatment |
| 2 | Should Hosts also pay a plan fee? Stack with #1? | 15 % on ticket face, stacks (UNRESOLVED in repo) | Host economics | keep both / one / tiered | plan table, Host UI wording |
| 3 | Is there a plan system in V1 (Basic/Silver/Diamond)? | table exists; Admin cannot actually change it | feature scope | keep, flatten to one rate, per-Host override | FIN-001/006 |
| 4 | Who absorbs payment-processing cost? | C1RCLE (2.5 % is revenue) | margin risk if cost > fee | pass-through / keep markup / Host-borne | provider-fee reporting |
| 5 | Meaning of "Net revenue"/"Money made" | gross / net of refunds | Host trust | define Host proceeds vs Guest gross | finance UI |
| 6 | Venue share | optional per partnership, default 0 | Venue model | keep / mandatory / none in V1 | Venue finance |
| 7 | Promoter commission vs Host fee | independent; paid from Host remainder | order of deductions | before/after fee | allocation math |
| 8 | Settlement timing | 24 h 75 % / 72 h 100 % | cash flow and risk | keep / change | v2 cut-over |
| 9 | Reserve percentage | 25 % delayed, not a deduction | risk appetite | keep / separate rolling reserve | refund/dispute exposure |
| 10 | Refund economics | guest: admission only; organizer cancel: full | who bears fees/provider cost | as is / Host-liable | FIN-015 |
| 11 | Cancellation liability | not enforced | stated intent differs | Host liable with clawback | FIN-004 |
| 12 | Tax treatment of the Host fee | none computed | legal | decide | tax journals |
| 13 | Chargeback policy | manual Admin | exposure | auto hold / reserve | FIN-005 |
| 14 | Payout mode | manual operator transfer | scale | manual / automated provider | payouts |

---

## 28. Scores and gates

| Area | Score | Area | Score |
|---|---|---|---|
| Money correctness (buyer, split, journal) | 80 | Idempotency | 78 |
| Accounting completeness (design) | 74 | Concurrency safety | 55 (not fully traced) |
| Accounting completeness (as visible to Host/Venue) | 35 | Tax representation | 40 |
| Fee-policy consistency | 35 | Observability | 50 |
| Settlement correctness (logic) | 80 | Admin controls | 35 |
| Settlement as observable in staging | 15 | Host transparency | 30 |
| Refund safety | 55 | Payout safety | 55 (gated; manual) |
| Reconciliation | 55 | | |

`FINANCIAL ENGINE SAFETY — 52/100`
`SAFE TO ACCEPT REAL CUSTOMER MONEY — NO` (structurally blocked and policy unapproved)
`SAFE TO ENABLE HOST PAYOUTS — NO` (v2 unverified in hosted env, no post-payout recovery, no automatic dispute hold)

---

**FINANCIAL ENGINE FORENSIC AUDIT COMPLETE**

P0 — 0
P1 — 5
P2 — 10
P3 — 3

`FINANCIAL ENGINE SAFETY — 52/100`
`SAFE TO ACCEPT REAL CUSTOMER MONEY — NO`
`SAFE TO ENABLE HOST PAYOUTS — NO`
`BUSINESS OWNER DECISIONS REQUIRED — 14`
`UNACCOUNTED MONEY COMPONENTS — Razorpay's actual fee/tax for the audited capture (unknown, possibly not recorded); tax on the ₹135.00 Host plan fee (not calculated); the buyer-side ₹79.65 in the legacy ledger Host/Venue read (journal-only).`
