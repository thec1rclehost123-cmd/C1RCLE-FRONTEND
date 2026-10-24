'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { deriveCategories, filterExploreEvents, filtersToQuery } from '../explore-filtering';

import { ExploreEventCard } from './ExploreEventCard';

import type {
  ExploreCity,
  ExploreDateFilter,
  ExploreEvent,
  ExploreFilters,
  ExploreSort,
} from '../types/explore.types';

const PAGE_SIZE = 12;

export function ExploreDiscoveryClient({
  events,
  cities,
  initialFilters,
}: {
  events: readonly ExploreEvent[];
  cities: readonly ExploreCity[];
  initialFilters: ExploreFilters;
}) {
  const pathname = usePathname();
  const [search, setSearch] = useState(initialFilters.search);
  const [city, setCity] = useState(initialFilters.city);
  const [category, setCategory] = useState(initialFilters.category);
  const [date, setDate] = useState<ExploreDateFilter>(initialFilters.date);
  const [sort, setSort] = useState<ExploreSort>(initialFilters.sort);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const categories = useMemo(() => deriveCategories(events), [events]);
  const filters = useMemo<ExploreFilters>(
    () => ({ search, city, category, date, sort }),
    [category, city, date, search, sort],
  );

  const filteredEvents = useMemo(() => filterExploreEvents(events, filters), [events, filters]);
  const visibleEvents = filteredEvents.slice(0, visibleCount);
  const resetVisibleEvents = () => {
    setVisibleCount(PAGE_SIZE);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = filtersToQuery(filters);
      const nextUrl = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, '', nextUrl);
    }, 150);
    return () => {
      window.clearTimeout(timer);
    };
  }, [filters, pathname]);

  const activeCity = cities.find((option) => option.value === city)?.label ?? 'All Cities';
  const clearFilters = () => {
    setSearch('');
    setCity('');
    setCategory('');
    setDate('any');
    setSort('soonest');
    resetVisibleEvents();
  };

  return (
    <section
      aria-labelledby="explore-results-heading"
      className="relative z-20 -mt-12 bg-transparent px-5 pb-12 pt-4 sm:-mt-20 sm:px-6 sm:pt-5 lg:-mt-24 lg:px-8"
    >
      <div className="mx-auto max-w-[1600px]">
        {/* Results heading and compact filters follow the floating rail pattern. */}
        <div className="mb-2 flex flex-col gap-5 sm:mb-3 sm:gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2
              id="explore-results-heading"
              className="text-[1.65rem] font-bold leading-tight tracking-[-0.04em] sm:text-[2rem] lg:text-[2.25rem]"
            >
              What&apos;s on in{' '}
              <span className="inline-block align-baseline whitespace-nowrap text-[#FF4400]">
                {activeCity}
              </span>
            </h2>
            <p
              aria-live="polite"
              className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/45 sm:text-[11px] sm:tracking-[0.2em]"
            >
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
            </p>
          </div>

          {/* Search remains available from the immersive Search route. */}
          <div className="relative z-20 grid w-full grid-cols-2 gap-2.5 xl:w-auto xl:grid-cols-4 xl:items-center">
            <ExploreSelect
              label="Category"
              value={category}
              onChange={(value) => {
                setCategory(value);
                resetVisibleEvents();
              }}
            >
              <option value="">All types</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </ExploreSelect>

            <ExploreSelect
              label="Sort"
              value={sort}
              onChange={(value) => {
                setSort(value as ExploreSort);
                resetVisibleEvents();
              }}
            >
              <option value="soonest">Soonest</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
            </ExploreSelect>

            <ExploreSelect
              label="Date"
              value={date}
              onChange={(value) => {
                setDate(value as ExploreDateFilter);
                resetVisibleEvents();
              }}
            >
              <option value="any">Any date</option>
              <option value="today">Today</option>
              <option value="weekend">Weekend</option>
            </ExploreSelect>

            <ExploreSelect
              label="City"
              value={city}
              onChange={(value) => {
                setCity(value);
                resetVisibleEvents();
              }}
            >
              {cities.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </ExploreSelect>
          </div>
        </div>

        {/* Results Grid / Empty State */}
        {filteredEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {visibleEvents.map((event) => (
                <ExploreEventCard key={event.id} event={event} />
              ))}
            </div>
            {visibleCount < filteredEvents.length ? (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setVisibleCount((count) => count + PAGE_SIZE);
                  }}
                  className="min-h-11 rounded-full border border-white/20 px-7 py-3 text-xs font-black uppercase tracking-[0.2em] text-white"
                >
                  Show more events
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-20 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
              No events found
            </p>
            <h3 className="mt-4 text-3xl font-black uppercase">Try another ritual</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
              Adjust your filters to discover more events.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-7 min-h-11 rounded-full border border-white/20 px-6 py-3 text-xs font-black uppercase tracking-[0.2em] transition-colors hover:bg-white hover:text-black"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ExploreSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="group relative flex min-h-11 min-w-0 cursor-pointer items-center rounded-full border border-white/12 bg-black/35 px-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-[border-color,background-color] duration-200 hover:border-white/20 hover:bg-black/50 focus-within:border-[#FF6842]/55 sm:min-h-12 sm:px-4">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="min-h-7 min-w-0 flex-1 cursor-pointer appearance-none truncate bg-transparent pr-4 text-[10px] font-semibold text-white/85 outline-none sm:text-xs"
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 text-[10px] text-white/45 transition-colors group-hover:text-white/80 sm:right-4"
      >
        ▼
      </span>
    </label>
  );
}
