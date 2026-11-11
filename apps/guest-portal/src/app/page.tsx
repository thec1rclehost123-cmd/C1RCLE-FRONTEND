import Link from 'next/link';

import { loadExploreEvents } from '@/features/explore/explore-data';
import { HomeBrowseByVenue } from '@/features/home/components/HomeBrowseByVenue';
import { HomeEventCategories } from '@/features/home/components/HomeEventCategories';
import { HomeFeaturedEvents } from '@/features/home/components/HomeFeaturedEvents';
import { HomeGetApp } from '@/features/home/components/HomeGetApp';
import { HomeHero } from '@/features/home/components/HomeHero';
import { PhotoStringGallery } from '@/features/home/components/PhotoStringGallery';
import { homeFixture } from '@/features/home/fixtures/home.fixture';
import { JsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { absoluteUrl } from '@/lib/seo/site';

import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return buildPublicMetadata({
    path: '/',
    title: 'THE C1RCLE | Discover Life Offline',
    description:
      'Discover C1RCLE events, venues, hosts, popups, and curated nightlife experiences.',
  });
}

// Public visibility can change immediately when a Host makes an event private.
// Render the listing from the current authoritative discovery response.
export const revalidate = 0;

export default async function HomePage() {
  const discovery = await loadExploreEvents().then(
    (events) => ({ kind: 'ready' as const, events }),
    () => ({ kind: 'unavailable' as const, events: [] }),
  );
  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'THE C1RCLE',
    url: absoluteUrl('/'),
    logo: absoluteUrl('/c1rcle-logo.webp'),
  };
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'THE C1RCLE',
    url: absoluteUrl('/'),
  };

  return (
    <div className="relative isolate overflow-x-clip bg-black text-white">
      <div className="relative z-10">
        <JsonLd data={[organization, website]} />
        <HomeHero hero={homeFixture.hero} />
        {discovery.kind === 'unavailable' ? (
          <HomeDiscoveryState
            title="Events temporarily unavailable"
            description="We could not load the current event feed. Explore again in a moment."
          />
        ) : discovery.events.length === 0 ? (
          <HomeDiscoveryState
            title="Nothing published yet"
            description="New public events will appear here as soon as hosts publish them."
          />
        ) : (
          <HomeFeaturedEvents content={homeFixture.featured} events={discovery.events} />
        )}
        {discovery.kind === 'ready' && discovery.events.length > 0 ? (
          <HomeBrowseByVenue events={discovery.events} />
        ) : null}
        {discovery.kind === 'ready' && discovery.events.length > 0 ? (
          <HomeEventCategories events={discovery.events} />
        ) : null}
        <PhotoStringGallery />
        <HomeGetApp />
      </div>
    </div>
  );
}

function HomeDiscoveryState({ title, description }: { title: string; description: string }) {
  return (
    <section
      aria-labelledby="home-discovery-state-heading"
      className="relative mx-auto max-w-[1280px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="border-t border-white/10 py-10 text-center">
        <h2
          id="home-discovery-state-heading"
          className="text-2xl font-bold tracking-tight sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/60">{description}</p>
        <Link
          href="/explore"
          className="mt-7 inline-flex min-h-11 items-center rounded-full bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.2em] text-black"
        >
          Explore events
        </Link>
      </div>
    </section>
  );
}
