'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  CalendarIcon,
  ForwardIcon,
  LinkIcon,
  LocationIcon,
  SearchIcon,
  TimeIcon,
} from '@c1rcle/icons';

import { FixtureBadge } from '@/components/partner-v3/FixtureBadge';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import { EventEmptyState } from './EventEmptyState';
import { EventPoster } from './EventPoster';
import styles from './events.module.css';

import type { PromoterEventsData } from '@/data/partner-data-source';

type PromoterEventsTab = 'discover' | 'linked' | 'invitations';

const cityOptions = ['all', 'Pune', 'Mumbai'] as const;
type PromoterCity = (typeof cityOptions)[number];

export function PromoterEventsScreen({
  data,
  initialCity = 'all',
  initialSearch = '',
  initialTab = 'discover',
}: {
  readonly data: PromoterEventsData;
  readonly initialCity?: string | undefined;
  readonly initialSearch?: string | undefined;
  readonly initialTab?: PromoterEventsTab | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<PromoterEventsTab>(initialTab);
  const [query, setQuery] = useState(initialSearch);
  const [city, setCity] = useState<PromoterCity>(
    cityOptions.includes(initialCity as PromoterCity) ? (initialCity as PromoterCity) : 'all',
  );

  const visibleDiscoverEvents = useMemo(
    () => filterEvents(data.discoverEvents, query, data.dataStatus === 'fixture' ? city : 'all'),
    [city, data.dataStatus, data.discoverEvents, query],
  );
  const visibleLinkedEvents = useMemo(
    () => filterEvents(data.linkedEvents, query, data.dataStatus === 'fixture' ? city : 'all'),
    [city, data.dataStatus, data.linkedEvents, query],
  );
  const eventHref = (eventId: string) => `${pathname}/${eventId}`;

  const updateUrl = (next: {
    readonly tab?: PromoterEventsTab;
    readonly query?: string;
    readonly city?: PromoterCity;
  }) => {
    const params = new URLSearchParams();
    const nextTab = next.tab ?? tab;
    const nextQuery = next.query ?? query;
    const nextCity = next.city ?? city;
    if (nextTab !== 'discover') params.set('tab', nextTab);
    if (nextQuery.trim()) params.set('search', nextQuery.trim());
    if (nextCity !== 'all') params.set('city', nextCity);
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  const onTabChange = (nextTab: PromoterEventsTab) => {
    setTab(nextTab);
    updateUrl({ tab: nextTab });
  };
  const onQueryChange = (value: string) => {
    setQuery(value);
    updateUrl({ query: value });
  };
  const onCityChange = (value: PromoterCity) => {
    setCity(value);
    updateUrl({ city: value });
  };
  const visibleInvitations = filterEvents(data.invitations, query, 'all');
  const visibleEvents =
    tab === 'discover'
      ? visibleDiscoverEvents
      : tab === 'invitations'
        ? visibleInvitations
        : visibleLinkedEvents;

  return (
    <PageContainer>
      <div className={styles['page']}>
        <div className={styles['promoterPage']}>
          <h1>Events</h1>
          <FixtureBadge dataStatus={data.dataStatus} />
          <div className={styles['promoterTabs']} role="tablist" aria-label="Promoter event views">
            <button
              className={styles['promoterTab']}
              type="button"
              role="tab"
              aria-selected={tab === 'discover'}
              onClick={() => {
                onTabChange('discover');
              }}
            >
              Discover <span className={styles['promoterTabCount']}>{data.discoverCount}</span>
            </button>
            <button
              className={styles['promoterTab']}
              type="button"
              role="tab"
              aria-selected={tab === 'linked'}
              onClick={() => {
                onTabChange('linked');
              }}
            >
              Linked Events <span className={styles['promoterTabCount']}>{data.linkedCount}</span>
            </button>
            <button
              className={styles['promoterTab']}
              type="button"
              role="tab"
              aria-selected={tab === 'invitations'}
              onClick={() => {
                onTabChange('invitations');
              }}
            >
              Invitations{' '}
              <span className={styles['promoterTabCount']}>{data.invitations.length}</span>
            </button>
          </div>

          <div className={styles['promoterToolbar']} aria-label="Find promoter events">
            <label className={styles['promoterSearch']}>
              <span className={styles['srOnly']}>Search events, venues, or categories</span>
              <SearchIcon size={15} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  onQueryChange(event.target.value);
                }}
                placeholder="Search events, venues, or categories"
              />
            </label>
            {data.dataStatus === 'fixture' ? (
              <select
                className={styles['promoterCity']}
                aria-label="Event city"
                value={city}
                onChange={(event) => {
                  onCityChange(event.target.value as PromoterCity);
                }}
              >
                <option value="all">All Cities</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
              </select>
            ) : null}
          </div>

          {tab === 'discover' && data.dataStatus === 'api' && data.discoverTotal !== undefined ? (
            <p className={styles['promoterLinkedMeta']}>
              {data.discoverHasMore
                ? `Showing ${String(data.discoverCount)} of ${String(data.discoverTotal)} public listings; additional pages are not loaded in this view.`
                : `${String(data.discoverTotal)} public listings available.`}
            </p>
          ) : null}

          {tab === 'linked' && data.dataStatus === 'api' && data.referralLinksHaveMore ? (
            <p className={styles['promoterLinkedMeta']}>
              Click and sale totals include the first 100 referral links only. Additional links are
              not included in these event totals.
            </p>
          ) : null}

          {visibleEvents.length === 0 ? (
            <EventEmptyState
              filtered={Boolean(query.trim()) || (data.dataStatus === 'fixture' && city !== 'all')}
              description="Try a different search or city filter."
            />
          ) : tab === 'discover' ? (
            <section className={styles['promoterGrid']} aria-label="Discover events">
              {visibleDiscoverEvents.map((event) => (
                <DiscoverEventCard
                  key={event.id}
                  event={event}
                  href={eventHref(event.id)}
                  interactive={data.dataStatus === 'fixture'}
                />
              ))}
            </section>
          ) : tab === 'invitations' ? (
            <section className={styles['promoterGrid']} aria-label="Promoter invitations">
              {visibleInvitations.map((event) => (
                <LinkedEventCard
                  key={event.assignmentId ?? event.id}
                  event={event}
                  href={eventHref(event.id)}
                  interactive
                />
              ))}
            </section>
          ) : (
            <section className={styles['promoterGrid']} aria-label="Linked events">
              {visibleLinkedEvents.map((event) => (
                <LinkedEventCard
                  key={event.id}
                  event={event}
                  href={eventHref(event.id)}
                  interactive
                />
              ))}
            </section>
          )}

          <div className={styles['srOnly']} aria-live="polite">
            {visibleEvents.length} {tab === 'discover' ? 'discoverable' : 'linked'} events shown.
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function filterEvents<
  T extends { readonly name: string; readonly venue: string; readonly city: string },
>(events: readonly T[], query: string, city: PromoterCity): readonly T[] {
  const search = query.trim().toLowerCase();
  return events.filter((event) => {
    if (city !== 'all' && event.city !== city) return false;
    return !search || `${event.name} ${event.venue}`.toLowerCase().includes(search);
  });
}

function DiscoverEventCard({
  event,
  href,
  interactive,
}: {
  readonly event: PromoterEventsData['discoverEvents'][number];
  readonly href: string;
  readonly interactive: boolean;
}) {
  const isPending = event.accessState === 'pending';
  const poster = (
    <div className={styles['promoterPoster']}>
      <EventPoster artwork={event.artwork} sizes="(max-width: 700px) 100vw, 320px" />
      <span
        className={[
          styles['promoterBadge'],
          isPending ? styles['promoterBadgePending'] : styles['promoterBadgeAccess'],
        ].join(' ')}
      >
        {isPending
          ? 'Request Pending'
          : event.accessState === 'public'
            ? 'Public listing'
            : 'Access Required'}
      </span>
    </div>
  );
  const details = (
    <>
      <div className={styles['promoterEventTitle']}>{event.name}</div>
      <div className={styles['promoterVenue']}>
        <LocationIcon size={12} aria-hidden="true" />
        {event.venue}
      </div>
      <div className={styles['promoterEventMeta']}>
        <span>
          <CalendarIcon size={12} aria-hidden="true" />
          {event.dateLabel}
        </span>
        <span>
          <TimeIcon size={12} aria-hidden="true" />
          {event.timeLabel}
        </span>
      </div>
    </>
  );
  return (
    <article className={styles['promoterCard']}>
      {interactive ? (
        <Link
          className={styles['promoterPosterLink']}
          href={href}
          aria-label={`${event.name} event`}
        >
          {poster}
        </Link>
      ) : (
        <div className={styles['promoterPosterLink']}>{poster}</div>
      )}
      <div className={styles['promoterCardBody']}>
        {interactive ? (
          <Link className={styles['promoterEventLink']} href={href}>
            {details}
          </Link>
        ) : (
          <div className={styles['promoterEventLink']}>{details}</div>
        )}
        {event.accessState === 'public' ? (
          <p className={styles['promoterAction']}>
            Promotion tools require a host-issued assignment.
          </p>
        ) : isPending ? (
          <button
            className={[styles['promoterAction'], styles['promoterActionPending']].join(' ')}
            type="button"
            disabled
          >
            <TimeIcon size={14} aria-hidden="true" />
            Request Pending
          </button>
        ) : (
          <Link className={styles['promoterAction']} href={href}>
            <ForwardIcon size={14} aria-hidden="true" />
            Request Promotion Access
          </Link>
        )}
      </div>
    </article>
  );
}

function LinkedEventCard({
  event,
  href,
  interactive,
}: {
  readonly event: PromoterEventsData['linkedEvents'][number];
  readonly href: string;
  readonly interactive: boolean;
}) {
  const details = (
    <>
      <div className={styles['promoterEventTitle']}>{event.name}</div>
      <div className={styles['promoterVenue']}>
        <LocationIcon size={12} aria-hidden="true" />
        {event.venue}
      </div>
      <div className={styles['promoterLinkedMeta']}>
        <LinkIcon size={13} aria-hidden="true" />
        {event.clicks === null ? 'Clicks unavailable' : `${String(event.clicks)} clicks`} ·{' '}
        {event.sales === null ? 'sales unavailable' : `${String(event.sales)} sales`}
      </div>
      {event.commissionLabel ? (
        <div className={styles['promoterLinkedMeta']}>{event.commissionLabel}</div>
      ) : null}
      {event.assignmentStatus ? (
        <div className={styles['promoterLinkedMeta']}>
          {event.assignmentStatus === 'invited' ? 'Invitation pending' : event.assignmentStatus}
        </div>
      ) : null}
    </>
  );
  return (
    <article className={styles['promoterCard']}>
      {interactive ? (
        <Link
          className={styles['promoterPosterLink']}
          href={href}
          aria-label={`${event.name} linked event`}
        >
          <div className={styles['promoterPoster']}>
            <EventPoster artwork={event.artwork} sizes="(max-width: 700px) 100vw, 320px" />
          </div>
        </Link>
      ) : (
        <div className={styles['promoterPosterLink']}>
          <div className={styles['promoterPoster']}>
            <EventPoster artwork={event.artwork} sizes="(max-width: 700px) 100vw, 320px" />
          </div>
        </div>
      )}
      <div className={styles['promoterCardBody']}>
        {interactive ? (
          <Link className={styles['promoterLinkedCard']} href={href}>
            {details}
          </Link>
        ) : (
          <div className={styles['promoterLinkedCard']}>{details}</div>
        )}
      </div>
    </article>
  );
}
