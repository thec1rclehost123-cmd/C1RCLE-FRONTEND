'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './audience.module.css';
import { BlastComposer } from './BlastComposer';

import type { MarketingAudience } from '@c1rcle/contracts/partner-marketing';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export function AudienceWorkspace({
  data,
  studio,
  search = '',
  eventId = '',
  tierId = '',
  offset = 0,
}: {
  readonly data: MarketingAudience;
  readonly studio: string;
  readonly search?: string | undefined;
  readonly eventId?: string | undefined;
  readonly tierId?: string | undefined;
  readonly offset?: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [composing, setComposing] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(Boolean(search || eventId || tierId));
  const [ticketSegment, setTicketSegment] = useState<'all' | 'single' | 'group'>('all');
  const selectVisible = useRef<HTMLInputElement>(null);
  const rows = data.rows.filter((row) => selected.has(row.id));
  const visibleRows = data.rows.filter((row) =>
    ticketSegment === 'all'
      ? true
      : ticketSegment === 'single'
        ? row.tickets === 1
        : row.tickets > 1,
  );
  const allVisibleSelected =
    visibleRows.length > 0 && visibleRows.every((row) => selected.has(row.id));
  const someVisibleSelected = visibleRows.some((row) => selected.has(row.id));
  useEffect(() => {
    if (selectVisible.current)
      selectVisible.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }, [allVisibleSelected, someVisibleSelected]);
  const toggleVisible = () => {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleRows.forEach((row) => next.delete(row.id));
      else visibleRows.forEach((row) => next.add(row.id));
      return next;
    });
  };
  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const nextQuery = new URLSearchParams({
    search,
    eventId,
    tierId,
    offset: String(data.nextOffset ?? 0),
  });
  return (
    <main className={styles['workspace']}>
      <header className={styles['pageHeader']}>
        <div>
          <h1>Marketing</h1>
          <p>Reach the current ticket holders for your events.</p>
        </div>
        <button
          className={styles['primary']}
          type="button"
          disabled={!selected.size}
          onClick={() => {
            setComposing(true);
          }}
        >
          Compose message
        </button>
      </header>
      <form className={styles['filters']} method="get" action={`/partner/${studio}/marketing`}>
        <label className={styles['search']}>
          <span>Search attendees by name</span>
          <input
            name="search"
            defaultValue={search}
            placeholder="Search attendees by name…"
            maxLength={120}
          />
        </label>
        <button
          className={styles['filterToggle']}
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="marketing-audience-filters"
          onClick={() => {
            setFiltersOpen((open) => !open);
          }}
        >
          Filters{eventId || tierId ? ' · Active' : ''}
        </button>
        {filtersOpen ? (
          <div className={styles['filterOptions']} id="marketing-audience-filters">
            <label>
              <span>Event</span>
              <select name="eventId" defaultValue={eventId}>
                <option value="">All events</option>
                {data.events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Ticket type</span>
              <select name="tierId" defaultValue={tierId}>
                <option value="">All ticket types</option>
                {data.tiers
                  .filter((tier) => !eventId || tier.eventId === eventId)
                  .map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name}
                      {!eventId
                        ? ` · ${data.events.find((e) => e.id === tier.eventId)?.name ?? ''}`
                        : ''}
                    </option>
                  ))}
              </select>
            </label>
            <button type="submit">Apply filters</button>
          </div>
        ) : null}
      </form>
      <nav className={styles['segments']} aria-label="Ticket count filter">
        {(
          [
            ['all', 'All', data.rows.length],
            ['single', '1 ticket', data.rows.filter((row) => row.tickets === 1).length],
            ['group', 'Group bookings', data.rows.filter((row) => row.tickets > 1).length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            aria-pressed={ticketSegment === value}
            onClick={() => {
              setTicketSegment(value);
            }}
          >
            {label}
            <span>{count}</span>
          </button>
        ))}
      </nav>
      <div className={styles['selection']}>
        <span>
          <strong>{selected.size} selected</strong> · {data.total} matching current holders
        </span>
        <div>
          <button type="button" disabled={!visibleRows.length} onClick={toggleVisible}>
            {allVisibleSelected ? 'Deselect visible' : 'Select all visible'}
          </button>
          <button
            type="button"
            disabled={!selected.size}
            onClick={() => {
              setSelected(new Set());
            }}
          >
            Clear
          </button>
        </div>
      </div>
      <div className={styles['tableWrap']}>
        <table aria-label="Current event ticket holders">
          <caption>
            Names and purchase totals only. This audience endpoint does not provide phone, email, or
            demographic details. Selection applies to the visible page.
          </caption>
          <thead>
            <tr>
              <th scope="col" className={styles['selectColumn']}>
                <input
                  ref={selectVisible}
                  type="checkbox"
                  aria-label="Select all visible attendees"
                  checked={allVisibleSelected}
                  onChange={toggleVisible}
                  disabled={!visibleRows.length}
                />
              </th>
              <th scope="col">Attendee</th>
              <th scope="col">Event</th>
              <th scope="col">Tickets</th>
              <th scope="col">Spend</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, index) => (
              <tr key={row.id} data-selected={selected.has(row.id)}>
                <td className={styles['selectColumn']}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.name} for ${row.eventName}`}
                    checked={selected.has(row.id)}
                    onChange={() => {
                      toggle(row.id);
                    }}
                  />
                </td>
                <th scope="row">
                  <span
                    className={[
                      styles['avatar'],
                      styles[`avatar${String(index % 6)}`] ?? styles['avatar0'],
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {initials(row.name)}
                  </span>
                  <span className={styles['attendeeName']}>{row.name}</span>
                </th>
                <td>{row.eventName}</td>
                <td>{row.tickets}</td>
                <td>{money.format(row.totalSpendPaise / 100)}</td>
                <td>
                  <span className={styles['holderStatus']}>Current holder</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleRows.length ? (
          <p className={styles['empty']}>No current attendees match these filters.</p>
        ) : null}
      </div>
      <div className={styles['pagination']}>
        {ticketSegment === 'all' ? (
          <span>
            {data.rows.length ? offset + 1 : 0}–{offset + data.rows.length} of {data.total}
          </span>
        ) : (
          <span>
            {visibleRows.length} visible in this ticket-count segment · {data.total} total matching
            attendees
          </span>
        )}
        {offset > 0 ? (
          <a
            href={`?${new URLSearchParams({ search, eventId, tierId, offset: String(Math.max(0, offset - 50)) })}`}
          >
            Previous page
          </a>
        ) : null}
        {data.nextOffset !== null ? <a href={`?${nextQuery}`}>Next page</a> : null}
      </div>
      {composing ? (
        <BlastComposer
          audience={rows}
          audienceContext={data.tiers.find((tier) => tier.id === tierId)?.name}
          onRemoveRecipient={toggle}
          onClose={() => {
            setComposing(false);
          }}
        />
      ) : null}
    </main>
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}
