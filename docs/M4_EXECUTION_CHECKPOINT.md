# M4 Execution Checkpoint

Updated: 2026-10-28 (Promoter referral-link pagination and development email-log redaction are verified; final bounded frontend/backend root checks and Partner desktop/mobile browser suite pass). M4 code remains uncommitted; connected Test Mode acceptance and other listed gates remain incomplete.

## Worktree identity

| Repo     | Path                                      | Remote                                                        | Branch                                   | Base SHA                                             | Current HEAD                               |
| -------- | ----------------------------------------- | ------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| Frontend | `/tmp/c1rcle-m4-20261028.OgdFgb/frontend` | `https://github.com/thec1rclehost123-cmd/C1RCLE-FRONTEND.git` | `codex/m4-promoter-distribution-control` | `8191d05f02ded56c760f6eb7f2ec44217b013718` (M3 base) | `8191d05f02ded56c760f6eb7f2ec44217b013718` |
| Backend  | `/tmp/c1rcle-m4-20261028.OgdFgb/backend`  | `https://github.com/thec1rclehost123-cmd/C1RCLE-BACKEND.git`  | `codex/m4-promoter-distribution-control` | `93cb16f07a7daaad15947483161c90f684302438` (M3 base) | `93cb16f07a7daaad15947483161c90f684302438` |

Original `/Users/aayushdivase/Desktop/thec1rcle` was not edited. No stage, commit, push, PR, merge, deployment, M4 business-record write, payment, or production operation occurred. The c1rcle-v2 role check used separate in-memory cookie jars and logged out after each identity check.

## Current packet and status

Current packets: 1–12 have local implementation coverage, with packet 12 now including a connected organization-scoped Partner inbox; applicant/Admin inbox delivery and product-policy-dependent work remain open. Promoter inbox notices cover fulfilled attributed sales, settled refunds, chargeback status/holds, payout state changes, assignment invitations/decisions/revocation/expiration, campaign activation/deactivation, onboarding approval, and bulk assignment suspension/reinstatement. Applicant onboarding submitted/approved/rejected events drive idempotent transactional status emails; suspension and expiry emails resolve to the stored Promoter organization owner. Assignment expiry uses a capped Firestore worker, persists the terminal state, and emits a deterministic outbox event. Focused tests use the in-memory sender, and the due-query passed against the Firestore emulator. Anonymous click, quote, hold, and RSVP responses now omit whether a referral code is valid/applied; the backend continues validating and persisting eligible attribution. Newly generated default vanity aliases use a 96-bit random suffix. Explicit aliases remain public and existing aliases are not rotated. Fresh click UUIDs can still inflate counters within the existing rate limit. Admin risk evidence currently covers active provider disputes; click-anomaly flags and thresholds remain undefined. Admin inbox delivery remains unsupported by the organization-only recipient model. Promoter commission remains an append-only payable allocation; a separate hold/release transition awaits approved accounting semantics.

Latest bounded backend root check, `TURBO_CONCURRENCY=1 corepack pnpm check`, exited 0 after Promoter referral-link pagination and development email-log redaction. Formatting, lint, typecheck, boundaries, nginx, security pins, 57 Firestore query shapes, Contracts/Core/API tests, and all three builds passed. Contracts: 20 passed; Core: 79 files passed, 853 passed / 30 skipped; API Gateway: 72 passed files, 918 passed tests / 2 skipped tests (1 skipped file). The API sender redaction tests passed 3/3 and Core logging sender test passed 1/1. Contract parity passed 239 checks. The separate Core Firestore Emulator run passed 88 files / 878 tests with 4 live-project tests skipped; API Auth Firestore integration passed 1/1. Emulator project `demo-c1rcle` shut down cleanly. The API referral-link route regression passed 13/13 tests.

The full-app M4 API scenario passes as part of `corepack pnpm --filter api-gateway test:scenarios` (5/5). In memory storage it exercises Promoter application with an explicitly non-legal test agreement fixture, Admin KYC approval, Promoter-initiated Host connection and Host approval, both RSVP-only zero-commission and paid assignments, free RSVP attribution, duplicate/invalid click acknowledgments, idempotent hold and payment-attempt retries, webhook replay, and scoped Promoter/Host/Admin attribution reads. It uses fabricated memory-driver actors and `MemoryPaymentProvider`; this is integration evidence only, not connected identity, legal acceptance, Firebase, or Razorpay Test Mode proof.

The final bounded frontend root check, `TURBO_CONCURRENCY=1 corepack pnpm check`, exited 0: formatting, lint (29/29 tasks), typecheck (29/29), boundaries, tests (23/23 tasks), and builds (17/17). Guest tests: 49 files / 276 passed; Partner: 160 files / 881 passed / 1 skipped; Admin: 12 files / 36 passed. Scanner Web, iOS, and Android bundles exported. An earlier concurrent run hit a 5-second timeout in one Admin Support test; that file passed 3/3 alone and the serial root check passed. Admin retains one existing `window.location.assign()` lint warning; Partner tests emit existing Node `--localstorage-file` warnings. The root Contracts test import uses frontend-only finance schemas from `packages/contracts/src/contracts/finance-admin.ts`; the generated backend-owned contract mirror contains 23 files and is synced after the referral-validity response removal.

After the root check, the Partner onboarding Playwright harness was tightened so direct API Gateway application writes fail closed while the real UI uses the same-origin BFF. Focused Chromium URL-contract tests passed 3/3; the complete desktop and Pixel 7 browser suite passed 26/26. These tests use mocked onboarding/provider responses and prove routing/rendered interaction only, not connected account, agreement, or payment acceptance. Playwright emitted the existing `next start` versus standalone-output warning.

The organization notification API already supported paginated list, single-read, and read-all operations, but the Partner shell and notifications page used unavailable/placeholder states. A same-origin CSRF-protected BFF now forwards those operations using the active organization, the response contract preserves the backend next-page cursor, and Partner Promoter/Host/Venue topbars and inbox pages render backend notifications with honest loading, error, empty, retry, read, and pagination states. Focused Partner tests passed 8/8; backend notification route tests passed 10/10; Partner lint/typecheck and 239 contract parity checks passed. Applicant and Admin inbox delivery remain unresolved because the backend notification recipient model is organization-only. The final frontend and backend root checks now pass after this change; see the final handoff for totals.

The source audit found the Promoter `/analytics` route still returned an unavailable state despite an existing backend campaign-summary endpoint. It now renders bounded backend totals for referral links, clicks, conversions, and gross attributed ticket value, with the 1,000-link and pre-refund limitations stated; no synthetic timeline is shown. The loader/component tests passed 4/4, Partner Dashboard `corepack pnpm typecheck` exited 0, and focused ESLint/Prettier passed. The final frontend root check rerun after this UI change exited 0: formatting, lint/typecheck (29/29 each), boundaries, tests (23/23 tasks), and builds (17/17 tasks) passed. Guest tests: 276 passed; Partner: 868 passed / 1 skipped; Admin: 36 passed. The full Partner Dashboard Chromium desktop and Pixel 7 mobile Playwright suite passed 26/26 after this UI change. The existing standalone-output warning remains; tests are mocked and do not constitute connected acceptance.

Connected c1rcle-v2 checks confirmed Promoter/Host/Venue role and organization access, but their onboarding lookup returned no request; the Promoter therefore lacks the approved onboarding record required for assignments. Agreement text/version is still unapproved. No connected M4 assignment, order, or payment was written. The Guest-labeled identity stores role `partner` with no organization, and no authorized Admin session is available. The browser check reached Promoter sign-in, authenticated through the BFF, and received 200 from organization/access/onboarding reads, then remained on the `Authorizing Access` state; logout returned 204. This is not complete UI or transaction acceptance. M4 remains incomplete and M5 remains queued.

## Completed local evidence

- Final bounded frontend root check exited 0 with all 29 lint/typecheck tasks, 23 test tasks, and 17 build tasks passing; Guest 276, Partner 868 passed / 1 skipped, Admin 36. The three apps' ignored `.env.local` files were populated from `.env.example`. Backend contract export dry-run reports 23 generated files unchanged.
- Guest production, test and E2E TypeScript projects passed. Shared package tests passed directly: API client 54, auth 28, config 11, hooks 11, UI 33, and utils 10 tests.
- Fresh backend `corepack pnpm check` passed after assignment expiration worker integration, scoped outbox changes, and referral status responses: formatting, lint, typecheck, boundary guardrails, nginx, security pins, Firestore index coverage (57 shapes), all tests, and all three builds. That earlier API Gateway result: 915 passed / 2 skipped across 72 passing files and 1 skipped file; Core 852 passed / 29 skipped; Contracts 20.
- Referral-link regression: the API suite verifies a revoked assignment's replacement gets a different deterministic link and code, preserves the historical link snapshot, and returns the same replacement link on retry. Firestore emulator transactions verify concurrent same-assignment retries, stable replay, and rejection of another assignment's event-code claim. The full backend gate passed after this change.
- After that full gate, `apps/api-gateway/src/routes/v2/partner/analytics.test.ts` passed 35/35 tests, including a journal-read regression where a 3,000 paise commission credit and 1,000 paise reversal produce a 2,000 paise payable balance while the captured attribution snapshot remains 4,000 paise. Focused ESLint and API Gateway typecheck passed. This is memory-backed regression evidence; independent finance review and connected refund/recovery remain open.
- Firestore Emulator final rerun: Core passed 88 files / 878 tests with 4 live-project tests skipped; separate API Auth Firestore integration passed 1 test. This includes RSVP-only empty eligible-tier assignment round-trip coverage. Contract parity passes 239 checks. The latest backend gate covered boundaries, nginx, security pins and 57 Firestore query/index checks; the pin checker notes tar is pinned but absent from the lockfile.
- Scanner Jest exits 0 with no tests found. Fresh production dependency audits report backend 0 advisories and frontend 7 (3 high, 2 moderate, 2 low, 0 critical); see the security audit details below.

## Runtime and blocker state

- Emulator project: `demo-c1rcle`; Auth 9099 and Firestore 8081 were used and are stopped. No persistent connected M4 data exists.
- Backend `.firebaserc` default alias is `c1rcle-v2`; `firebase.json` documents Auth 9099, Firestore 8081, Storage 9199, and Emulator UI 4000. The documented ignored development configuration in the original M3 checkouts targets `c1rcle-v2`, points the frontends to local API port 8080, and contains Razorpay Test Mode configuration. Configuration was inspected without outputting secret values; M3_E2E identities in that file were excluded from use.
- Temporary local API and Partner standalone servers were stopped after the browser check; ports 3001, 8080, 8081, and 9099 are clear. The original Desktop checkout was not used as the running codebase.
- c1rcle-v2 role check: the supplied Promoter, Host, and Venue accounts authenticated as platform role `partner`; each had one active organization with the matching `promoter`, `host`, or `venue` access context and `OWNER` membership. `/onboarding/me` returned no request for these already provisioned organizations. The supplied Guest-labeled account authenticated as platform role `partner` with zero active organizations, so it was not used for Guest behavior. A read-only Firestore check found three active Admin records, but no usable Admin session was supplied; public signup assigns `partner`, while adding an Admin requires an authenticated dual-control flow. M3_E2E identities remain excluded. M4-namespaced business records remain absent; no business data was written. The approved agreement wording remains unavailable. Connected UI/payment acceptance is blocked on a correctly provisioned Guest identity, authorized Admin session, test records, and agreement approval.
- Fresh local Partner Dashboard BFF authentication checks used isolated per-account cookie contexts. Promoter, Host, Venue, and Guest-labeled credentials returned login `200` and logout `204`; the first three had matching organization access, while the Guest-labeled identity remained role `partner` with no organization. The standalone browser pass authenticated the Promoter, received `200` for organization, onboarding, and access reads, and logged out with `204`; the UI remained on `Authorizing Access`, so full dashboard rendering and transaction acceptance are not proven.
- Follow-up read-only project discovery using separate verified Promoter, Host, and Venue sessions found 0 assigned events for the Promoter, 1 event accessible to the Host organization, and 28 accessible to the Venue organization. In-memory inspection found no `M4`-namespaced event DTO for any of these roles. Names and IDs were not retained. Sessions were logged out; the temporary API was stopped and port 8080 was confirmed clear. This confirms that connected acceptance currently lacks a safe existing M4 fixture; no cloud business record was created.
- Fresh production dependency audits after compatible lock updates: backend reports 0 advisories (the security-pin guard has one non-blocking note that the existing `tar` pin is absent from its lockfile); frontend reports 7 (3 high, 2 moderate, 2 low, 0 critical). The lock now resolves patched `nanoid`, `brace-expansion`, `js-yaml`, and `source-map-js` versions. Remaining frontend findings are gRPC 1.9.16 through Firebase (high plus low), Expo `node-forge` 1.4.0 (high; audit metadata lists no patched release), Expo Zod 3.25.76 (high; the available fix is Zod 4, a major-version change to Expo's tree), `decode-uri-component` 0.2.2 (moderate; patched 0.5.0 is outside its current 0.x range), `uuid` 7.0.3 (moderate; patched 11.x is a major change), and `deepmerge` 4.3.1 (low; audit metadata lists no patched release). These were not force-upgraded across incompatible major lines. Next.js 16.4.3 is installed in Guest, Partner and Admin.
- GitHub read-only check: frontend M3 PR #84 is open/draft against `staging` with head `8191d05f02ded56c760f6eb7f2ec44217b013718`; backend M3 PR #148 is open/draft against `staging` with head `93cb16f07a7daaad15947483161c90f684302438`. Those exact heads match the local M4 worktree base SHAs. No M4 commit, push, or PR was made.
- No production migrations ran. Added composite indexes for the Host/Venue query filtering v2_orders by eventId and attribution.promoterId and the assignment expiry query filtering by status and expiresAt; static index validation reports 57 recognized query shapes, and both new query shapes passed under the Firestore Emulator. The gated sequence and prerequisites are documented in the planning-only [M4_MIGRATION_RUNBOOK.md](./M4_MIGRATION_RUNBOOK.md).
- Fresh backend `corepack pnpm check` passed after the scoped outbox and worker opt-out changes. Final frontend root `corepack pnpm check` exited 0 after each app's ignored `.env.local` was populated from its public `.env.example`; formatting, lint, typecheck, boundaries, tests, and all builds passed. The Contracts test imports frontend-only finance schemas directly; backend contract export dry-run reported 23 files unchanged.

## Next executable actions

1. Provide an authorized Guest identity whose stored role is `guest` and an Admin session through the existing non-production setup; do not change the mismatched Guest-labeled account or use ignored M3_E2E identities. The project has three active Admin records, so a new Admin requires the existing dual-control path rather than the first-admin seed.
2. Obtain approved agreement text/version; replace the emulator-only fixture before real campaign activation or acceptance.
3. Use separate browser profiles for the verified Promoter, Host, and Venue accounts and run only connected Test Mode scenarios whose role, membership, onboarding, and agreement gates pass; report blocked cases individually.
4. Close remaining M4 gaps: commission-specific hold/release requires approved accounting semantics; Admin/applicant inbox delivery requires recipient-model decisions; click-anomaly flags and code-probe resistance need defined signals and thresholds; further commission-state notices require defined events and semantics.
5. Review or remediate the remaining 3 frontend high, 2 moderate, and 2 low dependency advisories; backend production audit is clear. Re-run affected builds after any further dependency changes. The explicit continuation instruction prohibits commits, pushes, PRs, merges, and deployment. M5 stays queued until M4's connected/legal/product gates are resolved.

## Exact changed/untracked inventory

### Frontend worktree

- ` M apps/admin-console/package.json` — dependency and security remediation.
- ` M apps/admin-console/src/app/kyc-review/page.test.tsx` — regression or integration tests.
- ` M apps/admin-console/src/app/onboarding/page.test.tsx` — regression or integration tests.
- ` M apps/admin-console/src/app/orders/page.tsx` — Admin control and investigation UI.
- ` M apps/admin-console/src/app/promoters/page.tsx` — Admin control and investigation UI.
- ` M apps/admin-console/src/components/admin/onboarding-application-detail.tsx` — Admin control and investigation UI.
- ` M apps/admin-console/src/lib/admin/admin-api.ts` — Admin control and investigation UI.
- ` M apps/admin-console/src/lib/admin/format.tsx` — Admin control and investigation UI.
- ` M apps/guest-portal/package.json` — dependency and security remediation.
- ` M apps/guest-portal/src/app/checkout/[id]/page.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/app/event/[eventId]/page.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/booking/components/CheckoutFlowClient.test.tsx` — regression or integration tests.
- ` M apps/guest-portal/src/features/booking/components/CheckoutFlowClient.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/booking/components/CheckoutView.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/booking/payment/checkout-api.ts` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/booking/payment/paid-checkout.ts` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/event-detail/components/EventDetailView.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/event-detail/components/EventTicketSelectorClient.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/event-detail/components/PromoterClickTracker.test.tsx` — regression or integration tests.
- ` M apps/guest-portal/src/features/event-detail/components/PromoterClickTracker.tsx` — Guest attribution and checkout UI.
- ` M apps/partner-dashboard/e2e/onboarding.spec.ts` — regression or integration tests.
- ` M apps/partner-dashboard/package.json` — dependency and security remediation.
- ` M apps/partner-dashboard/src/app/onboard/PageClient.test.tsx` — regression or integration tests.
- ` M apps/partner-dashboard/src/app/partner/[studio]/events/[eventId]/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/events/[eventId]/promoters/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/events/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/links/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/overview/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/components/partner-v3/event-detail/ConnectedEventPromotersScreen.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/components/partner-v3/events/PromoterEventsScreen.test.tsx` — regression or integration tests.
- ` M apps/partner-dashboard/src/components/partner-v3/events/PromoterEventsScreen.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/components/providers/DashboardAuthProvider.test.tsx` — regression or integration tests.
- ` M apps/partner-dashboard/src/data/fixture-partner-data-source.ts` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/data/partner-data-source.ts` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/lib/events/load-partner-event-promoters.ts` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/lib/events/load-promoter-events.test.ts` — regression or integration tests.
- ` M apps/partner-dashboard/src/lib/events/load-promoter-events.ts` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/lib/onboarding/onboarding-repository.test.ts` — regression or integration tests.
- ` M packages/contracts/src/client.ts` — API and domain contract changes.
- ` M packages/contracts/test/contracts.test.ts` — regression or integration tests.
- ` M packages/contracts/src/contracts/admin-orders.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/admin-promoters.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/checkout.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/event.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/onboarding.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/organization.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/partner.ts` — API and domain contract changes.
- ` M packages/contracts/src/index.ts` — API and domain contract changes.
- ` M pnpm-lock.yaml` — dependency and security remediation.
- `?? apps/admin-console/src/app/promoters/page.test.tsx` — regression or integration tests.
- `?? apps/admin-console/src/components/admin/onboarding-application-detail.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/event-detail/ConnectedEventPromoterManagement.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/event-detail/ConnectedEventPromoterManagement.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterLinksConnected.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterLinksConnected.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterOverviewConnected.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterOverviewConnected.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/components/promoter/PromoterAssignmentControls.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/components/promoter/PromoterAssignmentDetailsScreen.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/lib/events/load-promoter-links.ts` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/lib/events/load-promoter-overview.ts` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/lib/partner/promoter-assignment-repository.ts` — Partner and Promoter distribution UI.
- `?? docs/M4_COMMERCIAL_POLICY_DECISION.md` — M4 execution and policy documentation.
- `?? docs/M4_EXECUTION_CHECKPOINT.md` — M4 execution and policy documentation.
- `?? docs/M4_FINAL_HANDOFF.md` — M4 execution and policy documentation.
- `?? docs/M4_MIGRATION_RUNBOOK.md` — gated, planning-only M4 data/index migration procedure.
- `?? docs/M4_IMPLEMENTATION_PLAN.md` — M4 execution and policy documentation.
- `?? docs/M4_PROMOTER_ATTRIBUTION_MODEL.md` — M4 execution and policy documentation.

### Backend worktree

- ` M apps/api-gateway/src/app.ts` — API Gateway route and plugin registration.
- ` M apps/api-gateway/src/config/index.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/config/index.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/lib/v2-services.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/admin/orders.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/admin/orders.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/admin/promoters.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/admin/promoters.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/onboarding.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/onboarding.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/partner/event-catalog.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/partner/event-catalog.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/partner/analytics.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/partner/analytics.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/partner/events.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/partner/referral-links.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/partner/referral-links.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/public/discovery.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/public/discovery.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/rsvp/rsvp-routes.ts` — API Gateway route, DTO, or composition changes.
- ` M firestore.indexes.json` — composite indexes for event-scoped attributed-order reads and due assignment expiry.
- ` M governance/security-pins.json` — dependency advisory pin policy.
- ` M packages/contracts/parity/cases.mjs` — API and domain contract changes.
- ` M packages/contracts/src/client.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/admin-orders.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/admin-promoters.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/checkout.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/event.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/onboarding.ts` — API and domain contract changes.
- ` M packages/contracts/src/contracts/partner.ts` — API and domain contract changes.
- ` M packages/contracts/src/index.ts` — API and domain contract changes.
- ` M packages/core/src/application/admin/admin-ops-service.test.ts` — regression or integration tests.
- ` M packages/core/src/application/admin/admin-ops-service.ts` — application service and finance changes.
- ` M packages/core/src/application/checkout/checkout-service.ts` — application service and finance changes.
- ` M packages/core/src/application/analytics/analytics-service.ts` — backend-derived analytics and finance read model.
- ` M packages/core/src/application/event-catalog/event-catalog-service.ts` — application service and finance changes.
- `?? packages/core/src/application/event-catalog/event-catalog-service.test.ts` — assignment lifecycle regression tests.
- ` M packages/core/src/application/events/event-bus.test.ts` — regression or integration tests.
- ` M packages/core/src/application/events/event-bus.ts` — domain event dispatch changes.
- ` M packages/core/src/application/finance/financial-posting-service.ts` — application service and finance changes.
- ` M packages/core/src/application/finance/provider-payment-service.test.ts` — regression or integration tests.
- ` M packages/core/src/application/finance/provider-payment-service.ts` — application service and finance changes.
- ` M packages/core/src/application/notifications/notification-consumer.test.ts` — regression or integration tests.
- ` M packages/core/src/application/notifications/notification-consumer.ts` — application service and finance changes.
- ` M packages/core/src/application/onboarding/onboarding-service.ts` — application service and finance changes.
- ` M packages/core/src/application/onboarding/onboarding-service.test.ts` — regression or integration tests.
- ` M packages/core/src/application/events/transactional-email-consumer.ts` — application service and finance changes.
- ` M packages/core/src/application/events/transactional-email-consumer.test.ts` — regression or integration tests.
- ` M packages/core/src/application/promoters/referral-link-service.ts` — application service and finance changes.
- ` M packages/core/src/domain/events.ts` — domain model and policy changes.
- ` M packages/core/src/domain/index.ts` — domain model and policy changes.
- ` M packages/core/src/domain/ledger.test.ts` — regression or integration tests.
- ` M packages/core/src/domain/models/admin-authority.ts` — domain model and policy changes.
- ` M packages/core/src/domain/models/event-catalog.ts` — domain model and policy changes.
- ` M packages/core/src/domain/models/financial-journal.ts` — domain model and policy changes.
- ` M packages/core/src/domain/models/ledger.ts` — domain model and policy changes.
- ` M packages/core/src/domain/models/onboarding.ts` — domain model and policy changes.
- ` M packages/core/src/domain/models/order.ts` — domain model and policy changes.
- ` M packages/core/src/domain/models/referral-link.ts` — domain model and policy changes.
- ` M packages/core/src/domain/ports/repositories.ts` — domain model and policy changes.
- ` M packages/core/src/domain/ports/outbox.ts` — transactional outbox contract changes.
- ` M packages/core/src/domain/referral-link.test.ts` — regression or integration tests.
- ` M packages/core/src/infrastructure/firestore/firestore-event-catalog-repository.ts` — persistence adapter changes.
- `?? packages/core/src/infrastructure/firestore/firestore-expired-assignment.integration.test.ts` — assignment expiry query integration tests.
- ` M packages/core/src/infrastructure/firestore/firestore-late-capture.integration.test.ts` — regression or integration tests.
- ` M packages/core/src/infrastructure/firestore/firestore-notification-repository.ts` — persistence adapter changes.
- ` M packages/core/src/infrastructure/firestore/firestore-onboarding-repository.ts` — persistence adapter changes.
- ` M packages/core/src/infrastructure/firestore/firestore-order-repository.ts` — persistence adapter changes.
- ` M packages/core/src/infrastructure/firestore/firestore-outbox-store.ts` — Firestore transactional outbox persistence.
- `?? packages/core/src/infrastructure/firestore/firestore-outbox.integration.test.ts` — scoped outbox integration tests.
- ` M packages/core/src/infrastructure/firestore/firestore-referral-link-repository.ts` — persistence adapter changes.
- ` M packages/core/src/infrastructure/memory/memory-notification-repository.ts` — persistence adapter changes.
- ` M packages/core/src/infrastructure/memory/memory-outbox-store.ts` — in-memory transactional outbox persistence.
- ` M packages/core/src/infrastructure/memory/memory-referral-link-repository.ts` — persistence adapter changes.
- ` M packages/core/src/infrastructure/memory/memory-repositories.ts` — persistence adapter changes.
- ` M pnpm-lock.yaml` — dependency lock and security updates.
- ` M pnpm-workspace.yaml` — workspace and dependency security policy changes.
- `?? packages/core/src/domain/models/promoter-agreement.ts` — domain model and policy changes.
- `?? packages/core/src/domain/promoter-agreement.test.ts` — regression or integration tests.
- `?? packages/core/src/domain/promoter-assignment.test.ts` — regression or integration tests.
- `?? packages/core/src/infrastructure/firestore/firestore-notification.integration.test.ts` — regression or integration tests.
- `?? packages/core/src/infrastructure/firestore/firestore-promoter-agreement.integration.test.ts` — regression or integration tests.
- `?? packages/core/src/infrastructure/firestore/firestore-referral-click.integration.test.ts` — regression or integration tests.
- `?? packages/core/src/infrastructure/firestore/firestore-referral-code.integration.test.ts` — assignment-code reservation transaction regression tests.

See [M4_FINAL_HANDOFF.md](./M4_FINAL_HANDOFF.md) for the packet findings, full verification record, and limitations.

## Final verification update

After the organization inbox cursor contract and route regression were added, the bounded frontend root check `TURBO_CONCURRENCY=1 corepack pnpm check` exited 0: formatting, lint, typecheck, boundaries, tests (23/23 tasks), and builds (17/17 tasks) passed. Partner tests reported 160 files / 881 passed / 1 skipped; Guest remained 276 passed. Partner desktop and Pixel 7 Playwright passed 26/26. The backend bounded root check also exited 0 after email-log redaction: formatting, lint, typecheck, boundaries, nginx, security pins, 57 Firestore query shapes, tests, and builds passed; Contracts 20, Core 853 passed / 30 skipped, API Gateway 918 passed / 2 skipped across 72 passing files and one skipped file. Contract parity passed 239 checks. `git diff --check` was clean in both worktrees. These automated results do not remove connected acceptance blockers.

The Promoter referral-link list pagination gap is now closed locally: the API response has a next cursor, the response is contract-validated, and the dashboard can navigate previous/next pages. API regression tests passed 13/13; focused loader/component tests passed 7/7; Partner typecheck and focused lint passed; API Gateway typecheck and 239 contract parity checks passed. The final bounded frontend root check now passes (29 lint, 29 typecheck, 23 test, and 17 build tasks); Partner reports 886 passed / 1 skipped. The final bounded backend root check also passes (Core 853 passed / 30 skipped; API Gateway 918 passed / 2 skipped). Development email-log redaction tests passed in API Gateway (3/3) and Core (1/1). Current inventory is 87 frontend and 94 backend changed/untracked paths.
# 2026-10-29 connected acceptance continuation

Using separate non-production sessions, stored roles and organization memberships were verified for Guest, Host and Promoter. Guest is stored as `guest` but email verification is false. Host and Promoter are stored as `partner`, each with one active organization membership of type `host` or `promoter` and a matching capability; both are unverified and have no onboarding request. A namespaced Host–Promoter connection was created through the supported request/approval APIs and is active.

Venue sign-in returned 401; its account is a generic partner and unverified, and no membership or capability was verified. No authorized Admin session was available; active Admin records exist and dual-control safeguards were preserved. Cross-organization reads were denied (403), Guest Admin reads were denied (401), and a Partner write without CSRF was denied (403).

No event assignment, referral attribution, RSVP, paid order, Razorpay Test Mode payment/refund, journal compensation, webhook replay, notification delivery, or Admin metric review was performed. The unverified Guest and lack of test mail sink block RSVP; Venue/Admin prerequisites block fresh event configuration and approval. Source verification is complete as documented in the M5 acceptance matrix, but connected M4 remains incomplete.
