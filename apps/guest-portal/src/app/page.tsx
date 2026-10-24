import Image from 'next/image';
import Link from 'next/link';

import { loadExploreEvents } from '@/features/explore/explore-data';
import { HomeBrowseByVenue } from '@/features/home/components/HomeBrowseByVenue';
import { HomeBackgroundVideoClient } from '@/features/home/components/HomeBackgroundVideoClient';
import { HomeEventCategories } from '@/features/home/components/HomeEventCategories';
import { HomeFeaturedEvents } from '@/features/home/components/HomeFeaturedEvents';
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

export const revalidate = 300;

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
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -inset-[6%]">
          <Image
            src={homeFixture.hero.desktopPosterSrc}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="size-full scale-[1.08] object-cover blur-[20px] brightness-[0.42] saturate-[1.12] sm:blur-[36px]"
          />
        </div>
        <div className="absolute -inset-[6%] overflow-hidden opacity-30 blur-[16px] sm:blur-[30px]">
          <HomeBackgroundVideoClient
            desktopSrc={homeFixture.hero.ambientDesktopVideoSrc}
            mobileSrc={homeFixture.hero.ambientMobileVideoSrc}
          />
        </div>
        <div className="absolute inset-0 bg-black/35" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,transparent_0%,rgba(0,0,0,0.18)_72%,rgba(0,0,0,0.38)_100%)]" />
      </div>

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
      </div>
    </div>
  );
}

function HomeDiscoveryState({ title, description }: { title: string; description: string }) {
  return (
    <section
      aria-labelledby="home-discovery-state-heading"
      className="relative mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
        <h2
          id="home-discovery-state-heading"
          className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-5xl"
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
