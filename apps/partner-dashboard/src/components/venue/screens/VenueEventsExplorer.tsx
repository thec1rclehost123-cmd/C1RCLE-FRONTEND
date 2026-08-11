'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  CalendarIcon,
  ChevronDownIcon,
  GalleryViewIcon,
  ListViewIcon,
  NextIcon,
  RowActionsIcon,
  SearchIcon,
} from '@c1rcle/icons';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

import { filterVenueEvents } from '../venue-events-filter';

import styles from './VenueEvents.module.css';

import type { EventStatus, VenueEvent } from '../venue-events-model';

const statuses: readonly EventStatus[] = ['Live', 'Confirmed', 'Draft', 'Past', 'Cancelled'];

const classNames = (...tokens: readonly (string | undefined)[]): string =>
  tokens.filter((token): token is string => Boolean(token)).join(' ');

export function VenueEventsExplorer({
  events,
  totalCount,
  requestCount,
}: {
  readonly events: readonly VenueEvent[];
  readonly totalCount: number;
  readonly requestCount: number;
}) {
  const auth = useDashboardAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [venue, setVenue] = useState('all');
  const [month, setMonth] = useState('all');
  const [view, setView] = useState<'list' | 'grid'>('list');

  const venues = useMemo(
    () => Array.from(new Set(events.map((event) => event.venue))).sort(),
    [events],
  );
  const visibleEvents = useMemo(
    () => filterVenueEvents(events, { query, status, venue, month }),
    [events, month, query, status, venue],
  );
  const hasFilters = Boolean(query || status !== 'all' || venue !== 'all' || month !== 'all');
  const canEditEvents = auth.canDo('canEditEvent');

  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setVenue('all');
    setMonth('all');
  };

  return (
    <div className={styles['page']}>
      <header className={styles['pageHeader']}>
        <div>
          <h1>Events</h1>
          <p>{totalCount.toLocaleString('en-IN')} events</p>
        </div>
        <Link className={styles['slotRequests']} href="/venue/slot-requests">
          Slot Requests
          {requestCount > 0 ? <span>{requestCount}</span> : null}
          <NextIcon size={16} aria-hidden="true" />
        </Link>
      </header>

      <div className={styles['filters']} aria-label="Event filters">
        <label className={styles['searchControl']}>
          <span className={styles['srOnly']}>Search events</span>
          <SearchIcon size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search events..."
          />
        </label>
        <label className={styles['selectControl']}>
          <span className={styles['srOnly']}>Status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
            }}
          >
            <option value="all">Status</option>
            {statuses.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDownIcon size={15} aria-hidden="true" />
        </label>
        <label className={styles['selectControl']}>
          <span className={styles['srOnly']}>Venue</span>
          <select
            value={venue}
            onChange={(event) => {
              setVenue(event.target.value);
            }}
          >
            <option value="all">Venue</option>
            {venues.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <ChevronDownIcon size={15} aria-hidden="true" />
        </label>
        <label className={styles['selectControl']}>
          <span className={styles['srOnly']}>Date</span>
          <CalendarIcon size={16} aria-hidden="true" />
          <select
            value={month}
            onChange={(event) => {
              setMonth(event.target.value);
            }}
          >
            <option value="all">Date</option>
            <option value="2025-05">May 2025</option>
            <option value="2025-06">June 2025</option>
          </select>
          <ChevronDownIcon size={15} aria-hidden="true" />
        </label>
        <button
          className={styles['clearButton']}
          type="button"
          onClick={clearFilters}
          disabled={!hasFilters}
        >
          Clear filters
        </button>
      </div>

      <div className={styles['sectionBar']}>
        <nav className={styles['tabs']} aria-label="Events sections">
          <Link className={styles['activeTab']} href="/venue/events" aria-current="page">
            All events
          </Link>
          <Link href="/venue/events/analytics">Analytics</Link>
        </nav>
        <div className={styles['viewToggle']} aria-label="Event view">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => {
              setView('list');
            }}
          >
            <ListViewIcon size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => {
              setView('grid');
            }}
          >
            <GalleryViewIcon size={17} aria-hidden="true" />
          </button>
        </div>
      </div>

      {visibleEvents.length === 0 ? (
        <section className={styles['emptyState']}>
          <span>No matching events</span>
          <h2>Nothing matches these filters.</h2>
          <p>Clear the current filters to return to all venue events.</p>
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </section>
      ) : (
        <section className={classNames(styles['eventTable'], view === 'grid' ? styles['gridView'] : undefined)}>
          <div className={styles['tableHeader']} aria-hidden="true">
            <span>Event</span>
            <span>Venue</span>
            <span>Date &amp; time</span>
            <span>Status</span>
            <span>Tickets sold</span>
            <span>Revenue</span>
            <span>Action</span>
          </div>
          <div className={styles['eventRows']}>
            {visibleEvents.map((event, index) => (
              <article className={styles['eventRow']} key={event.id}>
                <div className={styles['eventIdentity']}>
                  <Image
                    src={event.artworkSrc}
                    alt={event.artworkAlt}
                    width={124}
                    height={72}
                    sizes={view === 'grid' ? '(max-width: 600px) 100vw, 33vw' : '124px'}
                    priority={index < 2}
                  />
                  <div>
                    <strong>{event.name}</strong>
                    <span>
                      {event.category} <i>•</i> {event.format}
                    </span>
                  </div>
                </div>
                <div className={styles['cell']} data-label="Venue">
                  <strong>{event.venue}</strong>
                  <span>{event.city}</span>
                </div>
                <div className={styles['cell']} data-label="Date & time">
                  <strong>{event.dateLabel}</strong>
                  <span>
                    {event.dayLabel}, {event.time}
                  </span>
                </div>
                <div className={classNames(styles['cell'], styles['statusCell'])} data-label="Status">
                  <strong data-status={event.status.toLowerCase()}>
                    <i aria-hidden="true" /> {event.status}
                  </strong>
                  <span>{event.statusDetail}</span>
                </div>
                <div className={classNames(styles['cell'], styles['salesCell'])} data-label="Tickets sold">
                  <strong>
                    {event.ticketsSold.toLocaleString('en-IN')} /{' '}
                    {event.capacity.toLocaleString('en-IN')}
                  </strong>
                  <div className={styles['progressLine']}>
                    <progress value={event.pctN} max={100} aria-label={`${event.pct} sold`} />
                    <span>{event.pct}</span>
                  </div>
                </div>
                <div className={styles['cell']} data-label="Revenue">
                  <strong>{event.revenue}</strong>
                  <span>{event.revenuePaise > 0 ? 'Gross' : '—'}</span>
                </div>
                <div className={styles['actions']}>
                  <Link href={`/venue/events/${event.id}`}>
                    {event.status === 'Draft' ? 'Continue' : 'View'}
                  </Link>
                  <details>
                    <summary aria-label={`More actions for ${event.name}`}>
                      <RowActionsIcon size={19} aria-hidden="true" />
                    </summary>
                    <div>
                      <Link href={`/venue/events/${event.id}`}>View event</Link>
                      {canEditEvents ? (
                        <Link href={`/venue/events/${event.id}`}>Edit event</Link>
                      ) : null}
                    </div>
                  </details>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <footer className={styles['pagination']}>
        <span>
          Showing 1 to {visibleEvents.length.toLocaleString('en-IN')} of{' '}
          {totalCount.toLocaleString('en-IN')} events
        </span>
        <nav aria-label="Event pages">
          <button type="button" disabled aria-label="Previous page">
            ‹
          </button>
          <button type="button" aria-current="page">
            1
          </button>
          <button type="button" disabled title="Additional pages require the paginated Events API">
            2
          </button>
          <button type="button" disabled title="Additional pages require the paginated Events API">
            3
          </button>
          <span>…</span>
          <button type="button" disabled title="Additional pages require the paginated Events API">
            26
          </button>
          <button type="button" disabled aria-label="Next page">
            ›
          </button>
        </nav>
      </footer>
    </div>
  );
}
