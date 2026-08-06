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
      className="mx-auto max-w-[1500px] px-4 pb-12 sm:px-6 lg:px-8"
    >
      <div className="relative z-20 -mt-7 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex w-max min-w-full items-end gap-2 rounded-[1.5rem] border border-white/10 bg-[#0A0A0A]/95 p-2 shadow-2xl backdrop-blur-2xl sm:rounded-full">
          <label className="flex min-w-48 flex-1 flex-col gap-1 px-4 py-2">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
              Search
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              placeholder="Events, venues, cities"
              className="min-h-6 bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/30"
            />
          </label>

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

      <div className="mb-10 mt-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#FF6B4A]">
            Explore events
          </p>
          <h2
            id="explore-results-heading"
            className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] sm:text-6xl"
          >
            What&apos;s on in <span className="text-[#FF4400]">{activeCity}</span>
          </h2>
        </div>
        <p
          aria-live="polite"
          className="text-sm font-black uppercase tracking-[0.2em] text-white/55"
        >
          {visibleEvents.length} {visibleEvents.length === 1 ? 'event' : 'events'} found
        </p>
      </div>

      {visibleEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    <label className="flex min-w-36 flex-col gap-1 border-l border-white/10 px-4 py-2">
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="min-h-6 cursor-pointer bg-[#0A0A0A] text-xs font-bold text-white outline-none"
      >
        {children}
      </select>
    </label>
  );
}
