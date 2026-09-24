'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { ChevronDownIcon, FilterIcon, NextIcon, PreviousIcon, SearchIcon } from '@c1rcle/icons';

import {
  ConfirmationDialog,
  DashboardDrawer,
  DashboardToast,
} from '@/components/partner-shell/DashboardInteractiveUi';
import { formatInr } from '@/lib/partner/contracts';

import styles from '../venue/screens/VenueEvents.module.css';

import type { PromoterEvent } from '@/lib/partner/contracts';

// ─── helpers ─────────────────────────────────────────────────────────────────

const s = (name: string) => styles[name] ?? name;

type PromoterTab = 'linked' | 'invitations' | 'available' | 'past';

const STATUS_TONE = {
  active: 'success',
  invited: 'warning',
  requested: 'warning',
  paused: 'neutral',
  completed: 'neutral',
  declined: 'danger',
} as const;

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  return (STATUS_TONE as Record<string, 'success' | 'warning' | 'danger' | 'neutral'>)[status] ?? 'neutral';
}

function statusLabel(status: PromoterEvent['status']): string {
  if (status === 'active') return 'Active';
  if (status === 'invited') return 'Invited';
  if (status === 'requested') return 'Requested';
  if (status === 'paused') return 'Paused';
  if (status === 'completed') return 'Completed';
  return status;
}

// ─── PromoterEventsScreen ─────────────────────────────────────────────────

export function PromoterEventsScreen({
  linkedEvents,
  discoveryEvents,
  activeTab: initialTab,
}: {
  readonly linkedEvents: readonly PromoterEvent[];
  readonly discoveryEvents: readonly PromoterEvent[];
  readonly activeTab: string;
}) {
  const startTab: PromoterTab =
    initialTab === 'invitations'
      ? 'invitations'
      : initialTab === 'available'
        ? 'available'
        : initialTab === 'past'
          ? 'past'
          : 'linked';

  const [tab, setTab] = useState<PromoterTab>(startTab);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All cities');
  const [category, setCategory] = useState('All categories');
  const [commission, setCommission] = useState('All models');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<PromoterEvent | null>(null);
  const [requestState, setRequestState] = useState<
    'idle' | 'confirming' | 'submitting' | 'prepared'
  >('idle');

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const TABS: { key: PromoterTab; label: string; count?: number }[] = [
    {
      key: 'linked',
      label: 'Linked',
      count: linkedEvents.filter((e) => e.status === 'active' || e.status === 'requested').length,
    },
    {
      key: 'invitations',
      label: 'Invitations',
      count: linkedEvents.filter((e) => e.status === 'invited').length,
    },
    { key: 'available', label: 'Available', count: discoveryEvents.length },
    { key: 'past', label: 'Past' },
  ];

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (dir === 0) return;
    e.preventDefault();
    const next = (index + dir + TABS.length) % TABS.length;
    tabRefs.current[next]?.focus();
    const nextTab = TABS[next];
    if (nextTab) setTab(nextTab.key);
  };

  const linkedRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base =
      tab === 'invitations'
        ? linkedEvents.filter((e) => e.status === 'invited')
        : tab === 'past'
          ? linkedEvents.filter((e) => e.status === 'completed' || e.status === 'declined')
          : linkedEvents.filter(
              (e) => e.status === 'active' || e.status === 'requested' || e.status === 'paused',
            );
    if (!q) return base;
    return base.filter((e) =>
      `${e.name} ${e.venue} ${e.host} ${e.category}`.toLowerCase().includes(q),
    );
  }, [linkedEvents, tab, query]);

  const discoveryRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return discoveryEvents.filter((e) => {
      if (q && !`${e.name} ${e.venue} ${e.host} ${e.category}`.toLowerCase().includes(q))
        return false;
      if (city !== 'All cities' && e.city !== city) return false;
      if (
        category !== 'All categories' &&
        !e.category.toLowerCase().includes(category.toLowerCase())
      )
        return false;
      if (commission === 'Per ticket' && !e.commissionLabel.includes('/ ticket')) return false;
      if (commission === 'Percentage' && !e.commissionLabel.includes('%')) return false;
      return true;
    });
  }, [discoveryEvents, query, city, category, commission]);

  const hasFilters =
    city !== 'All cities' || category !== 'All categories' || commission !== 'All models';
  const clearFilters = () => {
    setQuery('');
    setCity('All cities');
    setCategory('All categories');
    setCommission('All models');
  };
  const confirmRequest = () => {
    setRequestState('submitting');
    window.setTimeout(() => { setRequestState('prepared'); }, 550);
  };

  return (
    <div className={s('page')}>
      {/* ── page header ── */}
      <header className={s('pageHeader')}>
        <div className={s('pageHeaderCopy')}>
          <h1>Events</h1>
          <p>Events you promote, invitations, and available opportunities.</p>
        </div>
        <div className={s('pageHeaderActions')}>
          <div className={s('tabs')} role="tablist" aria-label="Event groups">
            {TABS.map((item, index) => (
              <button
                key={item.key}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                aria-selected={tab === item.key}
                tabIndex={tab === item.key ? 0 : -1}
                onClick={() => {
                  setTab(item.key);
                  setQuery('');
                }}
                onKeyDown={(e) => { onTabKeyDown(e, index); }}
              >
                {item.label}
                {item.count !== undefined ? <span>{item.count}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── toolbar ── */}
      <div className={s('toolbar')} aria-label="Search and filter events">
        <label className={s('searchControl')}>
          <span className={s('srOnly')}>Search events</span>
          <SearchIcon size={20} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder="Search events"
          />
        </label>

        {tab === 'available' ? (
          <div className={s('filterWrap')}>
            <button
              className={s('filterButton')}
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="promoter-event-filters"
              onClick={() => { setFiltersOpen((o) => !o); }}
            >
              <FilterIcon size={19} aria-hidden="true" />
              Filters
              {hasFilters ? <span aria-label="Filters active" /> : null}
            </button>
            {filtersOpen ? (
              <div
                id="promoter-event-filters"
                className={s('filterPopover')}
                aria-label="Event filters"
              >
                <label>
                  <span>City</span>
                  <select value={city} onChange={(e) => { setCity(e.target.value); }}>
                    <option>All cities</option>
                    <option>Mumbai</option>
                    <option>Pune</option>
                  </select>
                  <ChevronDownIcon size={15} aria-hidden="true" />
                </label>
                <label>
                  <span>Category</span>
                  <select value={category} onChange={(e) => { setCategory(e.target.value); }}>
                    <option>All categories</option>
                    <option>Techno</option>
                    <option>Indie</option>
                    <option>Culture</option>
                  </select>
                  <ChevronDownIcon size={15} aria-hidden="true" />
                </label>
                <label>
                  <span>Commission</span>
                  <select value={commission} onChange={(e) => { setCommission(e.target.value); }}>
                    <option>All models</option>
                    <option>Per ticket</option>
                    <option>Percentage</option>
                  </select>
                  <ChevronDownIcon size={15} aria-hidden="true" />
                </label>
                <div className={s('filterActions')}>
                  <button type="button" onClick={clearFilters} disabled={!hasFilters}>
                    Clear
                  </button>
                  <button type="button" onClick={() => { setFiltersOpen(false); }}>
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className={s('viewToggle')} />
        )}
      </div>

      {/* ── body ── */}
      {tab === 'available' ? (
        <DiscoveryGrid
          events={discoveryRows}
          onSelect={setSelected}
          hasFilters={Boolean(query.trim()) || hasFilters}
          onClear={clearFilters}
        />
      ) : (
        <LinkedTable rows={linkedRows} tab={tab} />
      )}

      {/* ── pagination (non-discovery) ── */}
      {tab !== 'available' ? (
        <footer className={s('pagination')}>
          <span>Showing {linkedRows.length} events</span>
          <nav aria-label="Event pages">
            <button type="button" disabled>
              <PreviousIcon size={18} aria-hidden="true" />
              Previous
            </button>
            <button type="button" disabled>
              Next
              <NextIcon size={18} aria-hidden="true" />
            </button>
          </nav>
        </footer>
      ) : null}

      {/* ── drawer + confirm (Available tab) ── */}
      <DashboardDrawer
        open={selected !== null}
        title={selected?.name ?? 'Event opportunity'}
        description={
          selected ? `${selected.date} · ${selected.time} · ${selected.city}` : undefined
        }
        onClose={() => {
          setSelected(null);
          setRequestState('idle');
        }}
      >
        {selected ? (
          <div className="promoter-opportunity-detail">
            <div className="promoter-opportunity-identity">
              <span>Venue</span>
              <strong>{selected.venue}</strong>
              <small>Verified partner</small>
            </div>
            <div className="promoter-opportunity-identity">
              <span>Host</span>
              <strong>{selected.host}</strong>
              <small>{selected.category}</small>
            </div>
            <section>
              <span>Promoter terms</span>
              <strong>{selected.commissionLabel}</strong>
              <p>
                Attribution window and refund rules must be confirmed by the backend event
                agreement.
              </p>
            </section>
            <section>
              <span>Application deadline</span>
              <strong>3 days remaining</strong>
              <p>Requesting access never creates or edits the event.</p>
            </section>
            <button
              type="button"
              className="pd-button pd-button--primary"
              onClick={() => { setRequestState('confirming'); }}
            >
              Request partnership
            </button>
          </div>
        ) : null}
      </DashboardDrawer>
      <ConfirmationDialog
        open={requestState === 'confirming' || requestState === 'submitting'}
        title={`Request access to ${selected?.name ?? 'this event'}?`}
        description="This frontend will prepare the request state only. The backend integration must submit the authoritative partnership request and prevent duplicates."
        confirmLabel="Prepare request"
        busy={requestState === 'submitting'}
        onConfirm={confirmRequest}
        onCancel={() => { setRequestState('idle'); }}
      />
      <DashboardToast
        message={
          requestState === 'prepared'
            ? 'Request preview prepared. Nothing was sent to a live partner.'
            : null
        }
      />
    </div>
  );
}

// ─── LinkedTable — Linked / Invitations / Past ────────────────────────────

function LinkedTable({
  rows,
  tab,
}: {
  readonly rows: readonly PromoterEvent[];
  readonly tab: PromoterTab;
}) {
  if (rows.length === 0) {
    return (
      <section className={s('emptyState')}>
        <span>{tab === 'invitations' ? 'No invitations' : 'No events'}</span>
        <h2>{tab === 'invitations' ? 'No active invitations.' : 'Nothing here yet.'}</h2>
        <p>
          {tab === 'invitations'
            ? 'When a venue or host invites you to promote, it will appear here.'
            : 'Discover an opportunity or accept an invite from a venue or host.'}
        </p>
      </section>
    );
  }

  const isInvitations = tab === 'invitations';

  return (
    <section className={s('eventTable')} aria-label="Promoter events list">
      <table>
        <colgroup>
          <col className={isInvitations ? 'w-[28%]' : 'w-[24%]'} />
          <col className={isInvitations ? 'w-[17%]' : 'w-[14%]'} />
          <col className={isInvitations ? 'w-[17%]' : 'w-[14%]'} />
          <col className={isInvitations ? 'w-[16%]' : 'w-[14%]'} />
          {!isInvitations ? <col className="w-[15%]" /> : null}
          <col className="w-[9%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">Partner</th>
            <th scope="col">When</th>
            <th scope="col">Commission</th>
            {!isInvitations ? <th scope="col">Performance</th> : null}
            <th scope="col">Status</th>
            <th scope="col" className="text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((event, index) => (
            <tr key={event.id} tabIndex={0}>
              <td data-label="Event">
                <div className={s('eventIdentity')}>
                  <EventPosterFallback eventId={event.id} name={event.name} index={index} />
                  <div>
                    <Link href={`/promoter/events/${event.id}`}>{event.name}</Link>
                    <span>{event.category}</span>
                  </div>
                </div>
              </td>
              <td data-label="Partner">
                <div className={s('whenCell')}>
                  <strong>{event.venue}</strong>
                  <span>{event.host}</span>
                </div>
              </td>
              <td data-label="When">
                <div className={s('whenCell')}>
                  <strong>{event.date}</strong>
                  <span>{event.time}</span>
                </div>
              </td>
              <td data-label="Commission">
                <div className={s('whenCell')}>
                  <strong>{event.commissionLabel}</strong>
                </div>
              </td>
              {!isInvitations ? (
                <td data-label="Performance">
                  <div className={s('whenCell')}>
                    <strong>{event.tickets} tickets</strong>
                    <span>{formatInr(event.earningsPaise)} earned</span>
                  </div>
                </td>
              ) : null}
              <td data-label="Status">
                <span className={s('status')} data-tone={statusTone(event.status)}>
                  <i aria-hidden="true" />
                  {statusLabel(event.status)}
                </span>
              </td>
              <td data-label="Action" className={s('actionCell')}>
                <Link href={`/promoter/events/${event.id}`}>
                  {isInvitations ? 'Review' : 'View'}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ─── Discovery cards (Available tab) ────────────────────────────────────────

const DISCOVERY_CARD_POSTERS: Record<string, string> = {
  bassline: '/venue/events/warehouse-rave.webp',
  sunset: '/venue/events/sunset-sessions.webp',
  monsoon: '/venue/events/monsoon-sessions.webp',
  bollywood: '/venue/events/bollywood-brunch.webp',
};

function resolveDiscoveryPoster(id: string): string | null {
  for (const [key, src] of Object.entries(DISCOVERY_CARD_POSTERS)) {
    if (id.includes(key)) return src;
  }
  return null;
}

function DiscoveryGrid({
  events,
  onSelect,
  hasFilters,
  onClear,
}: {
  readonly events: readonly PromoterEvent[];
  readonly onSelect: (event: PromoterEvent) => void;
  readonly hasFilters: boolean;
  readonly onClear: () => void;
}) {
  if (events.length === 0) {
    return (
      <section className={s('emptyState')}>
        <span>No matches</span>
        <h2>Try a wider search.</h2>
        <p>Clear a city, category or commission filter to see more verified opportunities.</p>
        {hasFilters ? (
          <button type="button" onClick={onClear}>
            Clear filters
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className={s('eventGrid')} aria-label="Available promoter opportunities">
      {events.map((event, index) => {
        const posterSrc = resolveDiscoveryPoster(event.id);
        return (
          <article key={event.id}>
            {posterSrc ? (
              <Image
                src={posterSrc}
                alt={event.name}
                width={480}
                height={180}
                sizes="(max-width: 640px) 100vw, (max-width: 1000px) 50vw, 33vw"
                priority={index < 3}
                className="object-cover w-full h-[180px]"
              />
            ) : (
              <div
                className="w-full h-[180px] bg-[var(--dashboard-surface-elevated)] flex items-center justify-center text-[var(--dashboard-text-secondary)] text-[13px]"
              >
                {event.category}
              </div>
            )}
            <div className={s('gridBody')}>
              <div>
                <Link href={`/promoter/events/${event.id}`}>{event.name}</Link>
                <span>
                  {event.venue} · {event.city}
                </span>
                <span>
                  {event.date} · {event.time}
                </span>
              </div>
              <span className={s('status')} data-tone="warning">
                <i aria-hidden="true" />
                Open
              </span>
              <div className={s('ticketCell')}>
                <strong>{event.commissionLabel}</strong>
              </div>
              <button type="button" className={s('gridAction')} onClick={() => { onSelect(event); }}>
                View opportunity
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

// ─── poster fallback for table rows ─────────────────────────────────────────

function EventPosterFallback({
  eventId,
  name,
  index,
}: {
  readonly eventId: string;
  readonly name: string;
  readonly index: number;
}) {
  const knownPosters: Record<string, string> = {
    bassline: '/venue/events/warehouse-rave.webp',
    sunset: '/venue/events/sunset-sessions.webp',
    monsoon: '/venue/events/monsoon-sessions.webp',
    bollywood: '/venue/events/bollywood-brunch.webp',
    neon: '/venue/neon-nights-poster.webp',
  };
  let src: string | null = null;
  for (const [key, path] of Object.entries(knownPosters)) {
    if (eventId.includes(key)) {
      src = path;
      break;
    }
  }
  if (src) {
    return <Image src={src} alt="" width={160} height={86} sizes="160px" priority={index < 2} />;
  }
  return (
    <div
      className="w-[160px] h-[86px] bg-[var(--dashboard-surface-elevated)] rounded-[var(--dashboard-radius-control)] flex items-center justify-center text-[var(--dashboard-text-secondary)] text-[22px] font-bold flex-shrink-0"
    >
      {name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)}
    </div>
  );
}
