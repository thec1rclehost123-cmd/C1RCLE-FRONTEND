'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { CalendarIcon, ChevronDownIcon, ExportIcon } from '@c1rcle/icons';

import styles from './VenueEventsAnalytics.module.css';

export function VenueEventsAnalyticsFilters({
  venues,
  events,
}: {
  readonly venues: readonly string[];
  readonly events: readonly { readonly id: string; readonly name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === 'all') next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className={styles['analyticsFilters']}>
      <label>
        <CalendarIcon size={16} aria-hidden="true" />
        <span className={styles['srOnly']}>Date range</span>
        <select
          value={searchParams.get('range') ?? '7d'}
          onChange={(event) => {
            updateFilter('range', event.target.value);
          }}
        >
          <option value="7d">10 Jul – 16 Jul 2025</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
        <ChevronDownIcon size={15} aria-hidden="true" />
      </label>
      <label>
        <span className={styles['srOnly']}>Venue</span>
        <select
          value={searchParams.get('venue') ?? 'all'}
          onChange={(event) => {
            updateFilter('venue', event.target.value);
          }}
        >
          <option value="all">All venues</option>
          {venues.map((venue) => (
            <option value={venue} key={venue}>
              {venue}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={15} aria-hidden="true" />
      </label>
      <label>
        <span className={styles['srOnly']}>Event</span>
        <select
          value={searchParams.get('event') ?? 'all'}
          onChange={(event) => {
            updateFilter('event', event.target.value);
          }}
        >
          <option value="all">All events</option>
          {events.map((event) => (
            <option value={event.id} key={event.id}>
              {event.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={15} aria-hidden="true" />
      </label>
      <button type="button" disabled title="Report export requires the aggregate analytics API">
        <ExportIcon size={17} aria-hidden="true" /> Export report
      </button>
    </div>
  );
}
