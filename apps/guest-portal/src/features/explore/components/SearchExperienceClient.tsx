'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { createApiClient } from '@c1rcle/api-client';
import { eventDtoSchema, paginatedSchema, venueDtoSchema } from '@c1rcle/contracts';

import { deriveCategories, filterExploreEvents } from '../explore-filtering';
import { deriveCities, toExploreEvent } from '../explore-mapping';

import { ExploreEventCard } from './ExploreEventCard';

import type { ExploreCity, ExploreEvent } from '../types/explore.types';
import type { VenueDto } from '@c1rcle/contracts';

const searchClient = createApiClient({ maxRetries: 0, timeoutMs: 10_000 });
const searchResponseSchema = paginatedSchema(eventDtoSchema);

export function SearchExperienceClient({
  events,
  cities,
  initialQuery = '',
  initialCity = '',
  initialCategory = '',
  initialWeekend = false,
}: {
  events: readonly ExploreEvent[];
  cities: readonly ExploreCity[];
  initialQuery?: string;
  initialCity?: string;
  initialCategory?: string;
  initialWeekend?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState(initialCity);
  const [category, setCategory] = useState(initialCategory);
  const [weekend, setWeekend] = useState(initialWeekend);
  const [searchState, setSearchState] = useState<{
    query: string;
    status: 'idle' | 'loading' | 'ready' | 'error';
    events: ExploreEvent[];
  }>({ query: '', status: 'idle', events: [] });

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setSearchState({ query: normalizedQuery, status: 'loading', events: [] });
      void (async () => {
        try {
          const page = await searchClient.get({
            path: '/api/v2/public/search',
            query: { q: normalizedQuery, limit: 100 },
            schema: searchResponseSchema,
          });
          const venueIds = [
            ...new Set(
              page.items.map((event) => event.venueId).filter((id): id is string => id !== null),
            ),
          ];
          const venueEntries = await Promise.all(
            venueIds.map(async (venueId) => {
              try {
                const venue = await searchClient.get({
                  path: `/api/v2/public/venues/by-id/${encodeURIComponent(venueId)}`,
                  schema: venueDtoSchema,
                });
                return [venueId, venue] as const;
              } catch {
                return [venueId, null] as const;
              }
            }),
          );
          const venues = new Map<string, VenueDto | null>(venueEntries);
          if (active) {
            setSearchState({
              query: normalizedQuery,
              status: 'ready',
              events: page.items.map((event) =>
                toExploreEvent(
                  event,
                  event.venueId ? (venues.get(event.venueId) ?? null) : null,
                  null,
                ),
              ),
            });
          }
        } catch {
          if (active) setSearchState({ query: normalizedQuery, status: 'error', events: [] });
        }
      })();
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const normalizedQuery = query.trim();
  const searchReady =
    normalizedQuery && searchState.query === normalizedQuery && searchState.status === 'ready';
  const searchLoading =
    normalizedQuery && (searchState.query !== normalizedQuery || searchState.status === 'loading');
  const searchFailed =
    normalizedQuery && searchState.query === normalizedQuery && searchState.status === 'error';
  const resultEvents = useMemo(() => {
    if (!normalizedQuery) return events;
    const byId = new Map(
      filterExploreEvents(events, {
        search: query,
        city: '',
        category: '',
        date: 'any',
        sort: 'soonest',
      }).map((event) => [event.id, event]),
    );
    if (searchReady) for (const event of searchState.events) byId.set(event.id, event);
    return [...byId.values()];
  }, [events, normalizedQuery, query, searchReady, searchState.events]);
  const resultCities = normalizedQuery
    ? [
        ...new Map(
          [...cities, ...deriveCities(resultEvents)].map((option) => [option.value, option]),
        ).values(),
      ]
    : cities;

  function updateQuery(value: string) {
    setQuery(value);
  }
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [key, value] of [
      ['q', query],
      ['city', city],
      ['category', category],
      ['date', weekend ? 'weekend' : ''],
    ] as const) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [query, city, category, weekend]);
  const categories = useMemo(() => deriveCategories(resultEvents), [resultEvents]);
  const matches = useMemo(
    () =>
      filterExploreEvents(resultEvents, {
        search: '',
        city,
        category,
        date: weekend ? 'weekend' : 'any',
        sort: 'soonest',
      }),
    [category, city, resultEvents, weekend],
  );

  return (
    <div className="guest-search relative min-h-screen overflow-hidden bg-[#070807] px-5 pb-28 pt-32 text-white sm:px-8 sm:pt-36 lg:px-12">
      {events[0] ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[980px] overflow-hidden opacity-45 [mask-image:linear-gradient(to_bottom,black_0%,black_52%,transparent_100%)]"
        >
          <Image
            src={events[0].image}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="scale-125 object-cover blur-[72px] saturate-150"
          />
        </div>
      ) : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[980px] bg-gradient-to-b from-black/15 via-black/35 to-[#070807]"
      />
      <header className="mx-auto max-w-4xl text-center">
        <h1 className="relative font-heading text-3xl font-bold tracking-[-0.045em] sm:text-4xl lg:text-[2.7rem]">
          What are you in the mood for?
        </h1>
        <label className="relative mx-auto mt-7 flex min-h-14 max-w-[680px] items-center gap-3 rounded-full border border-white/20 bg-white/[0.09] px-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-md transition-colors focus-within:border-white/45 focus-within:bg-white/[0.12]">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              updateQuery(event.target.value);
            }}
            placeholder="Search events, venues, and cities…"
            aria-label="Search events, venues, cities, or categories"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/55 sm:text-base"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                updateQuery('');
              }}
              aria-label="Clear search"
              className="flex size-10 items-center justify-center rounded-full bg-white/10 text-xl hover:bg-white/20"
            >
              ×
            </button>
          ) : null}
        </label>
        <div
          role="group"
          aria-label="Quick search filters"
          className="relative mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2.5"
        >
          <button
            type="button"
            onClick={() => {
              setWeekend((active) => !active);
            }}
            aria-pressed={weekend}
            className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition-colors backdrop-blur-sm ${weekend ? 'border-[#FF6842]/70 bg-[#FF6842]/85 text-white' : 'border-white/15 bg-white/[0.08] text-white/85 hover:bg-white/[0.14]'}`}
          >
            This weekend
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCategory(category === item ? '' : item);
              }}
              aria-pressed={category === item}
              className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition-colors backdrop-blur-sm ${category === item ? 'border-[#FF6842]/70 bg-[#FF6842]/85 text-white' : 'border-white/15 bg-white/[0.08] text-white/85 hover:bg-white/[0.14]'}`}
            >
              {item}
            </button>
          ))}
          {resultCities
            .filter((option) => option.value)
            .map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setCity(city === option.value ? '' : option.value);
                }}
                aria-pressed={city === option.value}
                className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition-colors backdrop-blur-sm ${city === option.value ? 'border-[#FF6842]/70 bg-[#FF6842]/85 text-white' : 'border-white/15 bg-white/[0.08] text-white/85 hover:bg-white/[0.14]'}`}
              >
                {option.label}
              </button>
            ))}
        </div>
      </header>

      <section
        aria-live="polite"
        aria-labelledby="search-results-heading"
        className="relative mx-auto mt-16 max-w-[1500px] sm:mt-20"
      >
        <h2
          id="search-results-heading"
          className="mb-7 text-center font-heading text-lg font-semibold tracking-[-0.02em] text-white/85 sm:mb-8 sm:text-xl"
        >
          {query || category || weekend || city ? 'Search Results' : 'Upcoming Events'}
        </h2>
        {searchLoading ? (
          <p role="status" className="text-center text-sm text-white/55">
            Searching public events…
          </p>
        ) : searchFailed ? (
          <p role="alert" className="text-center text-sm text-white/55">
            Search is temporarily unavailable. Try again in a moment.
          </p>
        ) : matches.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
            {matches.map((event) => (
              <ExploreEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
            <h3 className="font-heading text-2xl font-bold">No events found</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
              Try another search, clear a filter, or browse all public events.
            </p>
            <button
              type="button"
              onClick={() => {
                updateQuery('');
                setCity('');
                setCategory('');
                setWeekend(false);
              }}
              className="mt-6 min-h-11 rounded-full bg-white px-6 text-xs font-black uppercase tracking-wider text-black"
            >
              Clear search
            </button>
          </div>
        )}
        <Link href="/explore" className="sr-only">
          Return to Explore
        </Link>
      </section>
    </div>
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
