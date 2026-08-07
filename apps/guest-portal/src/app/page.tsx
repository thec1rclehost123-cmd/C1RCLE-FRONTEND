import { HomeAppReview } from '@/features/home/components/HomeAppReview';
import { HomeFeaturedDropsClient } from '@/features/home/components/HomeFeaturedDropsClient';
import { HomeHero } from '@/features/home/components/HomeHero';
import { HomePhoneStoryClient } from '@/features/home/components/HomePhoneStoryClient';
import { homeFixture } from '@/features/home/fixtures/home.fixture';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'THE C1RCLE | Discover Life Offline' },
  description: 'Discover C1RCLE events, venues, hosts, popups, and curated nightlife experiences.',
  alternates: { canonical: 'https://thec1rcle.com/' },
  openGraph: {
    title: 'THE C1RCLE | Discover Life Offline',
    description: 'Discover the city after dark with THE C1RCLE.',
    url: 'https://thec1rcle.com/',
  },
  twitter: {
    title: 'THE C1RCLE | Discover Life Offline',
    description: 'Discover the city after dark with THE C1RCLE.',
  },
};

export default function HomePage() {
  return (
    <div className="relative z-10 bg-black text-white">
      <HomeHero hero={homeFixture.hero} />
      <HomeFeaturedDropsClient content={homeFixture.drops} />
      <HomePhoneStoryClient />
      <HomeAppReview />
    </div>
  );
}
