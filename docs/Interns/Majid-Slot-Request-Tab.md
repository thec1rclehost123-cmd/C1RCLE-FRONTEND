# Majid - Slot Request Tab

## Overview

The **Slot Requests** tab on the Host & Venue dashboards now runs end-to-end against the live stack: a host creates an event, picks a venue and time, and hits **Submit for approval**; the request lands in the venue's **Pending** list; the venue **Accepts** or **Declines** (and the host can **Cancel** an accepted request). Both sides' pending/approved/rejected/cancelled lists update from live data, and both parties get status-derived notifications. All hardcoded/fixture data has been removed from the slot-request pages; every call follows **Frontend → BFF → API Gateway → Backend**.

**Added by:** Majid
**Date:** 2026-09-23

---

## End-to-end flow

1. **Host creates an event** in the event editor (draft: name, poster, date, time, genres, artists, target venue).
2. **Submit for approval** (`venue-event-repository.submitHostEventRequest`) resolves the poster URL client-side, then POSTs to the app's own BFF (`/api/bff/slot-requests`), which creates the **event** and the **slot request** against the gateway — each write with its own minted `Idempotency-Key` so retries cannot double-create.
3. The request shows up as `pending` in:
   - **Venue studio** incoming list (`/partner/venue/slot-requests?direction=incoming`)
   - **Host studio** outgoing list (`/partner/host/slot-requests?direction=outgoing`)
4. **Venue accepts/declines** via the request review card; **host cancels** an accepted request (outgoing, status `approved` only).
5. Backend domain rules enforce the state machine; illegal transitions return `409 conflict`.
6. Both studios' lists refetch live data after each action; the topbar notification strip updates from real request statuses.

---

## Domain state machine (backend-owned)

```
pending  → accepted | rejected
accepted → cancelled
rejected, cancelled → (no transitions)
```

- `pending → cancelled` is **not** legal (409) — the FE therefore shows Cancel only for outgoing `approved` requests.
- Wire statuses: `pending | accepted | rejected | cancelled`.
- UI mapping: `accepted → approved` (status badges/cards render `approved`); `pending | rejected | cancelled` pass through.

---

## Files Created / Modified

### Backend (`D:\C1RCLE-BACKEND`)

| File | Change |
|------|--------|
| `packages/core/src/application/venues/venue-service.ts` | Added `listForHost` (host org's outgoing requests) and `getDetailForVenue` (venue-owner detail incl. host actor + event) to the venue slot-request service; added `cancel` (host withdraws its own accepted request) |
| `packages/core/src/domain/ports/repositories.ts` | Added the list/cancel port methods to the slot-request repository contract |
| `packages/core/src/infrastructure/memory/memory-repositories.ts` | In-memory implementations of the new list/cancel methods |
| `packages/core/src/infrastructure/firestore/firestore-slot-request-repository.ts` | Firestore implementations of the new list/cancel methods |
| `apps/api-gateway/src/routes/v2/partner/venues.ts` | New routes: host org list, venue-owner detail, host cancel (below) |
| `apps/api-gateway/src/routes/v2/partner/venues.test.ts` | Tests for host list scoping (foreign org 403/404 behaviour), venue-owner detail, accept/reject/cancel transitions incl. the `pending → cancel` 409 |
| `apps/api-gateway/src/plugins/rbac.ts` | Added `slot-request.list` / `slot-request.create` permissions (and cancel wiring) |
| `apps/api-gateway/src/plugins/rbac.test.ts` | Coverage for the new permissions |
| `packages/contracts/src/contracts/organization.ts` | Added `slotRequestListResponseSchema` (paginated `SlotRequestDto`), `slotRequestActorSchema`, `slotRequestDetailDtoSchema` |
| `packages/contracts/src/index.ts`, `client.ts` | Export the new schemas/types |

Pre-existing dirty files on the branch (`render.yaml`, `.env.example`, `docs/architecture/decisions.md`) were not part of this work.

### Frontend BFF (`apps/partner-dashboard`)

| File | Purpose |
|------|---------|
| `src/lib/bff/slot-request-gateway.ts` **(new)** | Server-only gateway composer: `loadSlotRequestsData(direction, orgId, ctx)` (venue: per-venue lists + per-request detail enrichment; host: org list + event/venue enrichment, 404-tolerant), `acceptSlotRequest` / `rejectSlotRequest` / `cancelSlotRequest`, `submitHostSlotRequest` (event create + slot-request create, per-write `Idempotency-Key`), `loadSlotRequestNotifications` (derived notifications, below), wire→UI mapping (`accepted → approved`) |
| `src/app/api/bff/slot-requests/route.ts` **(new)** | `GET` list (`?direction=incoming\|outgoing&organizationId=…`), `POST` submit-for-approval (`{ draft }`, CSRF required) |
| `src/lib/bff/slot-request-action.ts` **(new)** | Shared `applySlotRequestAction` (same-origin + CSRF + org query → gateway envelope passthrough) |
| `src/app/api/bff/slot-requests/[id]/accept/route.ts` **(new)** | Venue accepts |
| `src/app/api/bff/slot-requests/[id]/reject/route.ts` **(new)** | Venue declines |
| `src/app/api/bff/slot-requests/[id]/cancel/route.ts` **(new)** | Host cancels an accepted request |
| `src/app/api/bff/notifications/route.ts` **(new)** | `GET` derived notification strip (`?direction=…&organizationId=…`) |
| `src/lib/slot-requests/slot-request-repository.ts` **(new)** | Client gateway: `loadSlotRequestsData`, `applySlotRequestAction`, `submitHostSlotRequest`, `loadSlotRequestNotifications` — all `bffClient` + `csrfHeaders()`, zod-validated responses, `getActiveOrgId()` for org scoping |
| `src/lib/events/event-time.ts` **(new)** | Shared pure `eventStartAtFromDraft` / `eventEndAtFromDraft` (re-exported by `venue-event-repository`) |

### Frontend UI (`apps/partner-dashboard`)

| File | Change |
|------|--------|
| `src/app/partner/[studio]/slot-requests/page.tsx` | SSR shell only — passes `direction` (`incoming` for venue, `outgoing` for host) + query params; **no fixture fetch** |
| `src/components/partner-v3/slot-requests/SlotRequestScreen.tsx` | Client-side live load (`useCallback` + effect with promise callbacks to satisfy `react-hooks/set-state-in-effect`), loading/error/refresh states, `busyRequestId`, structured `actionError {id, message}`; mutations refetch after success |
| `src/components/partner-v3/slot-requests/SlotRequestCard.tsx` | Live actions: Accept/Decline on pending incoming, Cancel on approved outgoing (inline action error) |
| `src/components/partner-v3/slot-requests/SlotRequestReview.tsx` | Same action set on the detail review pane; optional event sections hidden when data absent (GAPs: ticket tiers/pricing/tables/codes/artists/promoters are catalog reads out of this slice) |
| `src/components/partner-v3/slot-requests/SlotRequestSummary.tsx` | Added the fourth **Cancelled** summary card (4-column grid) |
| `src/components/partner-v3/slot-requests/SlotRequestStatusBadge.tsx` | Added `cancelled` badge |
| `src/components/partner-v3/slot-requests/slot-requests.module.css` | `.summaryGrid` 4 columns, `.summaryCancelled`, `.statusCancelled`, `.actionError` |
| `src/data/partner-data-source.ts` | `SlotRequestStatus` + `cancelled`; `SlotRequestActionKind = 'accept'\|'reject'\|'cancel'`; optional event fields typed `\| undefined` (exactOptionalPropertyTypes); `SlotRequestsData.dataStatus: 'fixture'\|'live'`; `PartnerNotification.href` tolerant of `\| undefined` |
| `src/lib/events/venue-event-repository.ts` | `submitHostEventRequest` now resolves the poster URL client-side then submits via the BFF; re-exports `event-time` helpers; removed direct gateway `createSlotRequestSchema` / `slotRequestDtoSchema` usage (server-bound only) |
| `src/components/partner-v3/PartnerShell.tsx` | Passes `notificationDirection` derived from `config.role` (venue → `incoming`, host → `outgoing`, promoter → none) to the topbar |
| `src/components/partner-v3/PartnerTopbar.tsx` | Forwards `notificationDirection` to the notifications dropdown |
| `src/components/partner-v3/PartnerNotifications.tsx` | Fetches live derived notifications on mount (when a direction is present) and renders them **ahead of** the fixture list; fetch failures fall back to fixtures untouched |
| `src/components/partner-v3/slot-requests/SlotRequestScreen.test.tsx` | Rewritten to mock `@/lib/slot-requests/slot-request-repository` (fixture-backed `loadSlotRequestsData`, `vi.hoisted` action spy) |

### Docs

| File | Purpose |
|------|---------|
| `docs/Interns/Majid-Slot-Request-Tab.md` | This documentation file |

---

## Architecture enforced

```
React component (client)
  → src/lib/slot-requests/slot-request-repository.ts   (bffClient, CSRF on writes, zod)
    → /api/bff/slot-requests/** and /api/bff/notifications  (Next.js route handlers:
         same-origin assert, CSRF double-submit, gateway cookie + x-organization-id forward)
      → API Gateway (/api/v2/…)                          (RBAC + idempotency)
        → Backend services (domain state machine)
```

- **No component talks to the gateway directly**; the only gateway-aware code is the server-only `slot-request-gateway.ts`.
- The page is an SSR shell with zero fixture reads; the screen hydrates live data client-side with explicit loading/error states.
- The BFF always forwards `x-organization-id` and scopes list queries by organization (host org list vs. venue's own venues); writes carry a minted `Idempotency-Key`.

---

## Endpoints

### BFF (app-owned, session-cookie auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/bff/slot-requests?direction=incoming\|outgoing&organizationId=…` | Live list (enriched) |
| POST | `/api/bff/slot-requests` | Host submit-for-approval: creates event + slot request (`{ draft }`, CSRF) |
| POST | `/api/bff/slot-requests/:id/accept` | Venue accepts (CSRF) |
| POST | `/api/bff/slot-requests/:id/reject` | Venue declines (CSRF) |
| POST | `/api/bff/slot-requests/:id/cancel` | Host cancels accepted (CSRF) |
| GET | `/api/bff/notifications?direction=…&organizationId=…` | Status-derived notification strip |

### API Gateway (backend, behind the BFF)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v2/organizations/:organizationId/slot-requests` | Host org's outgoing requests (`listForHost`) |
| GET | `/api/v2/venues/:venueId/slot-requests/:slotRequestId` | Venue-owner detail incl. host actor + event (`getDetailForVenue`) |
| GET | `/api/v2/venues/:venueId/slot-requests` | Venue's incoming requests (pre-existing) |
| POST | `/api/v2/venues/:venueId/slot-requests` | Create request (pre-existing) |
| POST | `/api/v2/venues/slot-requests/:slotRequestId/accept\|reject` | Venue decision (pre-existing) |
| POST | `/api/v2/venues/slot-requests/:slotRequestId/cancel` | Host withdraw — **new** (`venue.slotRequest.cancel`) |

RBAC permissions added: `slot-request.list`, `slot-request.create` (+ cancel authorization).

---

## Notifications (derived, no guessed Phase-8 contract)

There is no notification contract yet (Phase 8 not started), so the strip is **derived from real slot-request statuses** via `GET /api/bff/notifications`:

| Studio | Direction | Derived entries |
|--------|-----------|-----------------|
| Venue | `incoming` | `pending` requests → “New slot request from {host}” → links to `/partner/venue/slot-requests?request={id}` |
| Host | `outgoing` | `approved` → “Slot request accepted by {venue}”; `rejected` → “Slot request declined by {venue}” → link to `/partner/host/slot-requests?request={id}` |

Entries are typed as `type: 'request'`, `icon: 'request'`, `unread: true`, with a relative `time` (`5m` / `3h` / `2d`) from `createdAt`. `PartnerNotifications` fetches them on mount and **prefixes** them ahead of the existing fixture list; a failed fetch leaves the fixture list untouched (graceful degradation — the broader notification system remains fixture-based until Phase 8).

---

## Known GAPs (honest, never invented)

- **Ticket tiers, pricing, tables, codes, artists, promoters** are catalog reads outside this slice: the FE `SlotRequestEvent` type carries these fields as **optional**, and the review card renders the sections only when data is present.
- The broader **notification system** (payout/operations/marketing entries, read-state persistence) is still fixture-driven; only slot-request statuses are live-derived. A real Phase-8 notification contract will replace both the derivation and the fixture list.
- Fixture slot-request data still exists in `fixture-partner-data-source.ts` but is used **only by tests** — the page no longer touches it.

---

## Verification

### Backend (`D:\C1RCLE-BACKEND`) — all green

| Command | Result |
|---------|--------|
| `pnpm --filter @c1rcle/contracts typecheck` (workspace `pnpm typecheck`) | pass |
| `pnpm --filter core test` (43 venue tests) | pass |
| `pnpm --filter api-gateway test` (339 tests, incl. new list/detail/cancel cases) | pass |
| `pnpm --filter api-gateway lint` / boundaries / contract-parity | pass |

### Frontend (`D:\C1RCLE-FRONTEND\apps\partner-dashboard`)

| Command | Result |
|---------|--------|
| `pnpm exec tsc -p tsconfig.json --noEmit` | clean |
| `pnpm exec eslint` (all touched files) | clean |
| `pnpm exec vitest run` (full suite) | 91/92 files pass — **2 pre-existing failures** in `src/lib/access/use-org-access.test.ts` (module-level cache in `org-access-cache.ts` survives between tests in that file; unrelated to this work) |
| Targeted: `SlotRequestScreen.test.tsx`, `PartnerShell.test.tsx`, `PartnerGlobalInteractions.test.tsx` | 7/7 pass |
| `pnpm exec vitest run` event-editor + events suites | 31 pass |

After contract changes, `@c1rcle/contracts` and `@c1rcle/api-client` were rebuilt (`pnpm --filter … build`) — the apps resolve them from `dist`, and stale dist caused the initial `SlotRequestDetailDto` / `compensation` / `onTiming` typecheck errors.

---

## Reference

- Design/plan: `docs/superpowers/FRONTEND-GATEWAY-BACKEND-MAP.md` §5.2 (slot-request slice + BFF composition).
- Precedent for BFF route style: `src/app/api/bff/**` (auth-proxy: `assertSameOrigin`, `assertCsrf`, `stripProtoKeys`, `gatewayAuthInit`) and `src/lib/onboarding/csrf.ts` (`csrfHeaders()`).
- Sibling intern doc format: `docs/Interns/Majid-Presence-Tab.md`.
