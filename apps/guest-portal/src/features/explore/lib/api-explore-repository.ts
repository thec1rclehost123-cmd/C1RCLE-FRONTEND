import { paginatedSchema } from '@c1rcle/api-client';
import { z } from 'zod';

import type { ExploreCity, ExploreEvent } from '../types/explore.types';
import type { ExploreData, ExploreRepository } from './contracts';
import type { ApiClient } from '@c1rcle/api-client';

/**
 * ─── Real event-listing repository — NOT the active default ──────────────
 *
 * Investigated 2026-08-23 against the live V2 gateway (`localhost:8080`,
 * `STORAGE_DRIVER=memory`) and against `C1RCLE-BACKEND`'s own registration
 * surface:
 *
 *   - `apps/api-gateway/src/routes/v2/route-manifest.ts` — the single place
 *     all `/api/v2` routes are registered — has no `public/` route file and
 *     registers nothing under `/public/*`.
 *   - `curl http://localhost:8080/api/v2/public/events` (and
 *     `/public/discovery`, `/checkout/quote`) all 404 live: `{"code":
 *     "not_found", "message": "Route GET /api/v2/public/events not found"}`.
 *   - `docs/roadmap/phase-04-guest-checkout-tickets.md` and `ROADMAP.md`
 *     claim "Public Discovery Routes ✅" / "done" for Phase 4 — that claim
 *     does not match the registered routes or the live server. A
 *     `CheckoutService` exists at the application layer
 *     (`packages/core/src/application/checkout/checkout-service.ts`) and is
 *     wired into `v2-services.ts`, but no HTTP route file (`checkout.ts`,
 *     `orders.ts`, `tickets.ts`, `public/*.ts`) exists anywhere under
 *     `apps/api-gateway/src/routes/`.
 *   - Even at the domain layer, `EventService.list()` is hard-scoped to one
 *     organization (`this.repo.listByOrganization(actor.organizationId,
 *     query)` — `packages/core/src/application/events/event-service.ts`).
 *     There is no cross-organization "list all published events" capability
 *     to call even bypassing HTTP — building real guest discovery needs new
 *     backend work, not just a route registration.
 *
 * The ONE real, working, unauthenticated-by-shape event read is
 * `GET /api/v2/events/:eventId/previews` — a single event by id, not a
 * list. It cannot power a browse/search page.
 *
 * So: this repository calls the only *list* capability that actually
 * exists — `GET /api/v2/organizations/:organizationId/events` — which is
 * partner-side and org-scoped (requires `x-organization-id`, requires
 * `event.read`, and on the memory driver the header alone fabricates a
 * full-access dev actor for that org — see `actorFromRequest` in
 * `apps/api-gateway/src/lib/v2-services.ts`). Using it here is a *verified,
 * working stopgap for a single known organization*, not a legitimate guest
 * discovery integration: a real guest browser has no organization id and
 * should never need one, and this repository will only ever return that one
 * organization's events. `getExploreRepository()` in `./index.ts`
 * deliberately does NOT return this implementation by default — see that
 * file's comment. Swap it in only for manual verification against a seeded
 * organization.
 */

const remoteEventSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  venueId: z.string().nullable(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  startAt: z.string(),
  endAt: z.string().nullable(),
  status: z.string(),
  isPublic: z.boolean(),
  tags: z.array(z.string()),
  startingPricePaise: z.number().nullable(),
  isFree: z.boolean(),
  cancellationReason: z.string().nullable(),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const remoteEventListSchema = paginatedSchema(remoteEventSchema);

export type RemoteEvent = z.infer<typeof remoteEventSchema>;

const FALLBACK_IMAGE = '/c1rcle-logo.webp';

/**
 * Maps the gateway's `eventToDto()` wire shape (see
 * `apps/api-gateway/src/routes/v2/partner/events.ts`) to the UI's
 * `ExploreEvent`. Two fields are genuinely lossy because the source DTO
 * does not carry them at all:
 *
 *   - `venue`: the event DTO only has `venueId`, never a venue name. A
 *     public venue-name lookup would need its own guest-safe endpoint,
 *     which also does not exist (`venues.ts`'s profile route is
 *     owner-scoped, not public).
 *   - `city` / `cityKey`: same gap — city lives on the venue, not the
 *     event.
 *
 * Both fall back to empty/placeholder values below, called out explicitly
 * rather than silently guessed.
 */
export function decodeExploreEvent(event: RemoteEvent): ExploreEvent {
  const price =
    event.isFree || event.startingPricePaise === null || event.startingPricePaise === 0
      ? null
      : { amountPaise: event.startingPricePaise, currency: 'INR' as const };

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    category: event.tags[0] ?? 'Event',
    image: event.imageUrl ?? FALLBACK_IMAGE,
    startsAt: event.startAt,
    // Known gap — see doc comment above.
    venue: event.venueId ?? 'Venue TBA',
    city: '',
    cityKey: '',
    price,
  };
}

const ALL_CITIES: ExploreCity = { label: 'All Cities', value: '' };

export interface ApiExploreRepositoryOptions {
  readonly client: ApiClient;
  /**
   * The single organization this stopgap can see. Required because the
   * backend has no cross-organization discovery capability (see file-level
   * comment) — a real guest-portal deployment must never need this.
   */
  readonly organizationId: string;
}

export function createApiExploreRepository(options: ApiExploreRepositoryOptions): ExploreRepository {
  return {
    async getExploreData(): Promise<ExploreData> {
      const page = await options.client.get({
        path: `/api/v2/organizations/${encodeURIComponent(options.organizationId)}/events`,
        headers: { 'x-organization-id': options.organizationId },
        schema: remoteEventListSchema,
      });

      const events = page.items.filter((event) => event.isPublic).map(decodeExploreEvent);

      return {
        cities: [ALL_CITIES],
        events,
        featuredEvents: events.slice(0, 3),
      };
    },
  };
}
