# M4 Commercial Policy Decision Record

Status: **business review required; not approved**.

This record describes code observed on the M3 backend base as of 2026-10-28. It is not legal, tax, accounting, or commercial approval. M4 must preserve the observed calculation until an authorized business decision changes it.

## Existing guest checkout pricing

'packages/core/src/domain/models/pricing.ts' uses integer paise and the following M3 constants:

- Platform fee: 5% of discounted ticket subtotal.
- Payment fee: 2.5% of discounted ticket subtotal.
- GST: 18% of those two fees only.
- Order: subtotal → discount → fees on discounted subtotal → GST on fees.

Example for ₹1,000 with no discount: platform fee ₹50, payment fee ₹25, GST ₹13.50, guest total ₹1,088.50. This pricing breakdown is the guest charge calculation; it is separate from post-sale commercial allocation.

## Existing post-sale allocation

'CheckoutService.recordSettlement' currently derives:

- Host-plan platform allocation: Basic 15%, Silver 12%, Diamond 10%; missing approved onboarding falls back to Basic.
- Venue share: negotiated partnership 'venueShareRate'; missing rate resolves to 0%.
- Promoter commission: checkout applies the signed assignment terms to the pre-discount PricingBreakdown.lines subtotal (percentage rounded down per line) plus the fixed paise amount per unit. The finance service uses that frozen amount when provided; legacy calls can use the existing performance tier rate.
- Host receives the remainder of discounted ticket-face revenue after platform, venue, and Promoter allocations.

For ₹1,000 discounted ticket value, Basic plan, 10% venue share, and a 10% assigned Promoter commission: platform ₹150, venue ₹100, Promoter ₹100, Host ₹650. Guest-facing 5%/2.5% fees and GST remain separate from this allocation basis.

Before M4, the guest quote checked the frozen commission against `grandTotalPaise - platformFeePaise`, which did not include the complete post-sale allocation. M4 quote validation now uses the same rounded Host-plan and Venue allocation rates as settlement against discounted ticket-face value, then rejects a frozen Promoter commission that does not fit before hold/payment. It does not silently cap or recalculate that commission. A high-discount domain regression and a memory-backed API quote regression cover the guard; a connected non-production checkout run remains open.

Example of the guard: a ₹1,000 ticket with a ₹250 discount, Basic plan, 10% Venue share, and a frozen ₹750 Promoter commission would allocate ₹112.50 to the platform and ₹75 to the Venue from ₹750 net ticket revenue. The complete ₹937.50 allocation exceeds the distributable value, so M4 rejects the quote before payment. The domain guard regression covers this boundary; the API regression covers a previously fitting commission that no longer fits after a 25% discount. This is a technical fail-closed rule, not a commercial approval of the underlying pre-discount commission formula.

## M4 preservation and snapshots

M4 must not change the guest fees, GST treatment, host-plan allocation, negotiated venue allocation, assignment commission, Host remainder, journal-transition mode, or legacy compatibility-ledger behavior without a separate business decision. Persist the applied assignment terms and policy version with order/journal evidence; never recalculate a historical order from current settings. No live payout is enabled.

## Admin commission hold boundary

The current Admin freeze/release commands operate on a whole `Payout`, through dual-control proposals. Promoter commissions instead exist as payable allocation lines in append-only financial journals; finance balances derive from those journal lines. There is no commission-level hold record or transition today. Reusing payout freeze for a commission would freeze the entire organization's payout, while adding a commission-level hold would require a new accounting/read-model transition and a defined release/reversal interaction. M4 therefore leaves commission-specific freeze/release unsupported until business and accounting owners approve the affected balance, payout eligibility, refund, chargeback, audit, and release semantics. This is not covered by generic payout freeze/release.

## Unresolved decision points

1. Confirm whether guest-facing platform fee and the separate 10–15% settlement platform allocation are intentionally cumulative revenue components, and identify their accounting treatment.
2. Confirm assignment commission bounds, percentage rounding, interaction of percentage plus fixed-per-ticket amounts, and tier overrides.
3. Confirm whether the observed pre-discount commission basis is intended, and how discounts funded by a Venue, Host, Platform, or shared funding affect the basis.
4. Confirm cancellation, partial-refund, chargeback, and unsettled commission treatment for each financial state.
5. Confirm tax, invoicing, withholding, and legal agreement requirements before any production launch or payout.
6. Confirm whether legacy performance-tier commission remains available for new M4 assignments or is compatibility-only.
7. Define commission-level hold and release semantics before adding a separate held balance or Admin transition.

No policy decision is inferred from implementation comments, fixtures, or historical behavior. The implementation team must not label these formulas commercially approved.
