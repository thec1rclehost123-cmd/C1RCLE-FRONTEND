'use client';

import { useMemo, useState } from 'react';

import { ExploreEventCard } from './ExploreEventCard';

import type {
  ExploreCity,
  ExploreDateFilter,
  ExploreEvent,
  ExploreSort,
} from '../types/explore.types';

function isThisWeekend(startsAt: string) {
  const day = new Date(startsAt).getDay();
  return day === 0 || day === 6;
}

export function ExploreDiscoveryClient({
  events,
  cities,
}: {
  events: readonly ExploreEvent[];
  cities: readonly ExploreCity[];
}) {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState<ExploreDateFilter>('any');
  const [sort, setSort] = useState<ExploreSort>('trending');

  const visibleEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const today = new Date().toDateString();

    return events
      .filter((event) => {
        const searchable =
          `${event.title} ${event.category} ${event.venue} ${event.city}`.toLowerCase();
        if (normalizedSearch && !searchable.includes(normalizedSearch)) return false;
        if (city && event.cityKey !== city) return false;
        if (date === 'today' && new Date(event.startsAt).toDateString() !== today) return false;
        if (date === 'weekend' && !isThisWeekend(event.startsAt)) return false;
        return true;
      })
      .toSorted((left, right) => {
        if (sort === 'soonest') return Date.parse(left.startsAt) - Date.parse(right.startsAt);
        if (sort === 'newest') return Date.parse(right.startsAt) - Date.parse(left.startsAt);
        if (sort === 'price-low') {
          return (left.price?.amountPaise ?? 0) - (right.price?.amountPaise ?? 0);
        }
        return Number(Boolean(right.badge)) - Number(Boolean(left.badge));
      });
  }, [city, date, events, search, sort]);

  const activeCity = cities.find((option) => option.value === city)?.label ?? 'All Cities';
  const clearFilters = () => {
    setSearch('');
    setCity('');
    setDate('any');
    setSort('trending');
  };

  return (
    <section
      aria-labelledby="explore-results-heading"
      className="relative z-10 bg-black px-5 pb-12 pt-10 sm:-mt-12 sm:px-6 sm:pt-16 lg:px-8"
    >
      <div className="mx-auto max-w-[1540px]">
        {/* Results Header */}
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#FF6B4A] sm:text-xs sm:tracking-[0.3em]">
              Explore events
            </p>
            <h2
              id="explore-results-heading"
              className="mt-3 text-[2.35rem] font-black uppercase leading-[0.9] tracking-[-0.055em] sm:text-6xl"
            >
              What&apos;s on in <span className="block text-[#FF4400] sm:inline">{activeCity}</span>
            </h2>
          </div>
          <p
            aria-live="polite"
            className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55 sm:text-sm sm:tracking-[0.2em]"
          >
            {visibleEvents.length} {visibleEvents.length === 1 ? 'event' : 'events'} found
          </p>
        </div>

        {/* Enhanced Glassmorphism Search & Filter Container */}
        <div className="relative z-20 mb-8 sm:mb-12">
          {/* Subtle Ambient Orange Glow Ring */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-1 hidden rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(255,68,0,0.22)_0%,transparent_70%)] blur-xl sm:block lg:rounded-full"
          />

          <div className="relative rounded-[1.5rem] border border-white/15 bg-[#080808] p-2 shadow-[0_16px_42px_rgba(0,0,0,0.65)] sm:rounded-[2rem] sm:p-2.5 sm:backdrop-blur-2xl lg:flex lg:items-center lg:rounded-full lg:p-2">
            {/* Search Input Box */}
            <label className="group flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.06] px-4 transition-[border-color,background-color,box-shadow] duration-300 focus-within:border-[#FF4400]/60 focus-within:bg-white/[0.10] focus-within:shadow-[0_0_25px_rgba(255,68,0,0.20)] sm:min-h-16 sm:gap-3.5 sm:rounded-[1.5rem] sm:px-5 lg:rounded-full lg:px-6">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-[#FF4400]/30 bg-[#FF4400]/15 text-[#FF6842] transition-colors duration-300 group-focus-within:bg-[#FF4400] group-focus-within:text-white sm:size-9">
                <SearchIcon />
              </div>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45 group-focus-within:text-[#FF6842] transition-colors">
                  Search events
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder="Events, venues, artists, cities"
                  className="min-h-7 min-w-0 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/35 sm:text-base"
                />
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                  }}
                  aria-label="Clear search input"
                  className="flex size-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </label>

            {/* Select Dropdowns */}
            <div className="mt-2 grid grid-cols-3 gap-1 sm:divide-x sm:divide-white/10 lg:mt-0 lg:min-w-[500px] lg:px-2">
              <ExploreSelect
                label="Sort"
                value={sort}
                onChange={(value) => {
                  setSort(value as ExploreSort);
                }}
              >
                <option value="trending">Trending</option>
                <option value="soonest">Soonest</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
              </ExploreSelect>

              <ExploreSelect
                label="Date"
                value={date}
                onChange={(value) => {
                  setDate(value as ExploreDateFilter);
                }}
              >
                <option value="any">Any date</option>
                <option value="today">Today</option>
                <option value="weekend">Weekend</option>
              </ExploreSelect>

              <ExploreSelect label="City" value={city} onChange={setCity}>
                {cities.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </ExploreSelect>
            </div>
          </div>
        </div>

        {/* Results Grid / Empty State */}
        {visibleEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {visibleEvents.map((event) => (
              <ExploreEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-20 text-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
              No events found
            </p>
            <h3 className="mt-4 text-3xl font-black uppercase">Try another ritual</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/55">
              Adjust your search or filters to discover more events.
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
    <label className="group relative flex min-w-0 cursor-pointer flex-col justify-center gap-1 rounded-xl bg-white/[0.035] px-2.5 py-3 transition-colors hover:bg-white/[0.06] sm:rounded-2xl sm:bg-transparent sm:px-5">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45 group-hover:text-[#FF6842] transition-colors">
        {label}
      </span>
      <div className="flex items-center justify-between gap-1">
        <select
          aria-label={label}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className="min-h-7 min-w-0 max-w-full cursor-pointer appearance-none truncate bg-transparent pr-3 text-[10px] font-bold text-white outline-none sm:pr-4 sm:text-xs"
        >
          {children}
        </select>
        <span
          aria-hidden="true"
          className="text-[10px] text-white/40 group-hover:text-white transition-colors pointer-events-none"
        >
          ▼
        </span>
      </div>
    </label>
  );
}

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4 shrink-0 fill-none stroke-current stroke-[2.5]"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
