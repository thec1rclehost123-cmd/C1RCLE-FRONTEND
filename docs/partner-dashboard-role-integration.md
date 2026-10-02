# Partner Dashboard role integration

> **Status as of 2026-10-02:** `partnerRepositories` in `src/lib/partner/repositories.ts` is still bound to the fixture host/promoter repositories. `api-partner-repositories.ts` exists and is tested but is not the live binding, and the `/api/v1/partner/*` paths listed under "API adapter" are the adapter's expected shape, not backend routes: the gateway serves `/api/v2` (see `docs/superpowers/FRONTEND-GATEWAY-BACKEND-MAP.md` s10 and the backend route catalog). Remap them to v2 routes when wiring.

## Shared shell

All partner roles use `PartnerDashboardLayout` with role configuration from `PARTNER_SHELL_CONFIG`.

- Venue: create-event workflow, events, partners, marketing and finance.
- Host: the complete Host workspace uses the shared shell and role-specific repository contracts. Do not duplicate the shell or couple Host pages to Venue's legacy store.
- Promoter: linked/discover events, partners, private finance and tracked links. The primary action is `Get link`, not `Create event`, and there is no Marketing tab.

## Data boundary

Page components depend on repository interfaces in `src/lib/partner/contracts.ts`. Fixture repositories are temporary frontend adapters. Backend integration should replace adapters, not page contracts.

The Venue/Host-facing promoter profile must use `PromoterNetworkProfileData`. It intentionally contains:

- tickets moved;
- tracked conversion;
- events promoted;
- audience reach;
- repeat partners;
- response time;
- recent collaborator summaries.

It must never contain revenue, earnings, commission, payout, bank, or settlement fields. Promoter finance remains private under `/promoter/finance`.

## Host workspace

The Host route set is now complete under `/host/*` and uses the shared shell, shared DTOs and `HostRepository`. Host page content remains isolated from Venue's legacy store. The integration boundary is the `partnerRepositories.host` composition root; backend integration should replace that binding rather than changing page components.

## Promoter correction

There is intentionally no Guest Portal promoter profile. `/partner-network/promoters/[promoterId]` is a protected Partner Dashboard decision profile for verified Venue and Host users. It contains tickets moved, conversion, events promoted, reach, repeat partners, response time and collaborator history. It excludes gross revenue, earnings, commission, payout, bank and settlement information.

## API adapter

`createApiPartnerRepositories` documents and implements the gateway endpoint map. It requires runtime decoders, so an unvalidated API payload cannot silently enter UI components. The backend integration supplies Zod decoders and a `PartnerApiTransport` backed by `@c1rcle/api-client`, then replaces the fixture bindings in `repositories.ts`.

Expected endpoints:

- `GET /api/v1/partner/organizations`
- `GET /api/v1/partner/host/overview`
- `GET /api/v1/partner/host/events`
- `GET /api/v1/partner/host/partners`
- `GET /api/v1/partner/host/finance`
- `GET /api/v1/partner/host/profile`
- `GET /api/v1/partner/events/:eventId`
- `GET /api/v1/partner/events/:eventId/analytics`
- `GET /api/v1/partner/promoter/overview`
- `GET /api/v1/partner/promoter/events`
- `GET /api/v1/partner/promoter/events/discover`
- `GET /api/v1/partner/promoter/partners`
- `GET /api/v1/partner/promoter/finance`
- `GET /api/v1/partner/promoter/links`
- `POST /api/v1/partner/promoter/links`
- `GET /api/v1/partner/promoter/profile`
- `GET /api/v1/partner/promoter/network-profile`

Pages never access Firebase or Firestore directly. Authentication and partner switching stay behind the dashboard gateway routes.

## Mutation safety

Create Event, event access, partnership requests, payout actions and tracking-link creation currently expose explicit preview/prepared states. They do not claim a live mutation succeeded. The API layer must own authorization, idempotency, attribution, inventory, finance and duplicate prevention.
