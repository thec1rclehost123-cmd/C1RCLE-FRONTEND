'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';

import { NextIcon, PreviousIcon, SearchIcon } from '@c1rcle/icons';

import { hostEvents, hostSlotRequests } from './host-studio-model';

import styles from '../venue/screens/VenueEvents.module.css';

// ─── helpers ─────────────────────────────────────────────────────────────────

const s = (name: string) => styles[name] ?? name;

type HostTab = 'upcoming' | 'live' | 'invitations' | 'requests' | 'past';

const STATUS_TONE = {
  Live: 'success',
  Upcoming: 'success',
  Invitation: 'warning',
  Requested: 'warning',
  Completed: 'neutral',
  Pending: 'warning',
  Accepted: 'success',
  Declined: 'danger',
  'Needs changes': 'warning',
} as const satisfies Record<string, 'success' | 'warning' | 'danger' | 'neutral'>;

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  return STATUS_TONE[status as keyof typeof STATUS_TONE] ?? 'neutral';
}

// ─── main component ────────────────────────────────────────────────────────

export function HostEventsScreen({ tab = 'upcoming' }: { readonly tab?: string }) {
  const activeTab = (tab as HostTab) in STATUS_TONE || tab === 'upcoming' || tab === 'live' || tab === 'invitations' || tab === 'requests' || tab === 'past' ? (tab as HostTab) : 'upcoming';
  const [query, setQuery] = useState('');

  const TABS: { key: HostTab; label: string; count?: number }[] = [
    { key: 'upcoming', label: 'Upcoming', count: hostEvents.filter(e => e.status === 'Upcoming').length },
    { key: 'live', label: 'Live', count: hostEvents.filter(e => e.status === 'Live').length },
    { key: 'invitations', label: 'Invitations', count: hostEvents.filter(e => e.status === 'Invitation').length },
    { key: 'requests', label: 'Slot requests', count: hostSlotRequests.length },
    { key: 'past', label: 'Past' },
  ];

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base =
      activeTab === 'live' ? hostEvents.filter(e => e.status === 'Live')
      : activeTab === 'past' ? hostEvents.filter(e => e.status === 'Completed')
      : activeTab === 'invitations' ? hostEvents.filter(e => e.status === 'Invitation')
      : hostEvents.filter(e => e.status === 'Upcoming');
    if (!q) return base;
    return base.filter(e => `${e.name} ${e.venue} ${e.city}`.toLowerCase().includes(q));
  }, [activeTab, query]);

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hostSlotRequests;
    return hostSlotRequests.filter(r => `${r.eventName} ${r.venue}`.toLowerCase().includes(q));
  }, [query]);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (dir === 0) return;
    e.preventDefault();
    const nextIndex = (index + dir + TABS.length) % TABS.length;
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={s('page')}>
      {/* ── page header ── */}
      <header className={s('pageHeader')}>
        <div className={s('pageHeaderCopy')}>
          <h1>Events</h1>
          <p>Dates you host, invitations, and venue slot requests.</p>
        </div>

        <div className={s('pageHeaderActions')}>
          <Link className={s('analyticsAction')} href="/host/events/analytics">
            Analytics <span aria-hidden="true">↗</span>
          </Link>
          <div className={s('tabs')} role="tablist" aria-label="Event groups">
            {TABS.map((item, index) => (
              <button
                key={item.key}
                ref={el => { tabRefs.current[index] = el; }}
                type="button"
                role="tab"
                aria-selected={activeTab === item.key}
                tabIndex={activeTab === item.key ? 0 : -1}
                onClick={() => {
                  window.location.href = `/host/events?tab=${item.key}`;
                }}
                onKeyDown={e => onTabKeyDown(e, index)}
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
            onChange={e => setQuery(e.target.value)}
            placeholder="Search events"
          />
        </label>
        <div className={s('viewToggle')} aria-label="View options" />
      </div>

      {/* ── table ── */}
      {activeTab === 'requests' ? (
        <RequestsTable rows={filteredRequests} />
      ) : activeTab === 'invitations' ? (
        <InvitationsTable rows={filteredEvents} />
      ) : (
        <EventsTable rows={filteredEvents} />
      )}

      {/* ── pagination ── */}
      <footer className={s('pagination')}>
        <span>
          Showing {activeTab === 'requests' ? filteredRequests.length : filteredEvents.length}{' '}
          {activeTab === 'requests' ? 'requests' : 'events'}
        </span>
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
    </div>
  );
}

// ─── events table (Upcoming / Live / Past) ────────────────────────────────

function EventsTable({
  rows,
}: {
  readonly rows: typeof hostEvents;
}) {
  if (rows.length === 0) {
    return (
      <section className={s('emptyState')}>
        <span>No events</span>
        <h2>Nothing here yet.</h2>
        <p>Events you host will appear here once confirmed with a venue.</p>
      </section>
    );
  }
  return (
    <section className={s('eventTable')} aria-label="Hosted events list">
      <table>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">Venue</th>
            <th scope="col">When</th>
            <th scope="col">Guests</th>
            <th scope="col">Status</th>
            <th scope="col" style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((event, index) => (
            <tr key={event.id} tabIndex={0} aria-label={`Open ${event.name}`}>
              <td data-label="Event">
                <div className={s('eventIdentity')}>
                  <Image
                    src={event.poster}
                    alt=""
                    width={160}
                    height={86}
                    sizes="160px"
                    priority={index < 2}
                  />
                  <div>
                    <Link href={`/host/events/${event.id}`}>{event.name}</Link>
                    <span>Hosted event</span>
                  </div>
                </div>
              </td>
              <td data-label="Venue">
                <div className={s('whenCell')}>
                  <strong>{event.venue}</strong>
                  <span>{event.city}</span>
                </div>
              </td>
              <td data-label="When">
                <div className={s('whenCell')}>
                  <strong>{event.date}</strong>
                  <span>{event.time}</span>
                </div>
              </td>
              <td data-label="Guests">
                <GuestCell event={event} />
              </td>
              <td data-label="Status">
                <span className={s('status')} data-tone={statusTone(event.status)}>
                  <i aria-hidden="true" />
                  {event.status}
                </span>
              </td>
              <td data-label="Action" className={s('actionCell')}>
                <Link href={`/host/events/${event.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function GuestCell({ event }: { readonly event: typeof hostEvents[number] }) {
  const confirmed = event.confirmed;
  const allocation = event.guests;
  if (confirmed !== null && allocation !== null) {
    const pct = Math.round((confirmed / allocation) * 100);
    const tone = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'neutral';
    return (
      <div className={s('ticketCell')}>
        <strong>
          {confirmed} / {allocation} confirmed
        </strong>
        <progress
          value={pct}
          max={100}
          data-tone={tone}
          aria-label={`${confirmed} of ${allocation} guests confirmed`}
        />
      </div>
    );
  }
  if (confirmed !== null) {
    return (
      <div className={s('ticketCell')}>
        <strong>{confirmed} confirmed</strong>
      </div>
    );
  }
  return (
    <div className={s('ticketCell')}>
      <strong style={{ color: 'var(--dashboard-text-secondary)' }}>—</strong>
    </div>
  );
}

// ─── invitations table ────────────────────────────────────────────────────

function InvitationsTable({ rows }: { readonly rows: typeof hostEvents }) {
  if (rows.length === 0) {
    return (
      <section className={s('emptyState')}>
        <span>No invitations</span>
        <h2>No active invitations.</h2>
        <p>When a venue invites you to host, it will appear here.</p>
      </section>
    );
  }
  return (
    <section className={s('eventTable')} aria-label="Venue invitations list">
      <table>
        <colgroup>
          <col style={{ width: '30%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">Venue</th>
            <th scope="col">Proposed date</th>
            <th scope="col">Guest allocation</th>
            <th scope="col">Status</th>
            <th scope="col" style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((event, index) => (
            <tr key={event.id} tabIndex={0}>
              <td data-label="Event">
                <div className={s('eventIdentity')}>
                  <Image
                    src={event.poster}
                    alt=""
                    width={160}
                    height={86}
                    sizes="160px"
                    priority={index < 2}
                  />
                  <div>
                    <Link href={`/host/events/invitations/invite-${event.id}`}>{event.name}</Link>
                    <span>Invitation</span>
                  </div>
                </div>
              </td>
              <td data-label="Venue">
                <div className={s('whenCell')}>
                  <strong>{event.venue}</strong>
                  <span>{event.city}</span>
                </div>
              </td>
              <td data-label="Date">
                <div className={s('whenCell')}>
                  <strong>{event.date}</strong>
                  <span>{event.time}</span>
                </div>
              </td>
              <td data-label="Allocation">
                <div className={s('ticketCell')}>
                  <strong>{event.guests !== null ? `${event.guests} guests` : '—'}</strong>
                </div>
              </td>
              <td data-label="Status">
                <span className={s('status')} data-tone="warning">
                  <i aria-hidden="true" />
                  New invitation
                </span>
              </td>
              <td data-label="Action" className={s('actionCell')}>
                <Link href="/host/events/invitations">Review</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// ─── slot requests table ────────────────────────────────────────────────────

function RequestsTable({ rows }: { readonly rows: typeof hostSlotRequests }) {
  if (rows.length === 0) {
    return (
      <section className={s('emptyState')}>
        <span>No slot requests</span>
        <h2>No active slot requests.</h2>
        <p>Start an event request to book a venue date.</p>
        <Link href="/host/events/create">Start event request</Link>
      </section>
    );
  }
  return (
    <section className={s('eventTable')} aria-label="Slot requests list">
      <table>
        <colgroup>
          <col style={{ width: '28%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '11%' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Event / Proposal</th>
            <th scope="col">Venue</th>
            <th scope="col">Requested slot</th>
            <th scope="col">Updated</th>
            <th scope="col">Status</th>
            <th scope="col" style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(request => (
            <tr key={request.id} tabIndex={0}>
              <td data-label="Event">
                <div className={s('whenCell')}>
                  <strong>{request.eventName}</strong>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', opacity: 0.55 }}>
                    {request.id}
                  </span>
                </div>
              </td>
              <td data-label="Venue">
                <div className={s('whenCell')}>
                  <strong>{request.venue}</strong>
                </div>
              </td>
              <td data-label="Slot">
                <div className={s('whenCell')}>
                  <strong>{request.date}</strong>
                  <span>{request.time}</span>
                </div>
              </td>
              <td data-label="Updated">
                <div className={s('whenCell')}>
                  <strong>{request.updatedAt}</strong>
                </div>
              </td>
              <td data-label="Status">
                <span className={s('status')} data-tone={statusTone(request.status)}>
                  <i aria-hidden="true" />
                  {request.status}
                </span>
              </td>
              <td data-label="Action" className={s('actionCell')}>
                <Link href={`/host/events/requests/${request.id}`}>View request</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function HostInvitationsScreen() {
  return <HostEventsScreen tab="invitations" />;
}
