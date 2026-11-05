# Saved Events — integration pending M3 authorization

Starting lineage: FE4270b4c, BEa7ae1fc, branch codex/product-completeness-20261104. Both clean at start. Previous passes preserved. No push/PR/merge/deploy.

## Pending boundary decision

The user brief §2 says: “If the current Save button is inside an M3-owned component and a source edit is genuinely necessary, stop and request narrow authorization before modifying operational M3 source.”

The inert Save button is in `apps/guest-portal/src/features/event-detail/components/EventDetailView.tsx`, with no extension hook. It is also hidden on desktop. An asynchronous authorization question is pending: add an optional composed Save slot and make the existing action row visible on desktop as well as phone. All bookmark logic stays outside this component; ticket, checkout, share behavior and lifecycle logic remain unchanged.

`saved-events-m3-proposed.patch` contains the exact proposed edit, **not applied**. After authorization: apply the slot patch, compose `SaveEventControl` from the existing Event page, verify the narrow diff, then complete Event→Save→refresh→Saved list→Unsave, B independence, anonymous Save/auth/trusted return and representative phone Save journeys. Do not claim this pass accepted until those checks pass.

## Implemented independent work

- Unique private relationship: `v2_guest_saved_events/{canonicalGuestId}/events/{canonicalEventId}`, first-save ISO timestamp only. No copied Event, profile, attendance or purchaser data.
- Transactional create-if-missing Save; idempotent delete Unsave. Native session-scoped GET state/list and PUT state. Closed input DTOs reject client ownership fields. No caller-supplied Guest ID accepted.
- Verified/onboarded canonical Guest eligibility, with ban checks. Anonymous and Partner reads denied. Private/no-store gateway and BFF responses; same-origin and CSRF write checks. Existing auth/verification/onboarding continuation helper used by the reusable control; no redirect merely because an incomplete Guest browses a public event.
- Private `/profile/saved` destination and simple Profile link. Minimal event rows, existing public Event Detail links, Unsave and small empty state. API pagination20 rows by document ID, no composite index. New server-rendered view is keyed by canonical session identity; button state also keyed by identity and event.
- Canonical public-event service supplies current event title/date/status/media. It enforces existing public/unlisted visibility; no private-code authorization is invented. Current cancelled/private/unpublished policy returns unavailable, so the relationship remains removable with no stale copied details. No parallel postponement/TBA model or event-lifecycle changes.
- Save/Unsave control waits for authoritative responses and preserves its prior confirmed state on failure. Status-load failures permit retry. A setup/verification denial resumes the existing trusted event return only after an action. This control is built/tested but **not yet wired into Event Detail**.
- Saving does not write tickets, orders, inventory, social privacy, guestlists or attendance. No public saved counts, recommendations, reminders, collections, sharing or analytics.

New contracts/core feature subpath exports avoid shared M3 barrels. Gateway registration is in the product-completeness-owned profile route; existing operational service factory/route manifest/event repositories unchanged.

## Focused evidence so far

- Core Saved Event tests:3 passed (idempotency, Guest isolation/eligibility, private cursor paging, no entitlement creation).
- Native auth + loopback Firestore integration:1 passed with real A/B/Partner identities. Eight concurrent same-key Saves create one record and preserve its timestamp. Fresh adapter reads persist state. Repeated Unsave succeeds. A/B isolation, forged x-user-id/body/query ownership, anonymous/Partner denial, current title/date changes, inaccessible/cancelled/private event redaction, no order/ticket/social records and actual Firestore two-page cursor reads proved.
- Guest Saved component/BFF tests:9 passed. Save/Unsave failure retention, identity/event switching, anonymous trusted return helper, no forced public-browse redirect on incomplete setup, strict response validation, CSRF/origin/ownership rejection, list removal and unavailable-event presentation.
- Affected core/gateway/Guest typechecks passed. Targeted ESLint clean. Architecture boundaries passed BE and FE. Firestore checker63 existing composite queries covered; new subcollection query needs no composite index. Contract parity247 checks passed;30 source files exported, only new saved-events contract added. Format/diff checks apply to changed files only.

These are focused checks of the implemented portion, not a final accepted Event Detail integration sweep. No broad social, finance/Razorpay, Scanner, KYC or full-product test run.

## Browser evidence so far

Disposable project demo-c1rcle-saved-a4505ecb on loopback Firestore, native accounts, capture-only email and disabled workers. One bookmark seeded through the real authenticated API solely to inspect the independent Saved view; this is **not** a browser Save-button claim.

Anonymous private-list visit→existing login carrying `/profile/saved`→native Guest A sign-in→actual saved event row. Desktop and390×844 phone screenshots inspected; phone scrollWidth/clientWidth both390. Real Unsave→small empty state→full refresh→still empty. Screenshots are in `screenshots/saved-events-20261104/`. Session signed out, temporary tabs closed, viewport reset, task-owned acceptance servers stopped and disposable records cleaned. Shared Emulator retained.

## Overlap / remaining work

Initial map: `saved-events-boundaries-20261104.json`; `saved-events-boundaries-pending-20261104.json` records currently modified paths. No M3/M4 operational source edited. The proposed EventDetailView slot is the only pending M3 interface need. No M3/M4 ticket/event/payment/refund logic or prior overlap fixtures changed.

Next action requires the pending explicit authorization. After wiring and local browser acceptance, finish the small affected Saved sweep and local integration/evidence commit. Hosted multi-session persistence, deployed rules and actual hosted authentication/continuation remain later connected evidence; no hosted/release claim is made here.

Local independent code commits: BE `cc8b943`, FE `2f3919d`. Both source worktrees clean after those commits. No M3 slot patch applied; integration/acceptance remains pending authorization.
