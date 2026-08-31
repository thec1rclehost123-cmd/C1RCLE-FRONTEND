import { ExploreDiscoveryClient } from '@/features/explore/components/ExploreDiscoveryClient';
import { ExploreHeroCarouselClient } from '@/features/explore/components/ExploreHeroCarouselClient';
import { getExploreRepository } from '@/features/explore/lib';

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

export default async function ExplorePage() {
  const { cities, events, featuredEvents } = await getExploreRepository().getExploreData();

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip pb-24 text-white md:pb-0">
      <section aria-label="Featured events">
        <ExploreHeroCarouselClient events={featuredEvents} />
      </section>

      <ExploreDiscoveryClient events={events} cities={cities} />
    </div>
  );
}
