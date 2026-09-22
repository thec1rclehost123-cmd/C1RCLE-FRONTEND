import { createApiClient } from '@c1rcle/api-client';
import { discoveryFeedDtoSchema, venueDtoSchema } from '@c1rcle/contracts';

import { ExploreDiscoveryClient } from '@/features/explore/components/ExploreDiscoveryClient';
import { ExploreHeroCarouselClient } from '@/features/explore/components/ExploreHeroCarouselClient';
import { deriveCities, toExploreEvent } from '@/features/explore/explore-mapping';

import type { ExploreEvent } from '@/features/explore/types/explore.types';
import type { EventDto } from '@c1rcle/contracts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore Events | THE C1RCLE',
  description:
    'Explore public C1RCLE events, venues, popups, campus nights, and nightlife experiences.',
  alternates: { canonical: 'https://thec1rcle.com/explore' },
  openGraph: {
    title: 'THE C1RCLE | Explore Events',
    description: 'Discover the hottest events, parties, and gatherings in your city on THE C1RCLE.',
    url: 'https://thec1rcle.com/explore',
  },
  twitter: {
    title: 'THE C1RCLE | Explore Events',
    description: 'Discover the hottest events, parties, and gatherings in your city on THE C1RCLE.',
  },
};

/**
 * Real published events only — the gateway's `PublicService` (via `isPublic`)
 * excludes drafts, review, scheduled, ended, archived, and cancelled events,
 * so no dummy content can reach this page. On any API failure we render the
 * typed empty state downstream, never a fixture fallback.
 */
async function getExploreEvents(): Promise<ExploreEvent[]> {
  const client = createApiClient();

  let items: EventDto[];
  try {
    const feed = await client.get({ path: '/api/v2/public/discovery', schema: discoveryFeedDtoSchema });
    items = feed.items;
  } catch {
    return [];
  }

  const venueIds = [...new Set(items.map((item) => item.venueId).filter((id): id is string => id !== null))];
  const venues = await Promise.all(
    venueIds.map((venueId) =>
      client
        .get({ path: `/api/v2/public/venues/by-id/${venueId}`, schema: venueDtoSchema })
        .catch(() => null),
    ),
  );
  const venuesById = new Map(venues.filter((venue) => venue !== null).map((venue) => [venue.id, venue]));

  return items.map((item) =>
    toExploreEvent(item, item.venueId ? (venuesById.get(item.venueId) ?? null) : null),
  );
}

export default async function ExplorePage() {
  const events = await getExploreEvents();

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip pb-24 text-white md:pb-0">
      <section aria-label="Featured events">
        <ExploreHeroCarouselClient events={events.slice(0, 3)} />
      </section>

      <ExploreDiscoveryClient events={events} cities={deriveCities(events)} />
    </div>
  );
}
