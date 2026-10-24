import 'server-only';

import { createApiClient } from '@c1rcle/api-client';
import {
  discoveryFeedDtoSchema,
  publicTicketTierListResponseSchema,
  venueDtoSchema,
} from '@c1rcle/contracts';

import { toExploreEvent } from './explore-mapping';

import type { ExploreEvent } from './types/explore.types';
import type { VenueDto } from '@c1rcle/contracts';

/** The discovery endpoint is intentionally bounded by the backend aggregate. */
export async function loadExploreEvents(): Promise<ExploreEvent[]> {
  const client = createApiClient({ maxRetries: 1, timeoutMs: 5_000 });
  const feed = await client.get({
    path: '/api/v2/public/discovery',
    schema: discoveryFeedDtoSchema,
  });
  const venueCache = new Map<string, ReturnType<typeof loadVenue>>();

  function loadVenue(venueId: string) {
    return client
      .get({ path: `/api/v2/public/venues/by-id/${venueId}`, schema: venueDtoSchema })
      .catch(() => null);
  }

  return Promise.all(
    feed.items.map(async (event) => {
      let venuePromise: Promise<VenueDto | null> = Promise.resolve(null);
      if (event.venueId) {
        const cached = venueCache.get(event.venueId);
        venuePromise = cached ?? loadVenue(event.venueId);
        venueCache.set(event.venueId, venuePromise);
      }
      const [venue, tiers] = await Promise.all([
        venuePromise,
        client
          .get({
            path: `/api/v2/public/events/${encodeURIComponent(event.slug)}/tiers`,
            schema: publicTicketTierListResponseSchema,
          })
          .then((result) => result.items)
          .catch(() => null),
      ]);
      return toExploreEvent(event, venue, tiers);
    }),
  );
}
