# Saved Events — local acceptance complete

Starting lineage FE4270b4c / BEa7ae1fc on codex/product-completeness-20261104. Previous passes preserved. No push, PR, merge or deployment.

## Save / Unsave

Event Detail now composes the real Save control. Writes wait for confirmed responses; failures retain the prior confirmed state and offer retry. Save and Unsave persist across refresh. State is keyed by canonical Guest and Event, including during account/event navigation.

Unique server-only relationship: `v2_guest_saved_events/{guestId}/events/{eventId}`, first-save ISO timestamp only. Transactional create-if-missing and idempotent delete prevent duplicates. Private listing pages20 document IDs at a time, with no new composite index. No copied Event, profile, ticket, order or social data.

## Saved Events view

Profile → Saved events opens the private `/profile/saved` page. It uses simple event rows, existing Event Detail links, Unsave, pagination and a small empty state. Current event data comes from the existing canonical public-event service. Date/title changes appear on new reads. Inaccessible/private/cancelled/unpublished events retain a removable anonymous “Event unavailable” bookmark instead of stale copied details; existing event lifecycle/visibility rules are unchanged. No new postponement/TBA model is invented.

## Privacy / Authorization

Canonical verified/onboarded Guest and ban checks on every state/list/write request. No client-supplied owner ID. Closed DTOs reject ownership fields. Anonymous/Partner requests denied. Gateway/BFF responses private/no-store; writes require same origin and CSRF. Saved events never appear in social profiles, social guestlists, attendance, Wallet or operational Guest data. No public counts or organizer analytics.

Saving writes only bookmark records. Native tests and repository assertions show no orders, tickets, inventory, social-consent or attendance effects.

### Trusted return correction

Browser acceptance exposed a nested `/auth/continue` return when anonymous Save first visited a continuation route. Source tracing also showed that a public Event destination intentionally skips onboarding checks. The Save boundary now sends anonymous callers directly to existing login with a protected `/profile/saved/return` destination. Authenticated Guests who need setup use the existing continuation with that protected destination.

The protected return waits for authenticated session hydration and the existing OnboardingGuard before its client handoff. Existing verification/onboarding pages and auth guards are unchanged. It then returns to a validated Event-only local path, preserving the original query. External URLs, protocol-relative URLs, unrelated paths, encoded path tricks and repeated/non-text destination parameters fail closed. No automatic save after login: the Guest returns and can Save normally. Public browsing stays open; no setup redirect happens merely from viewing an event.

## Browser acceptance

Disposable empty-bookmark project `demo-c1rcle-saved-49f45e89`, loopback Firestore, native Better Auth A/B/Partner accounts, synthetic approved organizer/event, no outbound email/SMS and disabled workers. No bookmark seeded in this final run.

- Anonymous public Event → Save → existing login → original `/event/synthetic-saved-night?source=saved-final`, query retained.
- Guest A → Save → Saved → full refresh → still Saved → Profile → Saved events → actual event row → Unsave → full refresh → small empty state. Event Detail subsequently shows Save again.
- A saves again, then signs out. Native Guest B login shows B’s own profile; B’s Saved list is empty and the same event is unsaved.
- At390×844, B saves, refreshes to Saved, unsaves, refreshes to Save, and repeats the visible control interaction. Final native-auth reads after B’s Unsave: A `{saved:true}`, B `{saved:false}`.
- Desktop1280×900 and phone screenshots inspected. Phone document scrollWidth/clientWidth both390. No captured console warnings/errors in the final affected tab.

The existing mobile action row was behind the sticky poster/content overlap. Within the approved action-row visibility edit, only Save/Share moved into the event header so the same single control is visible on desktop and phone. No poster, ticket-selector, checkout or lifecycle logic changed. Other legacy poster-column content remains M3-owned and outside this pass.

Screenshots: `screenshots/saved-events-20261104/event-desktop.png`, `event-phone.png`, `view-desktop.png`, `guest-b-empty.png`. Earlier view/empty phone screenshots are layout evidence from the initial independent-view checkpoint, which used an API-seeded bookmark; they are not the final Save-button proof.

## Verification

Final affected checks:

- Frontend:37 tests /7 files passed: Saved control/list/BFF, trusted-return validation, existing guard gating for complete/incomplete/unverified Guests, existing Event page and existing auth continuation tests. Failure retention, identity/event switching and private response validation covered.
- Backend: native-auth + loopback Firestore Saved integration1 test passed; core Saved tests3 passed. Eight concurrent Saves produce one record and retain timestamp. Fresh adapter reads persist state; repeated Unsave succeeds. A/B/Partner/anonymous/forged-owner checks, canonical date/title/private-state handling, no attendance side effects and actual Firestore two-page cursor reads covered.
- Core, gateway and Guest full typechecks passed. Targeted ESLint/Prettier clean. Architecture boundaries passed BE and FE (19 FE workspaces). Firestore checker63 existing composite queries covered; new query needs no composite index. Contract parity247 checks passed,30 source files mirrored, only the new Saved contract added. Diff checks passed.
- Existing Event-page DOM fixtures gained only a router mock and an async server-only social-composition mock; event/ticket/lifecycle assertions unchanged. Real RSC composition exercised in browser.

No unrelated Scanner, finance/Razorpay, KYC, broad social or full-product suites. Failed intermediate auth-return/test-fixture checks were corrected before the final affected run.

## Candidate / Overlap

User explicitly authorized the narrow Save slot and desktop/phone action-row visibility edit in `apps/guest-portal/src/features/event-detail/components/EventDetailView.tsx`. This is the only new operational M3/M4 overlap. It adds an optional composed Save node and relocates only the existing Save/Share row to avoid the mobile overlap. Share behavior, ticket/checkout handlers and event lifecycle code unchanged.

Local source commits: BE `cc8b943` private persistence/API; FE `2f3919d` private list/control, `1770d76` approved composition and protected return, `c7e475f` hydration-race guard. Final evidence commit follows this report. Initial/pending boundary snapshots and the original proposed patch are retained as historical authorization artifacts; use the actual commits for integration, not the superseded proposed patch. Final map: `saved-events-boundaries-final-20261104.json`.

Disposable native sessions signed out, temporary browser tab closed, viewport reset, task-owned acceptance servers stopped, demo collections and A’s nested bookmarks verified empty. Shared Emulator retained. Temporary helper/credentials excluded from commits; generated Next files restored.

## Remaining hosted evidence

Local acceptance is not release approval. Hosted native sessions, secure-cookie/multi-device persistence, deployed client-deny Firestore rules, and provider-backed verification/phone/Google continuation still require connected-environment acceptance. Existing providers/flows were reused and not re-audited here. Recommendations, reminders/emails, collections, sharing, friends’ saves, public counts and organizer analytics remain outside scope.
