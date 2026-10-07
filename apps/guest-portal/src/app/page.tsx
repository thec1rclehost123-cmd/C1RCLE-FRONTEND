import Link from 'next/link';

import { exploreFixture } from '@/features/explore/fixtures/explore.fixture';
import { HomeFeaturedDropsClient } from '@/features/home/components/HomeFeaturedDropsClient';
import { HomeFeaturedEvents } from '@/features/home/components/HomeFeaturedEvents';
import { HomeHero } from '@/features/home/components/HomeHero';
import { PhotoStringGallery } from '@/features/home/components/PhotoStringGallery';
import { homeFixture } from '@/features/home/fixtures/home.fixture';
import { JsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { getPublicEventsForSitemap } from '@/lib/seo/public-data';
import { absoluteUrl, isProductionSeo } from '@/lib/seo/site';

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
  const production = isProductionSeo();
  const authoritativeEvents = production ? await getPublicEventsForSitemap() : [];
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
    <div className="relative z-10 bg-black text-white">
      <JsonLd data={[organization, website]} />
      <HomeHero hero={homeFixture.hero} />
      {production ? (
        authoritativeEvents.length > 0 && (
          <section
            aria-labelledby="home-public-events-heading"
            className="relative mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:px-8"
          >
            <h2
              id="home-public-events-heading"
              className="text-4xl font-black uppercase tracking-[-0.055em] sm:text-6xl"
            >
              Upcoming events
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {authoritativeEvents.slice(0, 3).map((event) => (
                <article
                  key={event.id}
                  className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6"
                >
                  <h3 className="text-2xl font-black uppercase">{event.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/65">
                    {event.summary}
                  </p>
                  <Link
                    href={`/event/${event.slug}`}
                    className="mt-5 inline-flex text-xs font-black uppercase tracking-widest text-[#FF8060]"
                  >
                    View {event.title}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )
      ) : (
        <>
          <HomeFeaturedDropsClient content={homeFixture.drops} />
          <HomeFeaturedEvents content={homeFixture.featured} events={exploreFixture.events} />
        </>
      )}
      <PhotoStringGallery />
    </div>
  );
}
