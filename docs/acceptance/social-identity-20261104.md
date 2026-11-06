# Pass 5 — Event social identity: local acceptance

Starting FEbe959d8 / BEc12baea, clean before this pass. Passes1–4 preserved. No push/PR/merge/deploy/email pass. Boundary map: social-boundaries-20261104.json. Existing inherited Guest-login2 and Pass3 test-only10 overlaps remain; no new operational source edits except the explicitly approved Guest support projection fix.

## Founder decisions — all eight confirmed

1. Opt-in identities, existing/new Guests private by default; viewers must be verified/onboarded Guests. Anonymous event discovery stays open; Partners/Admin do not gain Guest social access.
2. Strict social DTO: safe canonical user ID for linking, display name, existing account avatar/initials, curated interests only. No email/phone/DOB/city/joining reasons/payment/order/ticket/security/KYC data.
3. Social guestlist requires organizer opt-in AND Guest opt-in, both defaultoff; profile-private hides identity. Deduplicate authoritative holders; paid/FreeRSVP same; social counts include only visible people.
4. Optional upcoming public-event attendance only, defaultoff, with per-event hide; private profile hides all. Derive from canonical holder helper and event state; no past events, cancelled/void/refunded/frozen rights or purchaser/quantity inference. Transfer changes visibility on accepted custody change only.
5. Existing canonical avatar/initials; no upload pipeline.
6. Reciprocal social hide when either Guest blocks; no custody/admission changes. Report Guest to existing private Admin support desk, bounded reason/category, no auto-ban or target notification.
7. Event-context profiles only; defer Guest search/handles/follow graph/DM/feed. Existing Host/Venue follows untouched.
8. Explicit authorization to edit M3-owned apps/api-gateway/src/routes/v2/support/intake-routes.ts ONLY for Admin-note/timeline redaction and private/no-store with focused tests. Storage/Admin review/refund business behavior unchanged.

## Source map / implementation boundaries

Existing repository read ports listByEvent/listByHolder and currentEntitlementHolderId suffice. Explicit null currentHolderUserId is unclaimed, not purchaser attendance. Candidate listByHolder uses null-coalescing and can include unclaimed records, so the social reader must reapply canonical holder filtering; do not edit M3 repository. Existing M3 implementation already uses canonical filtering. Multiple units/couple admissions never fabricate people.

No existing event-social flag, Guest privacy/block/report repository or safe social DTO. Separate social-only records hold consent/event organizer policy/individual hides/blocks; operational Event/Entitlement models remain untouched. New contracts/core subpath exports avoid M3-owned barrels. Guest event page is currently nonoverlapping; social UI can compose there without modifying M3 EventDetailView/ticket components. New Partner social-policy page can manage only social enablement using existing event ownership/membership rules.

Existing SupportService/SupportTicket/Admin desk is the reporting destination. A focused regression reproduced Admin note content and internal_note timeline entries leaking to the requester through Guest support intake. Narrow projection/cache fix implemented under explicit authorization; Admin data stays stored and Admin response unchanged.

## Delivered behavior

- Strict social contracts and server projection; no reuse of own/private DTO. Every social identity read requires a canonical verified/onboarded Guest and applies privacy/reciprocal blocks. Private, blocked and missing target profiles return the same unavailable response. Generic private page metadata contains no target identity.
- Event Detail composes a social entry without touching M3 EventDetailView, ticket selector or checkout. Anonymous policy metadata contains only `enabled`; anonymous discovery never fetches attendee identities or counts. Protected guestlist/profile destinations use existing trusted login/verification/onboarding return boundaries.
- Guestlists require public eligible event + organizer policy + personal profile/list consent + no individual hide/block. Counts represent visible canonical holders, independent of admission units or payment type. Explicit unclaimed null never falls back to purchaser.
- Upcoming social attendance uses current claimed holders, public event state and live event dates. Cancelled/ended/private/past events, void/refund-locked/frozen rights are excluded. Pending normal transfers retain the sender; acceptance moves visibility to the new holder. Existing ticket/transfer commands and event models are unchanged.
- Three persisted privacy controls, individual event hide/unhide, reciprocal block/unblock, bounded idempotent reports to existing support storage. Organizer owner/admin/manager membership and event ownership checked server-side. Partner control changes only social consent records.
- Support intake redacts Admin notes, restricts timeline to public lifecycle/reply types and removes private detail/actor IDs. Guest support and all social/BFF responses use private/no-store. Admin storage and Admin projection unchanged.

Server-only Firestore collections: `v2_guest_social_privacy`, `v2_event_social_policy`, `v2_guest_social_hidden_events`, `v2_guest_social_blocks`. Existing deny-all client rules cover them. Pair documents use hashed canonical IDs; no new composite index required. Gateway composes existing repository/config read interfaces; it does not change the M3 service factory, repository ports or route manifest.

## Settings cleanup — requested during acceptance

UI-only change: removed unsupported Instagram/X section and settings profile hero; tightened flat navigation, content width and hierarchy; grouped the same three controls; retained one short privacy note; reused the Guest orange action class; clean name/Unblock row and minimal empty state. Report remains on other-Guest profiles. Hidden-event recovery remains available. No policy, API, persistence, block/report or ticket behavior changed.

Visual review: 1440×1000 desktop, 1024×900 laptop, 390×844 phone. Checkbox/label alignment, touch targets, orange action, blocked row and absence of dead UI checked in actual screenshots. Phone document scrollWidth/clientWidth both390. Screenshots in `screenshots/social-20261104/`.

## Security and browser evidence

Disposable loopback Firestore project with native Better Auth Guest A, Guest B and Partner owner. Verified/onboarded profiles and already-approved organization were repository fixtures; no production data, SMS or outbound email. Background workers disabled. Browser personas logged in through actual UI; HTTP integration uses real native tokens.

Observed browser journeys:

1. Anonymous Explore → public Event Detail; social entry contains no identities/counts. Social click reaches login carrying the original guestlist destination. Authenticated Guest reaches that guestlist using the existing account guard.
2. Event → guestlist → Guest B: safe identity/interests and shared upcoming public event. Rendered upcoming-event href points to the existing public Event Detail route.
3. Guest A block → privacy list; fresh B profile becomes unavailable; Unblock restores list visibility. Cleaned Unblock action and minimal empty state verified after UI cleanup.
4. Per-event hide removes A's row and changes visible count2→1; Unhide restores it. No operational mutation in API/service assertions.
5. Guest B changes profile visibility off in UI; A signs in and fresh B profile is unavailable. Disposable fixture consent later restored only to inspect a named blocked row and final social profile.
6. Report Guest submitted from B profile; actual success receipt. Integration verifies real support record, idempotent replay, no automatic ban; Admin moderation remains private.
7. Native Partner owner reaches Host social-policy page, disables organizer consent; button changes to Enable, and public Event Detail still renders with no social entry. Guest cannot change that policy in native authorization tests.
8. Native API transfer request then recipient acceptance through unchanged M3 command. Before acceptance sender attendance remains; after acceptance sender loses event/row and new holder gains them. This is API/Emulator evidence, not a browser Wallet transfer claim.

No captured warning/error console entries in affected Guest/Partner browser tabs at final review. Synthetic event metadata intentionally sparse; no claim of production content/design acceptance for M3 Event Detail.

## Verification

One comprehensive affected sweep before the later UI cleanup:

- Gateway:22 tests /5 files passed, including `guest-social.integration.test.ts`, `profile.test.ts`, `profile-privacy.integration.test.ts`, support privacy regression and Admin support tests. Native auth + loopback Firestore enabled.
- Core:38 tests /3 files passed under `src/application/guest-social` and `src/application/guest-profile`. Includes private default, ineligible audience, safe fields, both opt-ins, paid/RSVP parity, holder deduplication, null-holder, accepted transfer, hiding, blocking, refund/frozen/void/cancelled/private/past events, postponement and report storage.
- Guest:43 tests /7 files passed across profile, profile BFF, social BFF and existing onboarding guard. Partner frame:3 tests passed. Node emitted a localstorage-file-path warning in that Partner test run; tests passed.
- After UI cleanup only affected Profile/Settings tests rerun:17 tests /3 files passed (`app/profile/page.test.tsx`, `PersonalProfileFormClient.test.tsx`, `SocialPrivacyPanel.test.tsx`). Same three save values, disabled dependent controls and actual Unblock retained.
- Core/contracts/gateway typechecks passed. Guest full typecheck and Partner typecheck passed; Guest full typecheck repeated after UI cleanup. Targeted ESLint and Prettier checks passed; backend commit hooks also linted all changed TS with zero warnings.
- Architecture boundaries passed BE and FE (19 FE workspaces). Firestore index check:63 existing composite-query checks covered. Contract parity247 checks passed; exported29 contract source files, only new guest-social source changed. Diff whitespace checks passed.

Representative commands: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8089 pnpm --filter api-gateway exec vitest run src/routes/v2/guest-social.integration.test.ts src/routes/v2/profile.test.ts src/routes/v2/profile-privacy.integration.test.ts src/routes/v2/support/social-report-privacy.test.ts src/routes/v2/admin/support`; `pnpm --filter @c1rcle/core exec vitest run src/application/guest-social src/application/guest-profile`; Guest/Partner Vitest commands limited to the affected paths above. No unrelated finance/Razorpay/Scanner/broad KYC sweep.

## Candidate and integration

Local code commits: BE `9068c4b` support privacy, BE `a7ae1fc` social contracts/service/Firestore/native integration; FE `94d19c5` connected social UI/BFF and settings cleanup. Evidence commit follows this record. No push, PR, merge, deployment or email/Resend pass.

Final boundary snapshot: `social-boundaries-final-20261104.json`. No new FE M3/M4 overlap. The only new BE operational overlap with both milestone lineages is explicitly authorized `apps/api-gateway/src/routes/v2/support/intake-routes.ts`. Integrate that narrow projection/cache patch deliberately; Admin/refund/ticket implementations unchanged. Existing2 Guest-login FE overlaps and10 BE test-fixture overlaps are inherited from earlier accepted passes, not edited in this pass.

Inherited BE test-only overlap paths (not changed here):

- apps/api-gateway/src/routes/v2/admin/refunds.test.ts
- apps/api-gateway/src/routes/v2/checkout/checkout-routes.test.ts
- apps/api-gateway/src/routes/v2/checkout/payment-routes.test.ts
- apps/api-gateway/src/routes/v2/checkout/webhook-routes.test.ts
- apps/api-gateway/src/routes/v2/finance/finance-routes.test.ts
- apps/api-gateway/src/routes/v2/orders/orders-routes.test.ts
- apps/api-gateway/src/routes/v2/partner/event-catalog.test.ts
- apps/api-gateway/src/routes/v2/rsvp/rsvp-routes.test.ts
- apps/api-gateway/src/routes/v2/tickets/ticket-routes.test.ts
- apps/api-gateway/src/routes/v2/wallet/wallet-routes.test.ts

## Remaining connected evidence and limits

Local acceptance is not production launch approval. Hosted native sessions, deployed Firestore rules, real organizer/Guest multi-account privacy withdrawal and support-desk operational review still need connected-environment acceptance after authorized integration/deployment. Existing Google avatar URLs render; avatar upload, Guest search, handles, follows/DM/feed and past attendance are explicitly deferred. Saved-event persistence remains the existing M3 dependency and was not implemented.

The live projection fails unavailable beyond20 repository pages/2000 admission rows instead of publishing partial counts; large-event scale/performance acceptance remains to be established. Offset pagination is for social visible rows, not ticket identifiers; privacy changes are re-evaluated on each server read. Previously displayed browser content cannot be retroactively erased from a viewer's screen.

Transfer feature/drain flags were enabled only inside the disposable integration fixture; no deployment configuration or actual offline-manifest attestation changed. Temporary browser helpers/credentials are excluded from commits. Task-owned acceptance servers and demo records are cleaned after review; shared Emulator process is retained.
