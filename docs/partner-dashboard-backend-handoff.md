# Partner Dashboard backend handoff

## Composition root

Frontend pages import `partnerRepositories` from `src/lib/partner/repositories.ts`. Replace the fixture bindings there with `createApiPartnerRepositories(...)` after supplying a `PartnerApiTransport` implemented by `@c1rcle/api-client` and runtime Zod decoders. The dashboard adapter intentionally contains no raw `fetch()` calls.

## Query states

Every endpoint adapter should map these states without changing page contracts:

- loading;
- loaded;
- empty;
- forbidden (403);
- not found (404);
- network error with retry;
- stale cached data;
- partial response.

## Mutation states

Mutation islands already model idle, confirmation, submitting, succeeded/prepared and failed/recovery states. Backend mutations must additionally provide idempotency keys and return authoritative resource IDs.

## Security and privacy

- Venue and Host analytics receive aggregates, never full raw guest records.
- Promoter recent orders contain time, event, ticket count, channel and status only.
- The Partner Network promoter profile excludes all finance and revenue fields.
- Finance endpoints require finance capability checks server-side.
- Organization switching must invalidate role-specific cache keys.
- No UI role or disabled button is an authorization boundary.

## Event contracts

`PartnerEventSummary`, `PartnerEventDetail`, `PartnerAnalyticsSummary` and `venueEventSchema` are the current frontend contracts. The backend should return normalized paise amounts, explicit status enums and server-generated timestamps. Charts expect aggregated series rather than raw orders.

## Required mutation endpoints

- create/update/publish Host and Venue event;
- request event access;
- request/accept/reject partnership;
- create/pause/expire tracking link;
- payout request and payout-account update;
- scanner validation, check-in, walk-in and incident recording.

Until those endpoints exist, the UI deliberately labels actions as prepared previews or keeps them disabled.
