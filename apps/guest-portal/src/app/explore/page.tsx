import Link from 'next/link';

import { ExploreDiscoveryClient } from '@/features/explore/components/ExploreDiscoveryClient';
import { ExploreHeroCarouselClient } from '@/features/explore/components/ExploreHeroCarouselClient';
import { exploreFixture } from '@/features/explore/fixtures/explore.fixture';
import { JsonLd } from '@/lib/seo/json-ld';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { getPublicEventsForSitemap } from '@/lib/seo/public-data';
import { absoluteUrl, isProductionSeo } from '@/lib/seo/site';

import type { Metadata } from 'next';

const description = 'Explore public events and nightlife experiences with THE C1RCLE.';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const events = await getPublicEventsForSitemap();
  return buildPublicMetadata({
    path: '/explore',
    title: 'Discover Events and Experiences',
    description,
    indexable: !isProductionSeo() || events.length > 0,
  });
}

export default async function ExplorePage() {
  const production = isProductionSeo();
  const authoritativeEvents = production ? await getPublicEventsForSitemap() : [];
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Discover Events and Experiences',
    url: absoluteUrl('/explore'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: authoritativeEvents.map((event, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: event.title,
        url: absoluteUrl(`/event/${event.slug}`),
      })),
    },
  };

  return (
    <div className="relative z-10 min-h-screen overflow-x-clip pb-24 text-white md:pb-0">
      <header className="mx-auto max-w-[1440px] px-4 pb-8 pt-32 text-center sm:px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF6842]">Explore</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl">
          Discover Events and Experiences
        </h1>
      </header>
      {authoritativeEvents.length > 0 && <JsonLd data={itemList} />}

      {production ? (
        <section aria-labelledby="public-events-heading" className="mx-auto max-w-6xl px-6 pb-24">
          <h2 id="public-events-heading" className="text-2xl font-black uppercase">
            Upcoming events
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {authoritativeEvents.map((event) => (
              <article
                key={event.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
              >
                <h3 className="text-2xl font-black uppercase">{event.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/55">{event.summary}</p>
                <Link
                  href={`/event/${event.slug}`}
                  className="mt-5 inline-flex text-xs font-black uppercase tracking-widest text-[#FF6842]"
                >
                  View {event.title}
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section aria-label="Featured events">
            <ExploreHeroCarouselClient events={exploreFixture.featuredEvents} />
          </section>

          <ExploreDiscoveryClient events={exploreFixture.events} cities={exploreFixture.cities} />
        </>
      )}
    </div>
  );
}
