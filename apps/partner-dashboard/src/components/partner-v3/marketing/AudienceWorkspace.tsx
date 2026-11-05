'use client';

import { useState } from 'react';

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
  const rows = data.rows.filter((row) => selected.has(row.id));
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
      <h1>Marketing</h1>
      <form className={styles['filters']} method="get" action={`/partner/${studio}/marketing`}>
        <label className={styles['search']}>
          <span>Search by name</span>
          <input name="search" defaultValue={search} placeholder="Search by name" maxLength={120} />
        </label>
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
        <button type="submit">Apply</button>
      </form>
      <div className={styles['selection']}>
        <span>
          <strong>{selected.size} selected</strong> · {data.total} matching event attendees
        </span>
        <div>
          <button
            type="button"
            onClick={() => {
              setSelected(new Set(data.rows.map((row) => row.id)));
            }}
          >
            Select visible ({data.rows.length})
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
          <button
            className={styles['primary']}
            type="button"
            disabled={!selected.size}
            onClick={() => {
              setComposing(true);
            }}
          >
            Send marketing blast
          </button>
        </div>
      </div>
      <div className={styles['tableWrap']}>
        <table>
          <caption>
            Current claimed holders · tickets are valid units, not people. Total spend is each
            account’s own net event purchases, including fees and taxes. Selection covers this page
            only.
          </caption>
          <thead>
            <tr>
              <th scope="col">Select</th>
              <th scope="col">Name</th>
              <th scope="col">Event</th>
              <th scope="col">Tickets</th>
              <th scope="col">Total spend</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} data-selected={selected.has(row.id)}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${row.name} for ${row.eventName}`}
                    checked={selected.has(row.id)}
                    onChange={() => {
                      toggle(row.id);
                    }}
                  />
                </td>
                <th scope="row">{row.name}</th>
                <td>{row.eventName}</td>
                <td>{row.tickets}</td>
                <td>{money.format(row.totalSpendPaise / 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.rows.length ? (
          <p className={styles['empty']}>No current attendees match these filters.</p>
        ) : null}
      </div>
      <div className={styles['pagination']}>
        <span>
          {data.rows.length ? offset + 1 : 0}–{offset + data.rows.length} of {data.total}
        </span>
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
          onClose={() => {
            setComposing(false);
          }}
        />
      ) : null}
    </main>
  );
}
