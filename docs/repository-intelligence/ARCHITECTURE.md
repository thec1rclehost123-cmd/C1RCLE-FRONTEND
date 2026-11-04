# Architecture

## Current

A multi-app Next.js frontend uses BFF routes, shared contract schemas, auth/session providers, feature modules, fixture/live data sources, and shared UI packages.

## Authoritative boundaries

- Backend services and persistence are authoritative for money, entitlements, authorization decisions, and durable event/order state.
- Shared contracts are the compatibility boundary consumed by both repositories.
- Frontend route/UI state is not proof of backend persistence or provider behavior.
- Fixture sources are presentation/test evidence only until live callers are proven.

## Drift and target

Observed drift risk is strongest where UI states, fixture sources, shared contracts, and backend routes evolve in the same dirty working tree. The target architecture is contract-first, backend-authoritative, with explicit live/fixture/unavailable labels and staging evidence for each critical domain.

## Verified execution evidence

- Root scripts delegate build, lint, typecheck, test, and boundary checks to Turbo (package.json:10-24; turbo.json:26-60).
- Guest server-rendered event and checkout pages use @c1rcle/api-client and shared response contracts (apps/guest-portal/src/app/event/[eventId]/page.tsx:19-43; apps/guest-portal/src/app/checkout/[id]/page.tsx:20-64).
- Browser writes pass through same-origin BFF handling with session, CSRF, prototype-key, and idempotency checks (apps/guest-portal/src/lib/bff/proxy-write.ts:16-75).
- Partner overview performs eight parallel backend reads and does not silently fall back to fixtures (apps/partner-dashboard/src/lib/overview/load-overview-data.ts:32-59,112-187).
- Legacy partner repositories still call /api/v1/partner/... and contain Not implemented operations (apps/partner-dashboard/src/lib/partner/api-partner-repositories.ts:107-156). The backend manifest inspected in this audit registers V2 routes, so this is a concrete migration/dead-path risk.
