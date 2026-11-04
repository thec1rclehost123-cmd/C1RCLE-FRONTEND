import Link from 'next/link';

import type { ExploreEvent } from '@/features/explore/types/explore.types';

interface VenueSummary {
  readonly slug: string;
  readonly name: string;
  readonly city: string;
}

function getVenues(events: readonly ExploreEvent[]): VenueSummary[] {
  const venues = new Map<string, VenueSummary>();

  for (const event of events) {
    const name = event.venue.trim();
    const city = event.city.trim();
    const slug = event.venueSlug;
    if (!name || name.toLocaleLowerCase() === 'venue tba' || !slug) continue;

    if (!venues.has(slug)) venues.set(slug, { slug, name, city });
  }

  return [...venues.values()];
}

export function HomeBrowseByVenue({ events }: { readonly events: readonly ExploreEvent[] }) {
  const venues = getVenues(events);
  if (venues.length === 0) return null;

  return (
    <section aria-labelledby="home-browse-venues-heading" className="relative pb-8 pt-3 sm:pb-10">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2
            id="home-browse-venues-heading"
            className="font-heading text-3xl font-black uppercase tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl"
          >
            Browse by{' '}
            <span className="bg-gradient-to-r from-[#ff6b4a] to-[#a979d1] bg-clip-text text-transparent">
              Venue
            </span>
          </h2>
        </div>

        <div className="flex snap-x gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-7">
          {venues.map((venue) => (
            <Link
              key={venue.slug}
              href={`/venue/${encodeURIComponent(venue.slug)}`}
              aria-label={`Explore events at ${venue.name}${venue.city ? `, ${venue.city}` : ''}`}
              className="group w-24 shrink-0 snap-start text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-28"
            >
              <span
                aria-hidden="true"
                className="flex aspect-square items-center justify-center rounded-[1.2rem] border border-white/12 bg-[#111111] text-3xl font-black uppercase tracking-[-0.08em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-[transform,border-color,box-shadow] duration-200 group-hover:scale-[1.035] group-hover:border-[#ff6b4a]/45 group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.38)] motion-reduce:transition-none sm:text-4xl"
              >
                {venue.name.slice(0, 2)}
              </span>
              <span className="mt-2 block line-clamp-2 text-[11px] font-semibold leading-4 text-white/75 group-hover:text-white">
                {venue.name}
              </span>
              {venue.city ? (
                <span className="mt-0.5 block line-clamp-1 text-[10px] leading-4 text-white/45">
                  {venue.city}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
