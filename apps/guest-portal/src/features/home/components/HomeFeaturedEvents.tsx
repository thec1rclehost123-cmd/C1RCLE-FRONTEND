import Link from 'next/link';

import { ExploreEventCard } from '@/features/explore/components/ExploreEventCard';

import type { HomeFeaturedContent } from '../types/home.types';
import type { ExploreEvent } from '@/features/explore/types/explore.types';

export function HomeFeaturedEvents({
  content,
  events,
}: {
  content: HomeFeaturedContent;
  events: readonly ExploreEvent[];
}) {
  if (events.length === 0) return null;
  const featuredEvents = events.slice(0, 8);
  const canDrift = featuredEvents.length >= 5;

  return (
    <section
      id="featured-events"
      aria-labelledby="featured-events-heading"
      className="relative -mt-[7svh] pb-8 pt-4 sm:-mt-[17svh] sm:pb-10 sm:pt-8"
    >
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.32em] text-[#ff6b4a]">
              {content.eyebrow}
            </p>
            <h2
              id="featured-events-heading"
              className="mt-3 text-3xl font-black uppercase tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl"
            >
              {content.title}{' '}
              <span className="bg-gradient-to-r from-[#ff6b4a] to-[#a979d1] bg-clip-text text-transparent">
                {content.highlightedWord}
              </span>
            </h2>
          </div>

          <Link
            href={content.ctaHref}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-4 py-3 text-[9px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-white hover:text-black sm:px-6 sm:text-[10px] sm:tracking-[0.2em]"
          >
            {content.ctaLabel}
          </Link>
        </div>
      </div>
      <div className="featured-events-rail relative w-full overflow-x-auto pb-4 pt-1 sm:overflow-hidden">
        <div
          className={`featured-events-track flex w-max ${canDrift ? 'featured-events-track--drift' : ''}`}
        >
          <div className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
            {featuredEvents.map((event) => (
              <div
                key={event.id}
                className="w-[44vw] max-w-[190px] shrink-0 sm:w-[250px] sm:max-w-none lg:w-[260px]"
              >
                <ExploreEventCard event={event} />
              </div>
            ))}
          </div>
          {canDrift ? (
            <div className="hidden shrink-0 gap-4 pr-4 sm:flex">
              {featuredEvents.map((event) => (
                <div key={event.id} className="w-[250px] shrink-0 lg:w-[260px]">
                  <ExploreEventCard event={event} />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
