import { ExploreDiscoveryClient } from '@/features/explore/components/ExploreDiscoveryClient';
import { ExploreHeroCarouselClient } from '@/features/explore/components/ExploreHeroCarouselClient';
import { loadExploreEvents } from '@/features/explore/explore-data';
import { deriveCities } from '@/features/explore/explore-mapping';

import type { ExploreFilters } from '@/features/explore/types/explore.types';
import type { Metadata } from 'next';

export const revalidate = 0;

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
 * route error boundary with retry, never a fixture fallback.
 */
interface ExplorePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const emptyQuery: Record<string, string | string[] | undefined> = {};
  const [events, query] = await Promise.all([
    loadExploreEvents(),
    searchParams ?? Promise.resolve(emptyQuery),
  ]);
  const date = first(query['date']);
  const sort = first(query['sort']);
  const initialFilters: ExploreFilters = {
    search: first(query['q']),
    city: first(query['city']),
    category: first(query['category']),
    date: date === 'today' || date === 'weekend' ? date : 'any',
    sort: sort === 'newest' || sort === 'price-low' ? sort : 'soonest',
  };

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip bg-transparent pb-24 text-white md:pb-0">
      <section aria-label="Featured events">
        <ExploreHeroCarouselClient events={events.slice(0, 3)} />
      </section>

      <ExploreDiscoveryClient
        events={events}
        cities={deriveCities(events)}
        initialFilters={initialFilters}
      />
    </div>
  );
}
