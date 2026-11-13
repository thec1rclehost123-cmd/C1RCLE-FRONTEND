# Local Product Acceptance — 2026-11-13

Status: **NOT READY — manual acceptance is incomplete.** This ledger records connected localhost observations from the current all-role pass. It does not claim deployed acceptance.

## Environment and safety

- Partner Dashboard: `/private/tmp/c1rcle-hosted-acceptance-navfix`, branch `codex/host-nav-fixes-20261111`, starting HEAD `4d05dfe9ee425a951ccc84ab9266aa6cbe543ead`.
- Partner app is served at `http://localhost:3001`; local API Gateway at `127.0.0.1:8080` responded to health and public-discovery reads using the existing non-production `c1rcle-v2` connection.
- Authenticated Host Studio identity: Test Host. Venue, Promoter, event, and ticket data were read from the connected environment. No existing booking was accepted/cancelled, no event was submitted, no payment was made, and no support ticket was created.
- The Host Create Event page restores a saved `LOCAL QA HOST 001` draft. Its title matches a separately visible LIVE event. The draft’s Venue/date preview is present but its time inputs are blank and Continue rejects it because no available Venue time is selected. It was left unchanged to avoid overwriting a saved draft or touching the live event.
- User declined creating an event-scoped scanner code for `LOCAL QA HOST 001`; no code or scanner shift was created.

## Guest observations

| Surface | Result | Status |
| --- | --- | --- |
| Guest Portal source/runtime | Started `apps/guest-portal` from the current staging-based checkout (`4d05dfe`) with process-level API origin `http://127.0.0.1:8080`; no `.env.local` was created. Home and Explore rendered staging events through the local Gateway. | PASS for public reads. |
| Existing Guest account sign-in | The supplied synthetic account signed in through Email + Password and returned to Explore. The account's Profile route redirected to incomplete onboarding, with a prefilled account identity; no profile data was changed. | PARTIAL; session/login works, but the intended completed profile state is not available for checkout return verification. |
| Ticket purchase login gate | In a separate unauthenticated browser context, Get Tickets opened ticket selection; Review Order opened a sign-in dialog with Google and Email actions and said the selection would be saved. No purchase was made. | PASS for mandatory login prompt; return-to-checkout remains unverified. |
| Checkout price review | Authenticated test session reached review and displayed the synthetic event's non-production fees and refund terms. The flow stopped before the Pay action. | PASS for review rendering; payment intentionally not attempted. |
| Explore featured display | Explore showed 14 results and its featured event description. The hero exposed only Get Tickets, with no Guestlist placeholder. | FAIL against the approved Guest discovery requirements. |
| Guest signup and phone verification | No new account was created and no profile was changed. The account is routed to onboarding; completing it requires identity/phone steps. | NOT TESTED; stop before identity edits or phone OTP. |
| Weekend/date filtering and RSVP | Not exercised in this pass. | NOT TESTED. |

## Venue observations

| Surface | Result | Status |
| --- | --- | --- |
| Venue sign-in and overview | Supplied synthetic Venue account signed in through the normal Venue workspace flow. Overview, metrics, recent orders, calendar preview, and network card loaded. | PASS for read surfaces. |
| Venue partners | Host and Promoter partner tabs loaded connected Test Host and Test Promoter records. | PASS for reads; discover/request/action flows remain unverified. |
| Venue Events ownership filter | The Venue Events list showed 0 events for All, Hosts, and Venue. The same account's accepted requests list showed two approved bookings, including the live synthetic `LOCAL QA HOST 001`; the Venue calendar marks Nov 14 and Nov 27 confirmed. | FAIL / architecture mismatch: host-owned events are not returned by the organization-owned events API, so the Venue Hosts filter cannot show them. No code changed yet. |
| Venue slot requests | Request counts resolved after about 10 seconds: Pending 0, Approved 2, Rejected 0, Cancelled 0. Existing approved `halloween 6` and `LOCAL QA HOST 001` review details loaded. | PASS for reads; no accept/cancel action attempted because these are existing shared records. |
| Venue calendar | November calendar loaded after about 8 seconds and showed Nov 14 and Nov 27 as confirmed. Selecting Nov 14 showed Reserved without a linked event card. | PARTIAL; month/date read works, linked-event detail not surfaced in the selected-day panel. |
| Venue booking cancellation | UI action and backend route were source-traced; the screenshot's earlier network error cannot be reproduced safely against an existing approved booking. Current Gateway is responding. | NOT VERIFIED; no existing booking was cancelled. |

## Confirmed Host fixes

| Finding | Implementation/local evidence | Hosted localhost result |
| --- | --- | --- |
| HOST-001 Presence route | Presence page now redirects Host to the Host guest/event index. Focused regression covers Host versus Venue behavior. | **PASS for navigation:** Host Presence opened the guest index, not Settings. Event guest page showed the correct zero-record empty state. Populated attendee, filtering, and privacy masking remain unverified. |
| HOST-002 partnership notification click | Notification link targets the Host Partners requests view; focused regression passes. | **PARTIAL:** clicking the Test Venue invitation navigated to `?view=requests`. The page said “No requests found,” while the notification still claimed an invitation. No request action was taken; this may be stale notification data or an incoming-request listing defect. |
| HOST-003 draft-aware empty copy | Overview view-model regression covers existing drafts. | **PARTIAL:** Overview showed the live synthetic event; the Events screen showed `halloween 6` as Draft and did not expose it as a live event. A drafts-only overview state was not available to verify the replacement copy manually. |
| HOST-004 date change clears stale time | Focused event-editor regression passes. | **NOT VERIFIED:** no date/time edits were made because the only restored draft is incomplete and matches the title of an existing live synthetic event. |
| HOST-006/007 invalid negative price/capacity | Focused ticketing tests cover these validations. | **NOT VERIFIED manually:** no values were changed in the restored draft. |
| HOST-008 Couple-ticket explanation | Focused regression passes. | **NOT VERIFIED manually:** Create Event could not proceed without selecting a valid available time. |
| HOST-009 promo end-date persistence | Focused regression passes. | **NOT VERIFIED manually:** promo form was not reached. |
| Settings in account menu | Primary navigation now omits Settings in side and top navigation layouts; account menu keeps Settings and Sign out. PartnerShell tests cover all three roles/layouts. | **PASS for Host shell:** after refresh, Settings was absent from the sidebar and present with Sign out in the profile menu. Settings profile fields rendered read-only for this Host. |

## Host surface observations

| Surface | Result | Status |
| --- | --- | --- |
| Overview and Events | Host dashboard loads. Overview shows `LOCAL QA HOST 001` as next event; Events shows 2 records, 1 Live and `halloween 6` Draft. | PASS for reads; exhaustive filters and card controls remain open. |
| Calendar / venue availability | Test Venue (Pune) loaded. November availability rendered open days and a selected Nov 16 date with an available time window. | PASS for read; month navigation and all small controls remain open. |
| Partners | Test Venue and Test Promoter appear as partnered. Test Promoter profile says “Event assignment: Unavailable.” | PARTIAL; searches, Discover, requests, profiles, and duplicate prevention not exhausted. |
| Event Promoters | `LOCAL QA HOST 001` shows no eligible Promoters and says an active connection plus current agreement evidence are required. | FAIL for assignment availability. Local Gateway process lacks `PROMOTER_AGREEMENT_ARTIFACT` and `DEPLOYMENT_ENVIRONMENT`; exact Test Promoter agreement record state was not independently read in this pass. No eligibility was bypassed. |
| Slot Requests | Pending 0, Approved 2, Rejected 0, Cancelled 0. All Requests showed the approved synthetic event and `halloween 6` requests. | PASS for read; no request mutation. Incoming Venue invitation did not appear in Partners → Requests. |
| Event workspace | Sales summary shows 0/70 tickets, tiers General 50 and VIP 20, gross/refunds ₹0. Header capacity says “Not set.” | PARTIAL / needs product reconciliation: ticket inventory totals 70 while the separate event capacity field is unset. No paid synthetic fixture exists. |
| Event Edit | Prefilled title, tier inventory/prices/order limits, refund policy, entry facts, visibility/address disclosure, summary and description. Venue schedule changes are constrained to approved slots. | PARTIAL. The editor is a reduced form, not the Create Event flow. It does not expose poster/media, Promoter assignments/commission, tier add/remove/rename, pricing phases, promo codes, or sales windows. No Save was submitted. |
| Door Mode | UI explains codes grant event-only ticket scanning and walk-in access and expire at the event end. Existing code list returns “Organizer access is required to view scanner codes.” | BLOCKED / FAIL. A prior Create attempt returned HTTP 404 from local `/api/bff/door`. This user declined code creation now; no code was revealed and no shift was started. |
| Revenue / Finance | Event revenue shows zero gross, refunds, tickets. Finance reports no payout account, ₹0 balances, settlement eligibility unavailable, payout requests disabled. | BLOCKED for reconciliation: no safe paid order/refund/commission fixture exists; do not claim finance complete. |
| Support | One existing synthetic ticket `LOCAL QA — form validation check` loads and opens read-only. Raise Ticket form exposes department, category, priority, subject and details. | PARTIAL. No attachment control is present in the form. No duplicate ticket was submitted. |
| Notifications | Inbox showed one unread event-live item and an invitation notification. The invitation destination opened Requests. | PARTIAL; no notifications were marked read, and stale-notification action was not exercised. |

## Verification

- Focused regressions: 8 test files passed, 109 tests passed.
- Partner Dashboard typecheck passed.
- Targeted ESLint passed for the changed Host and shared shell files.
- Prettier formatting check and `git diff --check` passed on the previous Host pass.
- No PR was opened, no deployment occurred, and no shared staging record was intentionally changed.

## Remaining critical work

- Finish Create Event manual coverage without overwriting the restored Host draft; obtain a distinct blank synthetic draft before touching poster upload or submitting a request.
- Complete safe poster upload lifecycle checks; the current Create Event draft is not safe to use because it matches the visible live synthetic event by title and lacks a selected available slot.
- Determine why Test Promoter is partnered but not event-assignable from the actual agreement record and local Gateway configuration; preserve canonical eligibility.
- Retest HOST-004/006/007/008/009 in a disposable synthetic draft, including pricing phases and Host-side commission validation.
- Resolve the Test Venue invitation versus empty Partner Requests discrepancy, then test safe synthetic partnership request lifecycle.
- Exercise remaining event tabs, Cover, small controls, stale multi-tab behavior, and support form error states.
- Diagnose the Door BFF 404 and organizer authorization without creating/revealing scanner credentials unless the user confirms at action time.
- Finance paid/refund/commission reconciliation remains blocked until a safe synthetic sale fixture/action is available.
- Finish the all-role pass: Promoter, Admin, and remaining Guest checkout/RSVP/session behavior. Promoter/Admin access or human-only legal/identity steps may be needed; do not bypass them.
- Resolve the Venue Hosts event-list contract with a Venue-scoped backend query; do not widen organization event access or mutate existing bookings.
- Retest Venue accept/cancel only against a new, clearly disposable synthetic request after data-safety boundaries are established.

**LOCAL PRODUCT ACCEPTANCE — NOT READY**

## Additional Host QA evidence — this pass

| Surface | Result | Status |
| --- | --- | --- |
| Host calendar | Reopened as Test Host. Test Venue · Pune loaded. Nov 6 selected as Unavailable with no open slots; Nov 13–30 showed available dates. UI labels the timeline IST. | PASS for read and availability display; date/month control edge cases remain untested. |
| Host request history | Pending 0, Approved 2, Rejected 0, Cancelled 0. All Requests listed approved `LOCAL QA HOST 001` (Nov 14) and `halloween 6` (Nov 27). No request was cancelled or otherwise changed. | PASS for history read; stale/double-action behavior untested. |
| Host partners and search | My Venues lists Test Venue · Pune; My Promoters lists Test Promoter. Global search returned `LOCAL QA HOST 001` and Test Venue results; a nonsense query returned “No matching events or partners.” Partner data takes roughly 10–15 seconds to settle on localhost. | PASS for these reads/search cases; Discover, request lifecycle, profile details and permissions remain untested. |
| Create Event restore | The saved draft restores to Venue step with Test Venue, Nov 14, and a `LOCAL QA HOST 001` artwork preview. Start/end time are blank, Continue is not reachable, and the local draft title duplicates the separately visible LIVE event. The saved draft was left untouched. | BLOCKED for Create Event mutations and poster upload; need an isolated disposable Host draft/organization or explicit direction to replace the saved draft. |
| Host event analytics | Recorded history loaded for Dec 2025–Nov 2026. Gross/net revenue, tickets, paid orders, RSVP, check-ins and promoter-attributed units all show 0; monthly table also shows 0. | PASS for display/read; financial reconciliation remains BLOCKED without a paid/refund fixture. |

- Source trace confirms Host draft storage is one resource at `/api/v2/organizations/{organizationId}/event-draft` with GET/PUT/DELETE. There is no separate draft ID or second-draft option in the current editor. The account menu exposes Settings and Sign out but no workspace switcher; the current Test Host session did not offer another Host organization. Therefore safe poster/Create Event mutation coverage needs a distinct disposable Host organization/account or explicit approval to replace this organization’s saved draft.
