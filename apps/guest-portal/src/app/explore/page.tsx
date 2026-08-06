import { ExploreDiscoveryClient } from '@/features/explore/components/ExploreDiscoveryClient';
import { ExploreHeroCarouselClient } from '@/features/explore/components/ExploreHeroCarouselClient';
import { exploreFixture } from '@/features/explore/fixtures/explore.fixture';

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

export default function ExplorePage() {
  return (
    <div className="relative z-10 min-h-screen overflow-x-clip pb-24 pt-24 text-white md:pb-0 md:pt-28">
      <section aria-label="Featured events" className="px-4 sm:px-6 lg:px-8">
        <ExploreHeroCarouselClient events={exploreFixture.featuredEvents} />
      </section>

      <ExploreDiscoveryClient events={exploreFixture.events} cities={exploreFixture.cities} />
    </div>
  );
}
