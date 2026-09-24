'use client';

import { useState } from 'react';


import { CopyLinkButton } from './PromoterShareActions';

import type { PromoterEventLinkRow } from './PromoterLinksTable';
import type { PromoterEvent } from '@/lib/partner/contracts';

const channels = ['Instagram', 'WhatsApp', 'Bio', 'Direct'] as const;

export function PromoterLinkBuilder({
  events,
  links,
}: {
  readonly events: readonly PromoterEvent[];
  readonly links: readonly PromoterEventLinkRow[];
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? '');
  const [channel, setChannel] = useState<(typeof channels)[number]>('Instagram');
  const [label, setLabel] = useState('');
  const [selected, setSelected] = useState<PromoterEventLinkRow | null>(null);
  const selectedLink = links.find((link) => link.eventId === eventId) ?? null;

  return (
    <section className="promoter-link-builder pd-surface" aria-labelledby="get-link-title">
      <header>
        <div>
          <h2 id="get-link-title">Get link</h2>
        </div>
      </header>
      <div className="promoter-link-form">
        <label>
          <span>Event</span>
          <select
            value={eventId}
            onChange={(event) => {
              setEventId(event.target.value);
              setSelected(null);
            }}
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Source</span>
          <select
            value={channel}
            onChange={(event) => { setChannel(event.target.value as (typeof channels)[number]); }}
          >
            {channels.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          <span>
            Campaign label <small>Optional</small>
          </span>
          <input
            value={label}
            onChange={(event) => { setLabel(event.target.value); }}
            maxLength={40}
            placeholder="e.g. August story"
          />
        </label>
        <button
          type="button"
          onClick={() => { setSelected(selectedLink); }}
          disabled={!selectedLink}
          title={
            !selectedLink ? 'No permanent tracked link is available for this event.' : undefined
          }
        >
          Get link
        </button>
      </div>
      {selected ? (
        <div className="promoter-link-result" aria-live="polite">
          <div>
            <span>{selected.eventName}</span>
            <strong>Permanent tracked link</strong>
            <code>{selected.shortUrl}</code>
            <small>
              {channel}
              {label.trim() ? ` · ${label.trim()}` : ''} · one link for this event
            </small>
          </div>
          <div className="promoter-link-result-actions">
            <CopyLinkButton value={`https://${selected.shortUrl}`} label="Copy" />
            <a href={`https://${selected.shortUrl}`} target="_blank" rel="noreferrer">
              View
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
