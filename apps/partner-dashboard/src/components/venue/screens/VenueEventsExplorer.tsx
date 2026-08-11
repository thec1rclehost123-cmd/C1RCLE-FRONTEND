'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ChevronDownIcon,
  FilterIcon,
  GalleryViewIcon,
  ListViewIcon,
  NextIcon,
  PreviousIcon,
  SearchIcon,
} from '@c1rcle/icons';

import { filterVenueEvents } from '../venue-events-filter';

import styles from './VenueEvents.module.css';

import type {
  EventStatus,
  VenueEvent,
  VenueEventSource,
  VenueEventTab,
} from '../venue-events-model';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

const statuses: readonly EventStatus[] = ['Live', 'Confirmed', 'Draft', 'Past'];

const tabs: readonly {
  readonly key: VenueEventTab;
  readonly label: string;
  readonly showCount: boolean;
}[] = [
  { key: 'upcoming', label: 'Upcoming', showCount: true },
  { key: 'live', label: 'Live', showCount: true },
  { key: 'drafts', label: 'Drafts', showCount: true },
  { key: 'past', label: 'Past', showCount: false },
];

const statusTone = (event: VenueEvent): 'success' | 'warning' | 'danger' | 'neutral' => {
  if (event.status === 'Draft' || event.status === 'Cancelled') return 'danger';
  if (event.status === 'Past') return 'neutral';
  return event.pctN < 60 ? 'warning' : 'success';
};

export function VenueEventsExplorer({ source }: { readonly source: VenueEventSource }) {
  const [tab, setTab] = useState<VenueEventTab>('upcoming');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [venue, setVenue] = useState('all');
  const [month, setMonth] = useState('all');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const venues = useMemo(
    () => Array.from(new Set(source.events.map((event) => event.venue))).sort(),
    [source.events],
  );
  const visibleEvents = useMemo(
    () => filterVenueEvents(source.events, { tab, query, status, venue, month }),
    [month, query, source.events, status, tab, venue],
  );
  const hasFilters = status !== 'all' || venue !== 'all' || month !== 'all';
  const hasSearchOrFilters = Boolean(query.trim()) || hasFilters;

  useEffect(() => {
    if (!filtersOpen) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setFiltersOpen(false);
      window.setTimeout(() => filterButtonRef.current?.focus(), 0);
    };
    const closeOnPointerDown = (event: PointerEvent) => {
      if (
        filterPopoverRef.current?.contains(event.target as Node) ||
        filterButtonRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setFiltersOpen(false);
    };

    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('pointerdown', closeOnPointerDown);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('pointerdown', closeOnPointerDown);
    };
  }, [filtersOpen]);

  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setVenue('all');
    setMonth('all');
  };

  const chooseTab = (nextTab: VenueEventTab) => {
    setTab(nextTab);
    setStatus('all');
  };

  const onTabKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (direction === 0) return;
    event.preventDefault();
    const nextIndex = (index + direction + tabs.length) % tabs.length;
    const next = tabs[nextIndex];
    if (!next) return;
    chooseTab(next.key);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={styles['page']}>
      <header className={styles['pageHeader']}>
        <h1>Events</h1>
        <p>Manage what’s live and coming up.</p>
      </header>

      <div className={styles['tabs']} role="tablist" aria-label="Event status groups">
        {tabs.map((item, index) => (
          <button
            key={item.key}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-label={
              item.showCount ? `${item.label} ${String(source.tabCounts[item.key])}` : item.label
            }
            aria-selected={tab === item.key}
            tabIndex={tab === item.key ? 0 : -1}
            onClick={() => {
              chooseTab(item.key);
            }}
            onKeyDown={(event) => {
              onTabKeyDown(event, index);
            }}
          >
            {item.label}
            {item.showCount ? <span>{source.tabCounts[item.key]}</span> : null}
          </button>
        ))}
      </div>

      <div className={styles['toolbar']} aria-label="Find and display events">
        <label className={styles['searchControl']}>
          <span className={styles['srOnly']}>Search events</span>
          <SearchIcon size={20} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            placeholder="Search events"
          />
        </label>

        <div className={styles['filterWrap']}>
          <button
            ref={filterButtonRef}
            className={styles['filterButton']}
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="venue-event-filters"
            onClick={() => {
              setFiltersOpen((open) => !open);
            }}
          >
            <FilterIcon size={19} aria-hidden="true" />
            Filters
            {hasFilters ? <span aria-label="Filters active" /> : null}
          </button>
          {filtersOpen ? (
            <div
              ref={filterPopoverRef}
              id="venue-event-filters"
              className={styles['filterPopover']}
              aria-label="Event filters"
            >
              <label>
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value);
                  }}
                >
                  <option value="all">All statuses</option>
                  {statuses.map((item) => (
                    <option value={item} key={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon size={15} aria-hidden="true" />
              </label>
              <label>
                <span>Date</span>
                <select
                  value={month}
                  onChange={(event) => {
                    setMonth(event.target.value);
                  }}
                >
                  <option value="all">Any date</option>
                  <option value="2025-05">May 2025</option>
                  <option value="2025-06">June 2025</option>
                </select>
                <ChevronDownIcon size={15} aria-hidden="true" />
              </label>
              {venues.length > 1 ? (
                <label>
                  <span>Venue</span>
                  <select
                    value={venue}
                    onChange={(event) => {
                      setVenue(event.target.value);
                    }}
                  >
                    <option value="all">All venues</option>
                    {venues.map((item) => (
                      <option value={item} key={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon size={15} aria-hidden="true" />
                </label>
              ) : null}
              <div className={styles['filterActions']}>
                <button type="button" onClick={clearFilters} disabled={!hasFilters}>
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFiltersOpen(false);
                    filterButtonRef.current?.focus();
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className={styles['viewToggle']} aria-label="Event view">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={view === 'list'}
            onClick={() => {
              setView('list');
            }}
          >
            <ListViewIcon size={21} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            onClick={() => {
              setView('grid');
            }}
          >
            <GalleryViewIcon size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {visibleEvents.length === 0 ? (
        <section className={styles['emptyState']}>
          <span>No matching events</span>
          <h2>Nothing matches this view.</h2>
          <p>Try another event group or clear the current search and filters.</p>
          <button
            type="button"
            onClick={() => {
              if (hasSearchOrFilters) clearFilters();
              else chooseTab('upcoming');
            }}
          >
            {hasSearchOrFilters ? 'Clear search and filters' : 'View upcoming events'}
          </button>
        </section>
      ) : view === 'list' ? (
        <EventList events={visibleEvents} />
      ) : (
        <EventGrid events={visibleEvents} />
      )}

      <footer className={styles['pagination']}>
        <span>
          Showing {visibleEvents.length.toLocaleString('en-IN')} of{' '}
          {source.totalCount.toLocaleString('en-IN')}
        </span>
        <nav aria-label="Event pages">
          <button type="button" disabled={!source.pagination.hasPreviousPage}>
            <PreviousIcon size={18} aria-hidden="true" />
            Previous
          </button>
          <button
            type="button"
            disabled={!source.pagination.hasNextPage}
            title={
              source.pagination.hasNextPage
                ? undefined
                : 'More pages require the paginated Events API'
            }
          >
            Next
            <NextIcon size={18} aria-hidden="true" />
          </button>
        </nav>
      </footer>
    </div>
  );
}

function EventList({ events }: { readonly events: readonly VenueEvent[] }) {
  return (
    <section className={styles['eventTable']} aria-label="Events list">
      <table>
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">When</th>
            <th scope="col">Tickets</th>
            <th scope="col">Status</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, index) => (
            <tr key={event.id}>
              <td data-label="Event">
                <div className={styles['eventIdentity']}>
                  <Image
                    src={event.artworkSrc}
                    alt={event.artworkAlt}
                    width={160}
                    height={86}
                    sizes="160px"
                    priority={index < 2}
                  />
                  <div>
                    <Link href={`/venue/events/${event.id}`}>{event.name}</Link>
                    <span>
                      {event.category} <i aria-hidden="true">•</i> {event.format}
                    </span>
                  </div>
                </div>
              </td>
              <td data-label="When">
                <div className={styles['whenCell']}>
                  <strong>
                    {event.isTonight
                      ? `Tonight, ${event.time}`
                      : `${event.dayLabel}, ${event.dateLabel}`}
                  </strong>
                  <span>
                    {event.isTonight ? `${event.dayLabel}, ${event.dateLabel}` : event.time}
                  </span>
                </div>
              </td>
              <td data-label="Tickets">
                <TicketProgress event={event} />
              </td>
              <td data-label="Status">
                <span className={styles['status']} data-tone={statusTone(event)}>
                  <i aria-hidden="true" />
                  {event.status}
                </span>
              </td>
              <td data-label="Action" className={styles['actionCell']}>
                <Link href={`/venue/events/${event.id}`}>
                  {event.status === 'Draft' ? 'Continue' : 'View'}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function EventGrid({ events }: { readonly events: readonly VenueEvent[] }) {
  return (
    <section className={styles['eventGrid']} aria-label="Events grid">
      {events.map((event, index) => (
        <article key={event.id}>
          <Image
            src={event.artworkSrc}
            alt={event.artworkAlt}
            width={480}
            height={270}
            sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
            priority={index < 2}
          />
          <div className={styles['gridBody']}>
            <div>
              <Link href={`/venue/events/${event.id}`}>{event.name}</Link>
              <span>
                {event.isTonight
                  ? `Tonight, ${event.time}`
                  : `${event.dayLabel}, ${event.dateLabel}`}
              </span>
            </div>
            <span className={styles['status']} data-tone={statusTone(event)}>
              <i aria-hidden="true" />
              {event.status}
            </span>
            <TicketProgress event={event} />
            <Link className={styles['gridAction']} href={`/venue/events/${event.id}`}>
              {event.status === 'Draft' ? 'Continue' : 'View'}
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}

function TicketProgress({ event }: { readonly event: VenueEvent }) {
  return (
    <div className={styles['ticketCell']}>
      <strong>
        {event.ticketsSold.toLocaleString('en-IN')} / {event.capacity.toLocaleString('en-IN')}
      </strong>
      <progress
        value={event.pctN}
        max={100}
        data-tone={statusTone(event)}
        aria-label={`${event.name}: ${event.ticketsSold.toLocaleString('en-IN')} of ${event.capacity.toLocaleString('en-IN')} tickets sold`}
      />
    </div>
  );
}
