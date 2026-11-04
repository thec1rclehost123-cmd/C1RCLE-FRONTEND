# Milestone 3 implementation plan

This is the cross-repository execution ledger for `codex/m3-connected-product-experience`.
The paired backend worktree is `/Users/aayushdivase/Desktop/C1RCLE-M3-BACKEND`.

Only one packet may be marked `IN PROGRESS`.

| Packet | Scope                                                                 | Status      |
| ------ | --------------------------------------------------------------------- | ----------- |
| 1      | Runtime truth and shared product state                                | COMPLETE    |
| 2      | Premium frontend foundation                                           | COMPLETE    |
| 3      | Guest home, Explore, and event detail                                 | COMPLETE    |
| 4      | Checkout, payment, recovery, and confirmation                         | COMPLETE    |
| 5      | Guest orders, profile continuity, wallet, and ticket truth            | COMPLETE    |
| 6      | Event cancellation and post-transaction propagation                   | COMPLETE    |
| 7      | Transactional emails and receipts                                     | COMPLETE    |
| 8      | Connected partner workspace                                           | COMPLETE    |
| 9      | Partner analytics and finance presentation                            | COMPLETE    |
| 10     | Admin cross-surface operations                                        | COMPLETE    |
| Final  | Aggregate verification, independent review, push, and coordinated PRs | IN PROGRESS |

## External gate

Render and Razorpay Test Mode staging/provider acceptance is pending. It does not block coding,
but it blocks release acceptance. No Live Mode, production data, manual deployment, or payout
enablement is authorized.

## M4 boundary

M3 exposes truthful entitlement state and removes decorative admission credentials. QR
credentials, scanner compatibility, door sessions, offline retry, admission authorization, and
duplicate-scan reliability remain M4.

## Implementation notes

- Final verification in progress: all M3 implementation packets are complete. No deployment, merge, live-service access, or milestone progression is authorized.

- Host acceptance follow-up: the live accepted-slot editor was confirmed after correcting the earlier premature “blank page” classification. Its missing-active-partnership edge now returns a visible error instead of a blank body (focused route test 2/2; focused ESLint and Prettier pass). The existing namespaced event edit form was exercised with a temporary reversible summary edit and restored. Live Host event analytics, sales, attendees, and promoter pages render truthful zero/empty states. Aggregate verification remains deferred until the authorized acceptance scope is complete.

- Host completion follow-up: added connected event cancellation UI using the existing permission-checked, idempotent backend endpoint. The dialog requires a trimmed reason, warns about order/ticket consequences, and reuses the same intent key after an ambiguous retry; terminal event states hide the action. Focused UI/repository tests, API validation tests, lint, and core/API typechecks pass. No event was cancelled; browser acceptance and downstream cancellation effects remain pending. New slot-request API writes now require a published `slotId`, derive Host ownership from the authenticated actor, and claim the slot through the existing atomic repository path; legacy nullable DTO reads remain supported. Focused API/core lifecycle tests pass; live cross-role revalidation remains pending.

- Packet 10 completion: the admin console audit found every operation backed by the existing authenticated admin API, with no fixture-backed operations. The admin overview now labels page-bounded refund-value and active-admin aggregates accurately instead of representing them as exhaustive, and its live-summary failure state offers a retry. Focused admin overview tests: 3 passed; admin-console typecheck and `git diff --check` passed.

- Packet 9 completion: the finance workspace reads the M2 balance, ledger, payout, bank-account, and organization-order APIs. It now reports its IST read time, uses IST calendar boundaries for finance dates and weekly trend buckets, exposes bounded order/payout/ledger coverage, and does not retain a nonfunctional history scope or a duplicate disabled withdrawal action beside the real idempotent payout request. Venue and host event analytics now render the existing tenant-scoped event analytics projection; promoter metrics remain explicitly unavailable because that referral/click read model is absent. Focused finance and event-analytics tests: 89 passed; partner-dashboard typecheck and `git diff --check` passed. The normal Vitest fork pool is used with one worker after a multi-worker startup saturation; VM threads were rejected because they bypassed the payout-action module mock and reached the real client.

- Packet 8 completion: every canonical `/partner/[studio]` route was audited. Connected tenant-scoped routes are venue/host overview, events and event detail, event creation, calendar/availability, relationships, slot requests, support, organization selection, finance, organization analytics, the organization guest index, and event-scoped sales, attendee, and promoter views. Promoter assigned/public Events is connected, but promoter metrics are withheld because no promoter analytics read model exists. Marketing, notifications, referral links, leaderboards, settings, and disconnected shell search/notification feeds explicitly disclose their unavailable status; Door/Presence is deferred to M4. The old `/venue`, `/host`, and `/promoter` trees redirect to `/partner/...`, and unmatched deep legacy links render an unavailable state rather than their stale screens. No direct fixture data source remains under `app/partner`. Support read failures show an error/retry state rather than an empty desk. Focused shell/support/editor/event-detail tests and partner-dashboard typecheck passed.

- Packet 8 promoter slice: promoter Events now reads assigned events (including frozen assignment terms) and the public event feed from existing APIs. Unsupported click/sales totals are labeled unavailable, public events do not offer a nonfunctional promotion-access action, and only the first public page is disclosed when results continue. Promoter overview/analytics and venue/host settings no longer display fixture metrics/profile values; they explicitly report that their authoritative read/write model is not connected. Focused promoter/partner event plus overview tests: 44 passed; partner-dashboard typecheck passed. Backend event-catalog and public-discovery tests: 44 passed.

- Packet 8 continuation: overview partnership/promoter connections are now loaded from the existing tenant-scoped APIs and relationship status labels are preserved. Its empty financial-activity area now says that the feed is not connected, while a genuinely empty relationship result says there are no relationships. Focused overview loader/view-model/UI tests: 40 passed; partner-dashboard typecheck passed.

- Packet 6 persists cancellation context on orders, processes affected orders in deterministic pages, releases holds, preserves admin-approved refund controls, freezes or voids admissions according to financial state, writes per-order admin audit evidence, and denies cancelled-event admissions/door sales. Focused cancellation tests: 5 passing; core and gateway typechecks pass.
- Packet 7: paid/RSVP receipts, settled-refund, cancellation/material-change, support-required-payment, and payout-status notices use authoritative outbox triggers and stable provider idempotency keys. Firestore delivery evidence stores only recipient hashes; transient retries and permanent provider rejection are distinguished; an admin-only evidence endpoint omits recipients. Templates escape dynamic values and automated tests stub the provider. Focused backend tests: 58 passed; core and gateway typechecks passed.
- Packet 8: venue/host overview uses the tenant-scoped overview loader; focused loader/view-model tests pass. Venue/host event lists read the tenant-scoped organization event endpoint with cursor pagination, honest nullable capacity/sales values, and an explicit lower-bound marker when the bounded order scan is incomplete. Event detail uses the authenticated event endpoint and includes the same bounded operations summary; fixture-backed edit actions are hidden for API records. Event-scoped sales, guests, and promoters now read the authenticated finance, door, and referral projections; organization analytics and the organization guest index use the same tenant-scoped APIs. Calendar/availability use tenant-scoped API repositories and real block writes; partner relationship flows use APIs; unsupported marketing, promoter analytics, and profile/menu settings explicitly report unavailable rather than showing fixture values. Promoter Events reads assigned events and public discovery from existing APIs, with assignment terms shown and unsupported click/sales figures withheld. Focused partner-dashboard and backend event-route tests pass.
