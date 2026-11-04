'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';

import { ExploreEventCard } from '@/features/explore/components/ExploreEventCard';

import type { ExploreEvent } from '@/features/explore/types/explore.types';

const GENRE_TEMPLATES = [
  'House Parties',
  'Raves',
  'Clubs',
  'Bollywood',
  'EDM',
  'Techno',
  'Live Music',
  'Comedy',
] as const;

function EventRail({
  title,
  events,
  id,
}: {
  readonly title: string;
  readonly events: readonly ExploreEvent[];
  readonly id: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    // The browser can restore a previous horizontal scroll offset after hydration.
    // Reset both before paint and on the next frame so this rail starts flush with
    // its heading, while remaining freely swipeable afterward.
    rail.scrollLeft = 0;
    const frame = window.requestAnimationFrame(() => {
      rail.scrollLeft = 0;
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [events.length]);

  if (events.length === 0) return null;

  return (
    <section aria-labelledby={id}>
      <div className="mx-auto mb-5 flex max-w-[1280px] items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <h2
          id={id}
          className="font-heading text-3xl font-black uppercase tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl"
        >
          {title}
        </h2>
        <Link
          href="/explore"
          className="shrink-0 pb-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:text-[10px] sm:tracking-[0.2em]"
        >
          View all events <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div
        ref={railRef}
        className="mx-auto flex max-w-[1280px] snap-x gap-4 overflow-x-auto px-4 pb-5 pt-1 [scroll-padding-inline:1rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:px-6 sm:[scroll-padding-inline:1.5rem] lg:px-8 lg:[scroll-padding-inline:2rem]"
      >
        {events.slice(0, 12).map((event) => (
          <div
            key={event.id}
            className="w-[min(43vw,184px)] shrink-0 snap-start sm:w-[196px] lg:w-[208px]"
          >
            <ExploreEventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeEventCategories({ events }: { readonly events: readonly ExploreEvent[] }) {
  if (events.length === 0) return null;

  const freeEvents = events.filter((event) => event.isFree === true);

  return (
    <div className="relative z-10 space-y-9 pb-12 pt-3 sm:space-y-11 sm:pb-16 sm:pt-5">
      <EventRail title="For You" id="home-for-you-heading" events={events} />
      <EventRail title="Free Events" id="home-free-events-heading" events={freeEvents} />

      <section aria-labelledby="home-genres-heading">
        <div className="mx-auto mb-5 max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <h2
            id="home-genres-heading"
            className="font-heading text-3xl font-black uppercase tracking-[-0.045em] text-white sm:text-4xl lg:text-5xl"
          >
            Browse by{' '}
            <span className="bg-gradient-to-r from-[#ff6b4a] to-[#a979d1] bg-clip-text text-transparent">
              Genre
            </span>
          </h2>
        </div>

        <div className="mx-auto flex max-w-[1280px] snap-x gap-5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-7 sm:px-6 lg:px-8">
          {GENRE_TEMPLATES.map((genre) => (
            <Link
              key={genre}
              href={`/explore?category=${encodeURIComponent(genre)}`}
              className="group w-24 shrink-0 snap-start text-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-28"
              aria-label={`Explore ${genre} events`}
            >
              <span
                aria-hidden="true"
                className="flex aspect-square items-center justify-center rounded-[1.2rem] border border-white/12 bg-[#111111] px-2 text-center text-sm font-black uppercase tracking-[-0.04em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-[transform,border-color,box-shadow] duration-200 group-hover:scale-[1.035] group-hover:border-[#ff6b4a]/45 group-hover:shadow-[0_16px_32px_rgba(0,0,0,0.38)] motion-reduce:transition-none sm:text-base"
              >
                {genre}
              </span>
              <span className="mt-2 block line-clamp-2 text-[11px] font-semibold leading-4 text-white/75 group-hover:text-white">
                {genre}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
