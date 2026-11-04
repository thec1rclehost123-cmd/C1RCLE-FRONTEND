# M4 Final Handoff

Status: **Incomplete; M4 is not done and M5 remains queued.**

## Verification evidence

- Fresh frontend tests after dependency lock refresh: Guest Portal 49 files / 276 passed; Partner Dashboard 156 files / 868 passed / 1 skipped; Admin Console 12 files / 36 passed. Partner emitted existing Node `--localstorage-file` warnings.
- Guest, Partner and Admin app lint/typechecks passed on the refreshed lock. Admin retains one Next.js `window.location.assign()` warning in the login page. Production builds also pass on the refreshed lock: Next.js 16.4.3 for all three apps. Guest used only the four public values from `apps/guest-portal/.env.example`. Focused current UI tests passed: Admin Promoters 3; Partner event analytics and Promoter overview 2.
- Guest production, test and E2E TypeScript projects passed. Shared package tests passed directly: API client 54, auth 28, config 11, hooks 11, UI 33, and utils 10 tests.
- Final bounded frontend root check `TURBO_CONCURRENCY=1 corepack pnpm check` exited 0 after the connected Promoter Analytics change. Formatting passed; lint and typecheck passed 29/29 tasks each; boundaries passed; tests passed 23/23 tasks; builds passed 17/17 tasks, including Scanner Web/iOS/Android export. Guest tests: 49 files / 276 passed; Partner: 160 files / 881 passed / 1 skipped; Admin: 12 files / 36 passed. An earlier concurrent run hit a 5-second timeout in one Admin Support test; that file passed 3/3 alone and the bounded root check passed. Admin retains one existing `window.location.assign()` lint warning and Partner tests emit existing Node `--localstorage-file` warnings. The Contracts test imports frontend-only finance schemas directly from `packages/contracts/src/contracts/finance-admin.ts`; the backend-owned generated mirror contains 23 files.
- Partner onboarding browser coverage: `corepack pnpm --filter @c1rcle/app-partner-dashboard test:e2e` passed 26/26 across Chromium desktop and Pixel 7 mobile after the connected Promoter Analytics change, including explicit URL-contract assertions. The E2E helper now rejects direct gateway writes for application start/autosave/submit so mocked requests cannot hide a routing regression. These are mocked browser tests, not connected acceptance. Playwright emitted the existing `next start` versus standalone-output warning.
- Promoter Analytics was previously routed to an unavailable placeholder while an authoritative campaign-summary endpoint already existed. `/partner/promoter/analytics` now renders the existing backend summary: bounded link count, clicks, conversions, and gross attributed ticket value. It labels the first-1,000-link limit and gross-before-refund meaning; it does not synthesize a daily trend or treat gross ticket value as commission. Focused loader/component tests passed 4/4, Partner Dashboard typecheck exited 0, and focused ESLint/Prettier passed. The final bounded frontend root check exited 0 with 29/29 lint and typecheck tasks, 23/23 test tasks, and 17/17 build tasks; Guest passed 276, Partner passed 868 with 1 skipped, and Admin passed 36. The desktop/mobile Playwright suite passed 26/26 after this change. Connected account rendering remains blocked by the existing onboarding/access prerequisites.
- Fresh backend full tests: Contracts 2 files / 20 passed; Core 78 files / 852 passed / 29 skipped; API Gateway 72 files / 911 passed / 2 skipped. API coverage includes a memory-backed Guest quote regression that rejects a frozen commission after a 25% discount; Core and API tests also cover campaigns, risk flags, onboarding lifecycle outbox/email delivery, assignment expiry, and Promoter payout notifications.
- After that full gate, the API analytics route suite passed 35/35 tests with an added journal-read regression. It verifies a 3,000 paise commission credit less a 1,000 paise reversal yields a 2,000 paise payable balance, while captured-order attribution remains 4,000 paise. The focused route lint and API Gateway typecheck passed. This is deterministic memory-backed verification, not an independent finance review or connected Test Mode refund run.
- The preceding full backend gate passed before the referral-validity response removal: formatting, lint, typecheck, boundaries, nginx, security pins, 57 Firestore query shapes, all tests, and Contracts/Core/Gateway builds. It reported API Gateway 914 passed / 2 skipped and Core 852 passed / 29 skipped. The current post-change gate is recorded in the next bullet.
- After the full backend gate, assignment-scoped referral-link idempotency was fixed. A revoked assignment's replacement now has its own deterministic link and unique event code; retries for that assignment return its link, and the prior link snapshot is retained. The API regression file passed 12/12 tests; Firestore emulator reservation, concurrent retry, and conflict checks passed.
- Follow-up referral validity privacy: the anonymous click endpoint returns a constant acknowledgment and records only valid codes. Quote, hold, and RSVP responses omit whether a submitted referral code was applied; the backend still validates it and stores eligible attribution on the order. This intentionally leaves an ineligible code in browser context because clearing it based on validity would restore the enumeration oracle. Newly generated default vanity URLs use a 96-bit random suffix instead of the previous three-character code suffix. Explicitly requested aliases remain public values, and existing aliases are not rotated. Fresh UUIDs can still inflate click counters within the existing per-IP rate limit. The earlier bounded backend root check passed: API Gateway 915 passed / 2 skipped (72 passing files, 1 skipped file), Core 852 passed / 30 skipped, Contracts 20. The frontend root check passed 29 lint/typecheck tasks, 23 test tasks, and 17 build tasks, with Guest 276, Partner 868 passed / 1 skipped, Admin 36. Contract parity passed 239 checks. The final Firestore emulator run passed 878 Core tests across 88 files / 4 skipped and API Auth integration 1/1; the new empty-tier RSVP assignment persistence assertion is included. The emulator shut down cleanly.
- The dedicated full-app API scenario runner passed 5/5, including test-fixture onboarding, connection, an RSVP-only zero-commission assignment and free RSVP attribution, a paid assignment and attributed order, duplicate/invalid click handling, idempotent hold/payment-attempt retries, duplicate webhook, and scoped Promoter/Host/Admin reads. It runs only on memory storage with fabricated test actors and `MemoryPaymentProvider`; its explicit test agreement is not legal wording and it does not prove connected Firebase/Razorpay Test Mode acceptance.
- The final Core Firestore Emulator sweep passed 88 files / 878 tests; 4 live-project tests were skipped. Coverage includes agreement persistence/reacceptance, notification create-once, click and code reservation retry behavior, due assignment expiry (including explicit empty eligible tiers), attributed-order reads, late capture, finance, inventory, promo redemption, and Auth. The separate API Auth Firestore integration passed 1 test. The emulator shut down after the run. Storage rules are not configured.
- Scanner Jest exited 0 with no tests found. Fresh production dependency audits: backend 0 advisories; frontend 7 (3 high, 2 moderate, 2 low, 0 critical). The frontend lock now resolves patched `nanoid`, `brace-expansion`, `js-yaml`, and `source-map-js` versions.
- The documented ignored local config was read without printing secret values. It targets `c1rcle-v2`, points the apps to a local API, and has a Razorpay Test Mode key identifier. A local M4 API was started with only required config keys, M3_E2E variables excluded, and payouts disabled. The supplied Promoter, Host, and Venue identities authenticated as platform `partner`; each had one active organization with matching Promoter/Host/Venue access and `OWNER` membership. The Guest-labeled credentials authenticated as `partner` with zero organizations, so that account was not used as a Guest. A read-only project check found three active Admin records, but no usable Admin session was supplied; M3_E2E Admin credentials remain excluded. Public signup assigns `partner`, and the first-admin seed refuses to create another admin when active admins exist. Sessions were logged out. No M4 business records, payment, payout, Live Mode, production access, or deployment occurred.
- Fresh local Partner Dashboard BFF authentication checks used isolated per-account cookie contexts. Promoter, Host, Venue, and Guest-labeled credentials each returned login `200` and logout `204`. The first three had platform role `partner`, one organization each, and matching `promoter`, `host`, or `venue` access; the Guest-labeled account had role `partner` and zero organizations. This verifies authentication and organization access only; it does not prove the complete browser workflow. No Admin session or Guest-role session was available.
- Read-only M4 fixture discovery found 0 assigned events for the verified Promoter, 1 Host-accessible event, and 28 Venue-accessible events; in-memory DTO inspection found no `M4`-namespaced event. No names or IDs were retained. Role sessions were logged out and the local API was stopped. The later browser run also logged out and all temporary servers were stopped; ports 3001, 8080, 8081, and 9099 are clear.
- GitHub read-only inspection confirmed frontend M3 PR #84 and backend M3 PR #148 are open draft PRs targeting `staging`; their head SHAs exactly match the local M4 worktree base SHAs recorded in the implementation plan. No M4 commit, push, or PR was created.
- Latest backend root verification `TURBO_CONCURRENCY=1 corepack pnpm check` exited 0 after RSVP-only zero-commission assignment support: format, lint, typecheck, boundaries, nginx, security pins, 57 Firestore query shapes, Contracts/Core/API tests, and all three builds passed. Contracts reported 20 tests; Core 852 passed / 30 skipped; API Gateway 916 passed / 2 skipped across 72 passing files and one skipped file. The separate Firestore emulator integration suite passed as listed above.
- The standalone Partner browser check authenticated the Promoter through the BFF and received `200` for organization, onboarding, and access reads. It remained on `Authorizing Access`, so full dashboard rendering was not proven; logout returned `204`. The connected Promoter's onboarding lookup is empty, preventing assignment eligibility, and the approved agreement text/version is unavailable. No connected M4 business records or payments were written.

## Security and dependency findings

Fresh production audits report 0 backend advisories and 7 frontend advisories (3 high, 2 moderate, 2 low, 0 critical). Remaining frontend findings are gRPC 1.9.16 through Firebase (high and low), Expo `node-forge` 1.4.0 (high; audit metadata lists no patched release), Expo Zod 3.25.76 (high; the available fix is a Zod 4 major update), `decode-uri-component` 0.2.2 (moderate; patched 0.5.0 is outside the current 0.x line), `uuid` 7.0.3 (moderate; patched 11.x is a major update), and `deepmerge` 4.3.1 (low; audit metadata lists no patched release). Do not describe the frontend tree as clean. The earlier critical Next.js findings are addressed by Next.js 16.4.3. See the [Next.js security advisories](https://github.com/vercel/next.js/security/advisories) and [official releases](https://github.com/vercel/next.js/releases).

## Blockers and next actions

1. **Approved Promoter agreement:** legal owner supplies approved text and version; replace the fixture-only artifact before real acceptance or activation. User confirmed there is no approved wording yet; acceptance remains blocked.
2. **Guest and Admin roles:** the Guest-labeled account is not a Guest in stored auth state (platform role `partner`, no active organization). A read-only check found three active Admin records but no usable Admin session was supplied. Public signup assigns `partner`; the supported first-admin bootstrap refuses when admins already exist, and adding another Admin requires an authenticated Admin dual-control flow. Do not alter these identities or use the prohibited M3_E2E identities. A correctly provisioned Guest and an authorized Admin session are needed for the complete connected scenario.
3. **M4 business records and agreement:** no namespaced M4 event/order data exists. Approved Promoter agreement wording/version is still unavailable, so real acceptance and campaign activation remain blocked. Do not substitute the emulator-only fixture in c1rcle-v2.
4. **Razorpay Test Mode:** the ignored local config contains a Test Mode key identifier, but no connected provider call/payment occurred. After the identity/agreement gates are met, run callback, recovery, and refund scenarios only in Test Mode.
5. **Product and abuse-control gaps:** commission-specific hold/release, additional commission-state notices, and Admin inbox notices remain incomplete. Applicant onboarding submitted/approved/rejected events now send idempotent transactional status emails through the existing delivery outbox; Promoter suspension and assignment-expiration emails resolve to the stored organization owner. Assignment expiration now uses a capped Firestore worker, persists the terminal state, and emits one deterministic event; its due query passed against the Firestore emulator. Focused tests use an in-memory sender; no connected email provider was called. The finance path confirms payout freeze/release is whole-payout dual control; Promoter commission is an append-only payable allocation line and has no separate held-balance transition. Adding one requires approved accounting semantics for balance, payout eligibility, refunds, chargebacks, audit, and release. The notification inbox only addresses organizations, while applicants lack one before approval and no Admin recipient model exists. The public referral click route has a 120-requests/minute per-IP limit and 60-second token dedupe, returns a uniform acknowledgment, and records only valid codes. Fresh UUIDs can still inflate counters within the per-IP budget; token reuse alone is deduped. Quote, hold, and RSVP responses omit referral validity, closing that response oracle. Admin risk flags currently include active provider disputes only; click-anomaly thresholds and counter-abuse limits remain undefined. Legacy vanity aliases are not rotated automatically; a read-only inventory and approved rotation plan must precede activation if old links exist. Host/Venue analytics have bounded source-derived attribution and a journal-read reversal regression; independent finance review and connected runtime proof remain.
6. **Dependency advisories:** decide whether to accept or remediate the 3 remaining frontend high findings and the remaining moderate/low findings. Backend production audit is clear; the frontend lock clears four compatible advisory families. Re-run audits after any further dependency changes.

## Repository and release state

Both repositories remain uncommitted working-tree changes on their M4 branches; HEAD is still the M3 base SHA. No commits, pushes, PRs, merges, or deployments have occurred. The explicit continuation instruction prohibits commits, pushes, PRs, merges, and deployment; the exact dirty worktrees remain the M5 starting point. M5 remains queued until M4 is done. No files were changed in the original Desktop checkout.

### Changed and untracked file inventory

#### Frontend worktree (87 changed or untracked files)

- ` M apps/admin-console/next-env.d.ts` — generated Next.js type declarations updated by the production build.
- ` M apps/admin-console/package.json` — dependency and security remediation.
- ` M apps/admin-console/src/app/kyc-review/page.test.tsx` — regression or integration tests.
- ` M apps/admin-console/src/app/onboarding/page.test.tsx` — regression or integration tests.
- ` M apps/admin-console/src/app/orders/page.tsx` — Admin control and investigation UI.
- ` M apps/admin-console/src/app/promoters/page.tsx` — Admin control and investigation UI.
- ` M apps/admin-console/src/components/admin/onboarding-application-detail.tsx` — Admin control and investigation UI.
- ` M apps/admin-console/src/lib/admin/admin-api.ts` — Admin control and investigation UI.
- ` M apps/admin-console/src/lib/admin/format.tsx` — Admin control and investigation UI.
- ` M apps/guest-portal/next-env.d.ts` — generated Next.js type declarations updated by the production build.
- ` M apps/guest-portal/package.json` — dependency and security remediation.
- ` M apps/guest-portal/src/app/checkout/[id]/page.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/app/event/[eventId]/page.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/booking/components/CheckoutFlowClient.test.tsx` — regression or integration tests.
- ` M apps/guest-portal/src/features/booking/components/CheckoutFlowClient.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/booking/components/CheckoutView.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/booking/payment/checkout-api.ts` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/booking/payment/paid-checkout.test.ts` — regression or integration tests.
- ` M apps/guest-portal/src/features/booking/payment/paid-checkout.ts` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/event-detail/components/EventDetailView.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/event-detail/components/EventTicketSelectorClient.tsx` — Guest attribution and checkout UI.
- ` M apps/guest-portal/src/features/event-detail/components/PromoterClickTracker.test.tsx` — regression or integration tests.
- ` M apps/guest-portal/src/features/event-detail/components/PromoterClickTracker.tsx` — Guest attribution and checkout UI.
- ` M apps/partner-dashboard/e2e/onboarding.spec.ts` — regression or integration tests.
- ` M apps/partner-dashboard/next-env.d.ts` — generated Next.js type declarations updated by the production build.
- ` M apps/partner-dashboard/package.json` — dependency and security remediation.
- ` M apps/partner-dashboard/src/app/onboard/PageClient.test.tsx` — regression or integration tests.
- ` M apps/partner-dashboard/src/app/partner/[studio]/analytics/page.tsx` — connected Promoter campaign analytics route.
- ` M apps/partner-dashboard/src/app/partner/[studio]/events/[eventId]/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/events/[eventId]/promoters/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/events/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/links/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/overview/page.tsx` — Partner and Promoter distribution UI.
- ` M apps/partner-dashboard/src/app/partner/[studio]/notifications/page.tsx` — connected organization-scoped inbox.
- ` M apps/partner-dashboard/src/components/partner-v3/PartnerShell.tsx` — active-organization notification unread count.
- ` M apps/partner-dashboard/src/components/partner-v3/PartnerTopbar.tsx` — inbox navigation and unread count.
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
- ` M packages/contracts/src/contracts/notifications.ts` — API and domain contract changes.
- ` M packages/contracts/src/index.ts` — API and domain contract changes.
- ` M pnpm-lock.yaml` — dependency and security remediation.
- `?? apps/admin-console/src/app/promoters/page.test.tsx` — regression or integration tests.
- `?? apps/admin-console/src/components/admin/onboarding-application-detail.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/event-detail/ConnectedEventPromoterManagement.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/ConnectedPartnerNotifications.tsx` — connected organization-scoped inbox UI.
- `?? apps/partner-dashboard/src/components/partner-v3/ConnectedPartnerNotifications.test.tsx` — inbox behavior regression tests.
- `?? apps/partner-dashboard/src/app/api/bff/partner-inbox/route.ts` — same-origin notification BFF.
- `?? apps/partner-dashboard/src/app/api/bff/partner-inbox/route.test.ts` — BFF authorization and forwarding tests.
- `?? apps/partner-dashboard/src/lib/notifications/partner-inbox-repository.ts` — inbox BFF client.
- `?? apps/partner-dashboard/src/components/partner-v3/event-detail/ConnectedEventPromoterManagement.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterLinksConnected.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterAnalyticsConnected.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterAnalyticsConnected.tsx` — connected Promoter campaign analytics UI.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterLinksConnected.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterOverviewConnected.test.tsx` — regression or integration tests.
- `?? apps/partner-dashboard/src/components/partner-v3/promoter/PromoterOverviewConnected.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/components/promoter/PromoterAssignmentControls.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/components/promoter/PromoterAssignmentDetailsScreen.tsx` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/lib/events/load-promoter-campaign-summary.test.ts` — regression or integration tests.
- `?? apps/partner-dashboard/src/lib/events/load-promoter-campaign-summary.ts` — backend-backed Promoter analytics loader.
- `?? apps/partner-dashboard/src/lib/events/load-promoter-links.ts` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/lib/events/load-promoter-links.test.ts` — pagination loader regression tests.
- `?? apps/partner-dashboard/src/lib/events/load-promoter-overview.ts` — Partner and Promoter distribution UI.
- `?? apps/partner-dashboard/src/lib/partner/promoter-assignment-repository.ts` — Partner and Promoter distribution UI.
- `?? docs/M4_COMMERCIAL_POLICY_DECISION.md` — M4 execution and policy documentation.
- `?? docs/M4_EXECUTION_CHECKPOINT.md` — M4 execution and policy documentation.
- `?? docs/M4_FINAL_HANDOFF.md` — M4 execution and policy documentation.
- `?? docs/M4_MIGRATION_RUNBOOK.md` — gated, planning-only M4 data/index migration procedure.
- `?? docs/M4_IMPLEMENTATION_PLAN.md` — M4 execution and policy documentation.
- `?? docs/M4_PROMOTER_ATTRIBUTION_MODEL.md` — M4 execution and policy documentation.

#### Backend worktree (94 changed or untracked files)

- ` M apps/api-gateway/src/app.ts` — API Gateway route and plugin registration.
- ` M apps/api-gateway/scenarios/business-flows.test.ts` — full-app in-memory M4 campaign attribution scenario.
- ` M apps/api-gateway/src/config/index.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/config/index.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/lib/v2-services.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/lib/notifications/resend-email-sender.test.ts` — regression tests for development email log redaction.
- ` M apps/api-gateway/src/lib/notifications/resend-email-sender.ts` — suppresses sensitive fields in development email logs.
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
- ` M apps/api-gateway/src/routes/v2/checkout/checkout-routes.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/partner/referral-links.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/partner/referral-links.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/public/discovery.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/public/discovery.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/rsvp/rsvp-routes.test.ts` — regression or integration tests.
- ` M apps/api-gateway/src/routes/v2/rsvp/rsvp-routes.ts` — API Gateway route, DTO, or composition changes.
- ` M apps/api-gateway/src/routes/v2/notifications/notifications-routes.ts` — notification cursor response contract.
- ` M apps/api-gateway/src/routes/v2/notifications/notifications-routes.test.ts` — notification cursor pagination regression test.
- ` M packages/contracts/src/contracts/notifications.ts` — notification page cursor contract.
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
- ` M packages/contracts/src/contracts/notifications.ts` — API and domain contract changes.
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
- ` M packages/core/src/domain/ports/email-sender.ts` — suppresses sensitive fields in development email logs.
- `?? packages/core/src/domain/ports/email-sender.test.ts` — regression test for sanitized development email logs.
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

### Final verification after inbox cursor contract

- Frontend: `TURBO_CONCURRENCY=1 corepack pnpm check` exited 0. Formatting, lint (29/29 tasks), typecheck (29/29), boundaries, tests (23/23), and builds (17/17) passed. Guest: 276 tests; Partner: 160 files / 881 passed / 1 skipped; Admin: 12 files / 36 passed. Existing Admin `window.location.assign()` lint warning and Node `--localstorage-file` test warnings remain.
- Partner browser suite: `corepack pnpm --filter @c1rcle/app-partner-dashboard test:e2e` exited 0 with 26/26 desktop and Pixel 7 tests. It remains mocked onboarding/provider coverage, not connected M4 acceptance. Playwright emitted the existing standalone-output warning.
- Backend: `TURBO_CONCURRENCY=1 corepack pnpm check` exited 0 after email-log redaction. Contracts 20; Core 853 passed / 30 skipped; API Gateway 918 passed / 2 skipped across 72 passing files and one skipped file. Formatting, lint, typecheck, boundaries, nginx, security pins, 57 Firestore query shapes, and all three builds passed. The security-pins check notes a `tar` pin absent from the lockfile; check otherwise passed.
- Contract parity: `C1RCLE_FRONTEND_PATH=/tmp/c1rcle-m4-20261028.OgdFgb/frontend corepack pnpm contract-parity` passed 239 checks. `git diff --check` was clean in both worktrees.
- Current uncommitted inventory is 87 frontend and 94 backend changed/untracked paths. Both branches and HEAD SHAs remain the recorded M3 bases.

### Referral-link pagination follow-up

The authenticated Promoter link-list endpoint now returns `nextCursor` and an accurate page number in a dedicated response schema. Numeric offset cursors are validated as safe, page-aligned integers; the route test verifies first/second page contents, terminal cursor, and malformed/misaligned rejection. The Promoter links dashboard consumes that cursor through its server loader and offers previous/next navigation with total-count disclosure and explicit empty/out-of-range states. API route tests passed 13/13; frontend loader/component tests passed 7/7; Partner typecheck and focused ESLint passed; backend API typecheck and 239 contract parity checks passed. The final frontend bounded root check passed after this follow-up (29 lint and typecheck tasks, 23 test tasks, 17 build tasks; Partner 886 passed / 1 skipped). The backend root verification also passed after email-log redaction: Core 853 passed / 30 skipped; API Gateway 918 passed / 2 skipped; lint, typecheck, contracts, and builds passed.

Development email logging was also found to emit OTPs, password-reset URLs, and temporary staff-invitation credentials when provider delivery was suppressed. Both the API sender and shared logging adapter now log only a suppressed-delivery marker for these and other development email categories. Focused regression tests assert secret and recipient data are absent; both passed. The full backend root check passed after the change.
