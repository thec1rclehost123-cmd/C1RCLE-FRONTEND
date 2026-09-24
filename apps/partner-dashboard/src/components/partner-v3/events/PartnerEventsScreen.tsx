'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AddIcon } from '@c1rcle/icons';

import styles from '@/components/partner-v3/events/events.module.css';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import { EventCard } from './EventCard';
import { EventEmptyState } from './EventEmptyState';
import { EventFilterBar } from './EventFilterBar';
import { EventListRow } from './EventListRow';

import type { PartnerEventParty, PartnerEventsData } from '@/data/partner-data-source';

export type PartnerEventStatusFilter = 'all' | 'Live' | 'Draft';
export type PartnerEventView = 'list' | 'grid';

export interface PartnerEventsScreenConfig {
  readonly accent: 'orange' | 'lavender';
  readonly analyticsHref: string;
  readonly createEventHref: string;
  readonly eventsBaseHref: string;
  readonly eventSectionLabel: string;
  readonly partyFilterLabel: string;
  readonly showViewToggle: boolean;
  readonly slotRequestsHref: string;
}

export function parseEventStatus(value: string | undefined): PartnerEventStatusFilter {
  if (value === 'live') return 'Live';
  if (value === 'draft') return 'Draft';
  return 'all';
}

export function parseEventParty(value: string | undefined): PartnerEventParty {
  return value === 'hosts' ? 'hosts' : 'venue';
}

export function parseEventView(value: string | undefined): PartnerEventView {
  return value === 'list' ? 'list' : 'grid';
}

export function PartnerEventsScreen({
  config,
  data,
  initialSearch = '',
  initialStatus = 'all',
  initialParty = 'venue',
  initialView = 'grid',
}: {
  readonly config: PartnerEventsScreenConfig;
  readonly data: PartnerEventsData;
  readonly initialSearch?: string | undefined;
  readonly initialStatus?: PartnerEventStatusFilter | undefined;
  readonly initialParty?: PartnerEventParty | undefined;
  readonly initialView?: PartnerEventView | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialSearch);
  const [status, setStatus] = useState<PartnerEventStatusFilter>(initialStatus);
  const [party, setParty] = useState<PartnerEventParty>(initialParty);
  const [view, setView] = useState<PartnerEventView>(initialView);

  const visibleEvents = useMemo(() => {
    const search = query.trim().toLowerCase();
    return data.events.filter((event) => {
      if (status !== 'all' && event.status !== status) return false;
      if (party !== event.party) return false;
      if (!search) return true;
      return `${event.name} ${event.tag} ${event.venue} ${event.host}`
        .toLowerCase()
        .includes(search);
    });
  }, [data.events, party, query, status]);

  const updateUrl = (next: {
    readonly query?: string;
    readonly status?: PartnerEventStatusFilter;
    readonly party?: PartnerEventParty;
    readonly view?: PartnerEventView;
  }) => {
    const params = new URLSearchParams();
    const nextQuery = next.query ?? query;
    const nextStatus = next.status ?? status;
    const nextParty = next.party ?? party;
    const nextView = next.view ?? view;
    if (nextQuery.trim()) params.set('search', nextQuery.trim());
    if (nextStatus !== 'all') params.set('status', nextStatus.toLowerCase());
    if (nextParty !== 'venue') params.set('party', nextParty);
    if (nextView !== 'grid') params.set('view', nextView);
    const search = params.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    updateUrl({ query: value });
  };
  const onStatusChange = (value: PartnerEventStatusFilter) => {
    setStatus(value);
    updateUrl({ status: value });
  };
  const onPartyChange = (value: PartnerEventParty) => {
    setParty(value);
    updateUrl({ party: value });
  };
  const onViewChange = (value: PartnerEventView) => {
    setView(value);
    updateUrl({ view: value });
  };

  const liveCount = data.events.filter((event) => event.status === 'Live').length;
  const draftCount = data.events.filter((event) => event.status === 'Draft').length;
  const themeClass = config.accent === 'lavender' ? styles['hostTheme'] : '';

  return (
    <PageContainer>
      <div className={[styles['page'], themeClass].filter(Boolean).join(' ')}>
        <header className={styles['pageHeader']}>
          <h1>Events</h1>
          <div className={styles['pageHeaderActions']}>
            <Link className={styles['requestCount']} href={config.slotRequestsHref}>
              <strong>{data.pendingRequestCount}</strong>
              <span>Requests</span>
            </Link>
            <Link className={styles['headerAction']} href={config.slotRequestsHref}>
              Slot Requests <span aria-hidden="true">↗</span>
            </Link>
            <Link
              className={[styles['headerAction'], styles['createAction']].join(' ')}
              href={config.createEventHref}
            >
              <AddIcon size={17} aria-hidden="true" />
              Create event
            </Link>
          </div>
        </header>

        <div className={styles['subTabs']} role="tablist" aria-label="Event views">
          <Link className={styles['subTab']} href={pathname} role="tab" aria-selected="true">
            All events
          </Link>
          <Link
            className={styles['subTab']}
            href={config.analyticsHref}
            role="tab"
            aria-selected="false"
          >
            Analytics
          </Link>
        </div>

        <EventFilterBar
          query={query}
          status={status}
          party={party}
          partyLabel={config.partyFilterLabel}
          showViewToggle={config.showViewToggle}
          view={view}
          counts={{ all: data.events.length, live: liveCount, drafts: draftCount }}
          onQueryChange={onQueryChange}
          onStatusChange={onStatusChange}
          onPartyChange={onPartyChange}
          onViewChange={onViewChange}
        />

        {visibleEvents.length === 0 ? (
          <EventEmptyState
            filtered={Boolean(query.trim()) || status !== 'all' || party !== 'venue'}
          />
        ) : view === 'list' ? (
          <section
            className={styles['eventTable']}
            aria-label={`${config.eventSectionLabel} events list`}
          >
            <div className={styles['eventTableHeader']}>
              <span>Event</span>
              <span>When</span>
              <span>Tickets</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {visibleEvents.map((event) => (
              <EventListRow
                key={event.id}
                event={event}
                href={`${config.eventsBaseHref}/${event.id}`}
                editHref={config.createEventHref}
              />
            ))}
          </section>
        ) : (
          <section
            className={styles['eventGrid']}
            aria-label={`${config.eventSectionLabel} events gallery`}
          >
            {visibleEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                href={`${config.eventsBaseHref}/${event.id}`}
                editHref={config.createEventHref}
              />
            ))}
          </section>
        )}

        <div className={styles['srOnly']} aria-live="polite">
          {visibleEvents.length} events shown. {liveCount} live, {draftCount} drafts.
        </div>
      </div>
    </PageContainer>
  );
}
