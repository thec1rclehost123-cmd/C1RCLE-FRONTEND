# M4 Promoter Attribution Model

This document records the intended technical model for M4. M3 behavior is distinguished from the M4 rules required by the implementation directive. It does not grant commercial or legal approval.

## Existing M3 records

- A Promoter is an Organization; there is no separate Promoter profile entity in M3.
- 'PromoterAssignment' is versioned and currently has 'active', 'ended', and 'suspended' states. Its commission terms are stored with the assignment.
- 'ReferralLink' stores the event, Promoter organization, assignment ID/version, terms snapshot, signed attribution material, public code/vanity address, active flag, and aggregate click/conversion/revenue/commission counters.
- Checkout accepts an optional 'referralCode'. The backend resolves the code for the selected event, verifies the signature, and copies link/assignment/terms evidence into the reservation/order attribution.
- Existing referral vanity routing resolves to an event path with '?ref=...'. A guest click tracker writes session storage and calls the public click endpoint, but M3 does not mount the tracker or pass the code through checkout.
- Existing order attribution is intended to be immutable and downstream finance uses it for Promoter allocation. Aggregates on referral links are reporting counters, not the authority for a sale.

## M4 target lifecycle

1. An Organization member submits Promoter onboarding and accepts the current agreement version.
2. Admin records an audited approval decision. An unapproved or suspended Promoter cannot accept or activate campaigns.
3. Venue/Host creates an invitation for an owned, eligible event with immutable versioned terms and a bounded campaign window.
4. The Promoter accepts or rejects that invitation. Acceptance records the exact terms version. Revocation/expiration stops new attribution and preserves past order evidence.
5. An accepted assignment may create an idempotent public code/link. Link deactivation and assignment status are checked server-side.
6. Guest navigation carries only the public referral code. The backend resolves code, event, assignment, Promoter status, link status, and allowed window before accepting attribution.
7. A valid attribution is captured on the inventory hold. Later clicks cannot rewrite that hold. Checkout, browser verification, webhook fulfillment, and recovery use the same persisted snapshot.
8. A fulfilled eligible paid order posts Promoter commission once using the persisted assignment and policy snapshot. A free RSVP may count as a conversion only; it creates no monetary commission unless an explicit existing policy permits it.
9. Refunds reverse commission proportionally; full refunds reverse the remaining payable. Chargebacks follow existing hold/reversal policy. Duplicate events are idempotent.

## M4 attribution rules

Where M3 has no explicit rule, the directive's reviewable technical defaults are:

- Attribute only to the selected event and an active, accepted assignment.
- Validity ends at the earliest of seven days, campaign expiration, assignment revocation, or event sales closure.
- A valid explicit Promoter campaign code overrides a prior Promoter-link attribution for that event only before an immutable hold/order snapshot exists.
- A generic discount promo does not erase valid Promoter attribution.
- Last valid Promoter interaction wins only before a validated hold captures attribution.
- Self-referral is rejected or flagged using identity evidence already available; no fingerprinting is introduced.
- Suspended Promoters cannot generate new attribution. Historical fulfilled order snapshots remain intact.
- Duplicate clicks may be suppressed for reporting; clicks never create conversions or commission.
- Invalid, expired, revoked, or event-mismatched codes are not attributed. A failed click-report request cannot block a purchase.

Implementation status: quote/hold resolution checks the signed link, same event, current assignment state and dates, event published/started state, and eligible-tier sales closure. A dedicated `lastClickedAt` is persisted for new click records; older links fall back to creation time. The server rejects a code more than seven days after that interaction. Authenticated checkout/RSVP rejects attribution when the Guest is a member of the attributed Promoter organization. Checkout prefers an explicit `ref` query code over the earlier session code and passes that selected code to quote and hold; a focused regression test verifies both calls. The Guest session expiry remains navigation convenience only. Public click, quote, hold, and RSVP responses omit whether a referral code is valid or applied. Newly generated default vanity aliases carry a 96-bit random suffix instead of a code-derived suffix; explicitly requested aliases remain public by design. Existing aliases are not rewritten by this code change. The click tracker suppresses duplicate effect delivery for 30 seconds in the same browser session and now sends a random click token that the backend deduplicates atomically for 60 seconds. This guards retries that reuse that token; it does not prevent a caller from generating a fresh token for each request. Risk flags remain open M4 work.

## Privacy boundaries

Public URLs contain only a public code and event path; default generated vanity aliases use a 96-bit random suffix to resist guessing. No referral validity signal is returned by anonymous click, quote, hold, or RSVP responses. Explicitly requested vanity aliases are public values and must not be treated as secrets. No Promoter personal data, commission terms, internal identifiers, or secrets are embedded. Click evidence is minimized; no raw browser fingerprint is stored. Promoter-facing order projections omit Guest email, phone, payment identifiers, and full order internals. Client/session storage is navigation convenience only and is never financial authority.

## Persistence and reconciliation

The order/hold snapshot must retain the assignment ID and version, referral link/code ID, Promoter organization, event, commission terms/version, attribution timestamp, and applicable policy version. Financial entries reference the order, event, assignment, Promoter organization, and policy version. Reconciliation compares durable order attribution with canonical journal evidence; referral-link counters do not replace either record.

## Migration

Existing active/ended/suspended assignments and links require a dry-run inventory and a resumable idempotent migration plan before any data write. Existing records without explicit invitation acceptance remain legacy active assignments; legacy auto-generated vanity aliases need a read-only inventory and an approved rotation plan before M4 activation because this change does not rewrite existing URLs; backfill must not fabricate an acceptance actor or timestamp. No production migration is authorized or performed by this document.
