'use client';
import Link from 'next/link';
import { useState } from 'react';

import { savedEventPageSchema, savedEventStateSchema } from '@c1rcle/contracts/saved-events';

import { csrfHeaders } from '@/lib/bff/csrf';

import { savedClient } from './client';

import type { SavedEventPage } from '@c1rcle/contracts/saved-events';

const dates = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});
export function SavedEventsView({ initial }: { initial: SavedEventPage }) {
  const [page, setPage] = useState(initial);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function remove(id: string) {
    if (busy) return;
    setBusy(id);
    setError('');
    try {
      const state = await savedClient.put({
        path: `/api/saved-events/${encodeURIComponent(id)}`,
        body: { saved: false },
        schema: savedEventStateSchema,
        headers: csrfHeaders(),
      });
      if (!state.saved)
        setPage((value) => ({
          ...value,
          items: value.items.filter((item) => item.eventId !== id),
        }));
    } catch {
      setError('This event could not be removed. Try again.');
    } finally {
      setBusy('');
    }
  }
  async function more() {
    if (busy || !page.nextCursor) return;
    setBusy('more');
    setError('');
    try {
      const next = await savedClient.get({
        path: `/api/saved-events?cursor=${encodeURIComponent(page.nextCursor)}`,
        schema: savedEventPageSchema,
      });
      setPage((value) => ({
        ...next,
        items: [
          ...new Map([...value.items, ...next.items].map((item) => [item.eventId, item])).values(),
        ],
      }));
    } catch {
      setError('More saved events could not be loaded. Try again.');
    } finally {
      setBusy('');
    }
  }
  return (
    <main className="mx-auto max-w-3xl px-5 pb-28 pt-28 text-white sm:pt-36">
      <Link href="/profile" className="inline-flex min-h-11 items-center text-sm text-white/60">
        ← Profile
      </Link>
      <h1 className="mt-5 text-3xl font-bold">Saved events</h1>
      {error && (
        <p role="alert" className="mt-4 text-sm text-white/70">
          {error}
        </p>
      )}
      {page.items.length === 0 ? (
        <p className="mt-6 text-sm text-white/60">
          No saved events yet.{' '}
          <Link href="/explore" className="underline">
            Explore events
          </Link>
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-white/10">
          {page.items.map(({ eventId, event }) => (
            <li key={eventId} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                {event ? (
                  <Link
                    href={`/event/${encodeURIComponent(event.slug)}`}
                    className="block min-h-11 py-1"
                  >
                    <span className="block break-words font-semibold">{event.title}</span>
                    <span className="mt-1 block text-sm text-white/60">
                      {dates.format(new Date(event.startAt))}
                    </span>
                    {event.status !== 'published' && (
                      <span className="mt-1 block text-xs text-white/60">
                        {event.status.replaceAll('_', ' ')}
                      </span>
                    )}
                  </Link>
                ) : (
                  <span className="text-sm text-white/60">Event unavailable</span>
                )}
              </div>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => void remove(eventId)}
                className="min-h-11 shrink-0 rounded-full px-3 text-sm text-white/65 hover:text-white disabled:opacity-50"
              >
                Unsave
              </button>
            </li>
          ))}
        </ul>
      )}
      {page.nextCursor && (
        <button
          className="mt-5 min-h-11 text-sm underline"
          disabled={Boolean(busy)}
          onClick={() => void more()}
        >
          Show more
        </button>
      )}
    </main>
  );
}
