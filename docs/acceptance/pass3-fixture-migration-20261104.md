# Pass 3 — authorized legacy fixture migration

The human explicitly authorized only the affected legacy test setup for already-approved Partner workspaces. Direct organization creation remains forbidden; no production route, operational implementation, authorization policy, ticket/finance assertion or business behavior changed in this follow-up.

## Setup changes and preserved intent

A shared helper, `apps/api-gateway/src/test-utils/approved-partner-organization.ts`, creates the existing domain organization and saves it through the normal repository. It preserves the legacy owner/capability/settings preconditions. It is test-only and does not claim to exercise KYC approval; onboarding tests independently cover that gate.

17 legacy files now obtain their workspace from this helper instead of POST /organizations. All subsequent operational actions still run through their existing routes. The idempotency file seeds its approved workspace once and tests the existing venue-create/list routes: same validation, replay, conflict, concurrent duplicate and optimistic-locking assertions. No replay/conflict assertion was weakened. The only changed assertion across the diff is an obsolete setup HTTP-201 assertion in the RSVP seed, now asserting the saved workspace is active. Ticket/finance business assertions are byte-for-byte unchanged.

Commit: backend `abe85ab96e2e5ef1103fdd31f041a872cc02225e` (19 files: 18 tests and one test-only helper).

Reproduce the legacy sweep from the backend worktree:

```sh
pnpm exec vitest run $(git diff --name-only 265a4a8 abe85ab -- '*.test.ts') --maxWorkers=2
```

## Verification

- 18 affected legacy files: **311 tests passed**.
- Final Pass 3 backend verification: **169 tests passed** across 10 files, including actual loopback Firestore tests and the direct organization provisioning denial.
- Gateway typecheck, targeted ESLint/Prettier, boundary guardrails and diff checks passed.
- Existing frontend/contract/browser evidence from the completed Pass 3 sweep remains applicable; this follow-up changed no frontend, contract or production source. No unrelated full-product or Scanner suite was run.
- Initial migration validation caught fixed-ID reseeding in idempotency setup; it now seeds once per file. The complete 18-file run passed after that correction.

## Exact M3-owned test files touched

These paths overlap M3 committed work and require deliberate fixture-only integration. No M3 worktree was edited.

- `apps/api-gateway/src/routes/v2/admin/refunds.test.ts`
- `apps/api-gateway/src/routes/v2/checkout/checkout-routes.test.ts`
- `apps/api-gateway/src/routes/v2/checkout/payment-routes.test.ts`
- `apps/api-gateway/src/routes/v2/checkout/webhook-routes.test.ts`
- `apps/api-gateway/src/routes/v2/finance/finance-routes.test.ts`
- `apps/api-gateway/src/routes/v2/orders/orders-routes.test.ts`
- `apps/api-gateway/src/routes/v2/partner/event-catalog.test.ts`
- `apps/api-gateway/src/routes/v2/rsvp/rsvp-routes.test.ts`
- `apps/api-gateway/src/routes/v2/tickets/ticket-routes.test.ts`
- `apps/api-gateway/src/routes/v2/wallet/wallet-routes.test.ts`

## Other affected legacy test files

- `apps/api-gateway/src/routes/v2/finance/leaderboard-routes.test.ts`
- `apps/api-gateway/src/routes/v2/notifications/notifications-routes.test.ts`
- `apps/api-gateway/src/routes/v2/partner/analytics.test.ts`
- `apps/api-gateway/src/routes/v2/partner/discover.test.ts`
- `apps/api-gateway/src/routes/v2/partner/idempotency.test.ts`
- `apps/api-gateway/src/routes/v2/partner/partnerships.test.ts`
- `apps/api-gateway/src/routes/v2/partner/promoter-connections.test.ts`
- `apps/api-gateway/src/routes/v2/partner/referral-links.test.ts`
