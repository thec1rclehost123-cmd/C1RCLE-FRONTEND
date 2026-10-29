'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

const entrySchema = z.object({
  id: z.string(),
  eventId: z.string(),
  tierId: z.string(),
  sequence: z.number().int().positive(),
  status: z.enum(['waiting', 'offered', 'accepted', 'expired', 'cancelled']),
  offerExpiresAt: z.iso.datetime().nullable(),
});
const entriesSchema = z.object({ items: z.array(entrySchema) });

type WaitlistEntry = z.infer<typeof entrySchema>;

export function WaitlistOffersClient() {
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void bffClient
      .get({ path: '/api/waitlist', schema: entriesSchema, retries: 0 })
      .then((response) => {
        if (!cancelled) {
          setEntries(response.items);
          setState('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  async function accept(entry: WaitlistEntry) {
    setBusyId(entry.id);
    setMessage(null);
    try {
      if (entry.status === 'offered') {
        await bffClient.post({
          path: `/api/waitlist/${encodeURIComponent(entry.id)}/accept`,
          body: {},
          headers: csrfHeaders(),
          schema: z.object({
            entry: entrySchema,
            holdId: z.string(),
            expiresAt: z.iso.datetime(),
          }),
        });
      }
      sessionStorage.setItem('c1rcle.waitlist.accepted-entry-id', entry.id);
      router.push(
        `/checkout/${encodeURIComponent(entry.eventId)}?tier=${encodeURIComponent(entry.tierId)}&waitlist=1`,
      );
    } catch {
      setMessage(
        'The reserved tickets are no longer available. Refresh your waitlist to check again.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(entry: WaitlistEntry) {
    setBusyId(entry.id);
    setMessage(null);
    try {
      await bffClient.delete({
        path: `/api/waitlist/${encodeURIComponent(entry.id)}`,
        headers: csrfHeaders(),
        schema: entrySchema,
      });
      reload();
    } catch {
      setMessage('Could not leave this waitlist. Refresh and try again.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      aria-labelledby="waitlist-heading"
      className="mb-6 rounded-3xl border border-white/10 bg-black/50 p-5 text-white"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40">
            Ticket access
          </p>
          <h2 id="waitlist-heading" className="mt-1 text-xl font-black uppercase">
            Your waitlists
          </h2>
        </div>
        <button
          type="button"
          onClick={reload}
          className="min-h-10 rounded-full border border-white/15 px-4 text-[9px] font-black uppercase tracking-widest text-white/65"
        >
          Refresh
        </button>
      </div>
      {state === 'loading' ? (
        <p role="status" className="mt-4 text-sm text-white/45">
          Loading waitlists…
        </p>
      ) : null}
      {state === 'error' ? (
        <p role="alert" className="mt-4 text-sm text-white/55">
          Waitlists could not be loaded.
        </p>
      ) : null}
      {state === 'ready' && entries.length === 0 ? (
        <p className="mt-4 text-sm text-white/45">You have no active waitlist entries.</p>
      ) : null}
      {entries.length > 0 ? (
        <ul className="mt-4 divide-y divide-white/10">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-bold">
                  Event {entry.eventId} · Tier {entry.tierId}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-white/45">
                  Position {entry.sequence} · {entry.status}
                </p>
                {entry.status === 'offered' && entry.offerExpiresAt ? (
                  <p className="mt-1 text-xs text-orange-200/80">
                    Offer ends {new Date(entry.offerExpiresAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-2">
                {entry.status === 'offered' || entry.status === 'accepted' ? (
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void accept(entry)}
                    className="min-h-10 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-widest text-black disabled:opacity-50"
                  >
                    {busyId === entry.id ? 'Opening…' : 'Accept & checkout'}
                  </button>
                ) : null}
                {entry.status === 'waiting' || entry.status === 'offered' ? (
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void cancel(entry)}
                    className="min-h-10 rounded-full border border-white/15 px-4 text-[9px] font-black uppercase tracking-widest text-white/60 disabled:opacity-50"
                  >
                    Leave
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {message ? (
        <p role="alert" className="mt-4 text-sm text-orange-100/80">
          {message}
        </p>
      ) : null}
    </section>
  );
}
