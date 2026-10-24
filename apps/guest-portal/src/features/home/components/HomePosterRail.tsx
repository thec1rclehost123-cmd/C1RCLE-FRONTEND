import Link from 'next/link';

import { ExploreEventCard } from '@/features/explore/components/ExploreEventCard';

import type { ExploreEvent } from '@/features/explore/types/explore.types';

export function HomePosterRail({ events }: { readonly events: readonly ExploreEvent[] }) {
  const moreEvents = events.slice(3, 11);
  if (moreEvents.length === 0) return null;

  return (
    <section aria-labelledby="home-more-events-heading" className="relative px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 id="home-more-events-heading" className="text-[1.35rem] font-semibold tracking-[-0.035em] sm:text-[1.5rem]">
            More events to explore
          </h2>
          <Link href="/explore" className="shrink-0 text-xs font-semibold text-white/60 transition-colors hover:text-white">
            View all →
          </Link>
        </div>
        <div className="flex snap-x gap-3 overflow-x-auto pb-6 pt-2 scrollbar-none sm:gap-4">
          {moreEvents.map((event) => (
            <div key={event.id} className="w-[min(45vw,188px)] shrink-0 snap-start sm:w-[210px] lg:w-[224px]">
              <ExploreEventCard event={event} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
