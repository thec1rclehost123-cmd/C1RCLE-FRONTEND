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

  return (
    <section
      id="featured-events"
      aria-labelledby="featured-events-heading"
      className="relative py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(140,87,182,0.2),transparent_68%)]" />
      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-7 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.32em] text-[#ff6b4a]">
              {content.eyebrow}
            </p>
            <h2
              id="featured-events-heading"
              className="mt-4 text-4xl font-black uppercase tracking-[-0.055em] text-white sm:text-6xl"
            >
              {content.title}{' '}
              <span className="bg-gradient-to-r from-[#ff6b4a] to-[#a979d1] bg-clip-text text-transparent">
                {content.highlightedWord}
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">{content.description}</p>
          </div>

          <Link
            href={content.ctaHref}
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-white/15 bg-white/[0.05] px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-black"
          >
            {content.ctaLabel}
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {events.slice(0, 3).map((event) => (
            <ExploreEventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
