'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { EventArtworkFallback } from '@/features/explore/components/EventArtworkFallback';

import type { ExploreEvent } from '@/features/explore/types/explore.types';

interface VenueListing {
  id: string;
  slug: string;
  name: string;
  city: string;
  image: string;
  firstEvent: ExploreEvent;
  events: ExploreEvent[];
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
});

function collectVenues(events: readonly ExploreEvent[]): VenueListing[] {
  const venues = new Map<string, VenueListing>();

  for (const event of events) {
    if (!event.venueId || !event.venueSlug || event.venue === 'Venue TBA') continue;
    const current = venues.get(event.venueId);
    if (current) {
      current.events.push(event);
      continue;
    }
    venues.set(event.venueId, {
      id: event.venueId,
      slug: event.venueSlug,
      name: event.venue,
      city: event.city === 'Location unavailable' ? '' : event.city,
      image: event.image,
      firstEvent: event,
      events: [event],
    });
  }

  return [...venues.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function DirectoryLanding({
  events,
  feedAvailable,
}: {
  readonly events: readonly ExploreEvent[];
  readonly feedAvailable: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'venues' | 'hosts'>('venues');
  const venues = useMemo(() => collectVenues(events), [events]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050505] px-4 pb-28 pt-28 text-white sm:px-6 sm:pt-32 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52rem] bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,68,0,0.26),transparent_62%)]"
      />

      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-xl transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span aria-hidden="true" className="text-lg">
              ←
            </span>
          </Link>
        </div>

        <header className="relative flex flex-col items-center text-center">
          <h1 className="max-w-full text-[clamp(2rem,6vw,5.5rem)] font-black uppercase leading-[0.92] tracking-[-0.055em] text-white">
            <span className="block">Discover</span>{' '}
            <span className="block">Hosts &amp; Venues</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[10px] font-bold uppercase leading-5 tracking-[0.18em] text-white/60 sm:text-sm sm:tracking-[0.22em]">
            {activeTab === 'venues'
              ? 'Explore public venues and spaces hosting C1RCLE events.'
              : 'The creators, curators, and organizers driving the city after dark.'}
          </p>

          <div
            role="tablist"
            aria-label="Browse venues or hosts"
            className="mt-7 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1.5 shadow-inner backdrop-blur-2xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'venues'}
              onClick={() => {
                setActiveTab('venues');
              }}
              className={`min-h-10 rounded-full px-6 text-xs font-black uppercase tracking-[0.12em] transition-colors ${activeTab === 'venues' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              Venues
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'hosts'}
              onClick={() => {
                setActiveTab('hosts');
              }}
              className={`min-h-10 rounded-full px-6 text-xs font-black uppercase tracking-[0.12em] transition-colors ${activeTab === 'hosts' ? 'bg-white text-black shadow-md' : 'text-white/60 hover:text-white'}`}
            >
              Hosts
            </button>
          </div>

          <Link
            href="/search"
            aria-label="Search hosts and venues"
            className="mx-auto mt-8 flex min-h-14 w-full max-w-5xl items-center gap-3.5 rounded-full border border-white/15 bg-white/[0.045] px-5 text-left shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-[border-color,background-color] hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:px-6"
          >
            <SearchIcon />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white/55 sm:text-base">
              Search venues, cities, or events...
            </span>
          </Link>
        </header>

        <section
          aria-live="polite"
          aria-labelledby="directory-results-heading"
          className="relative mx-auto mt-12 max-w-[1500px] sm:mt-16"
        >
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
            <div>
              <h2
                id="directory-results-heading"
                className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl"
              >
                {activeTab === 'venues' ? 'Venues' : 'Hosts'}
              </h2>
              <p className="mt-1 text-xs text-white/45">
                {activeTab === 'venues'
                  ? `${String(venues.length)} ${venues.length === 1 ? 'place' : 'places'} in the event feed`
                  : 'Public host listings'}
              </p>
            </div>
          </div>

          {activeTab === 'hosts' ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center text-sm text-white/60">
              No public hosts are available yet.
            </p>
          ) : venues.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
              {venues.map((venue) => {
                const nextEvent = venue.firstEvent;
                const hasArtwork = venue.image !== '/c1rcle-logo.webp';
                return (
                  <article key={venue.id} className="h-full">
                    <Link
                      href={`/venue/${encodeURIComponent(venue.slug)}`}
                      aria-label={`${venue.name}${venue.city ? `, ${venue.city}` : ''}. ${String(venue.events.length)} upcoming ${venue.events.length === 1 ? 'event' : 'events'}.`}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#12100f] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-[transform,box-shadow,border-color] duration-300 hover:scale-[1.02] hover:border-white/25 hover:shadow-[0_20px_42px_rgba(0,0,0,0.4)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:rounded-[1.25rem]"
                    >
                      {hasArtwork ? (
                        <Image
                          src={venue.image}
                          alt={`${venue.name} event artwork`}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transition-none"
                        />
                      ) : (
                        <div className="absolute inset-0">
                          <EventArtworkFallback
                            startsAt={nextEvent.startsAt}
                            category={nextEvent.category}
                          />
                        </div>
                      )}
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10 transition-colors group-hover:from-black/95 group-hover:via-black/55"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                        {venue.city ? (
                          <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-white/65 sm:text-[10px]">
                            {venue.city}
                          </p>
                        ) : null}
                        <h3 className="mt-1.5 line-clamp-2 font-heading text-base font-semibold leading-tight tracking-[-0.025em] sm:text-lg">
                          {venue.name}
                        </h3>
                        <p className="mt-2 line-clamp-1 text-[11px] text-white/75 sm:text-xs">
                          {dateFormatter.format(new Date(nextEvent.startsAt))} · {nextEvent.title}
                        </p>
                        <p className="mt-1.5 text-[10px] text-white/50">
                          {venue.events.length} upcoming{' '}
                          {venue.events.length === 1 ? 'event' : 'events'}
                        </p>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center text-sm text-white/60">
              {feedAvailable
                ? 'No public venues are available yet.'
                : 'We couldn’t load the public event feed. Please try again in a moment.'}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5 shrink-0 fill-none stroke-white/55 stroke-2"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
