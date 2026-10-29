'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { waitlistOfferResponseSchema, waitlistQueueResponseSchema } from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { apiClient } from '@/lib/api/client';
import { describeApiError } from '@/lib/api/describe-error';

import type { TicketTierDto } from '@c1rcle/contracts';

export function ConnectedEventWaitlistScreen({
  studio,
  eventId,
  eventTitle,
  organizationId,
  tiers,
}: {
  readonly studio: 'host' | 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly organizationId: string;
  readonly tiers: readonly TicketTierDto[];
}) {
  const [tierId, setTierId] = useState(tiers[0]?.id ?? '');
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof loadQueue>>['items']>([]);
  const [loading, setLoading] = useState(Boolean(tiers[0]?.id));
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([]);
  const [pageInfo, setPageInfo] = useState<{
    page: number;
    total: number;
    nextCursor: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const offerIntentKey = useRef<string | null>(null);

  useEffect(() => {
    if (!tierId) return;
    let active = true;
    void loadQueue(eventId, tierId, organizationId, cursor)
      .then((page) => {
        if (active) {
          setEntries(page.items);
          setPageInfo(page.pageInfo);
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(describeApiError(cause, 'The waitlist could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cursor, eventId, organizationId, refreshVersion, tierId]);

  async function offerNext() {
    if (!tierId || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    offerIntentKey.current ??= crypto.randomUUID();
    try {
      const response = await apiClient.post({
        path: `/api/v2/events/${encodeURIComponent(eventId)}/tiers/${encodeURIComponent(tierId)}/waitlist/offer-next`,
        body: {},
        schema: waitlistOfferResponseSchema,
        headers: {
          'x-organization-id': organizationId,
          'idempotency-key': offerIntentKey.current,
        },
      });
      offerIntentKey.current = null;
      if ('offered' in response) {
        setMessage('There are no eligible guests waiting for this tier.');
      } else {
        setMessage(
          `A ${formatPaise(response.pricing.grandTotalPaise)} offer is reserved until ${formatDateTime(response.expiresAt)}.`,
        );
      }
      setRefreshVersion((value) => value + 1);
    } catch (cause: unknown) {
      // Keep the same key after an ambiguous failure so retry cannot offer the
      // next person while the first request may have committed.
      setError(
        describeApiError(cause, 'The next waitlist offer could not be created. Retry safely.'),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <main className="mx-auto max-w-5xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(eventId)}`}
          className="text-sm text-stone-400"
        >
          ← {eventTitle}
        </Link>
        <section className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-6 sm:p-7">
          <h1 className="text-3xl font-bold">Waitlist</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
            Offer the next verified guest a ten-minute ticket reservation. Queue order is automatic;
            this screen does not expose guest contact details.
          </p>

          {tiers.length === 0 ? (
            <p className="mt-8 rounded-xl border border-white/10 p-4 text-sm text-stone-400">
              This event has no active paid ticket tiers with a waitlist.
            </p>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap items-end gap-3">
                <label className="flex min-w-56 flex-col gap-2 text-sm">
                  Ticket tier
                  <select
                    value={tierId}
                    onChange={(event) => {
                      setLoading(true);
                      setError(null);
                      setTierId(event.currentTarget.value);
                      setCursor(null);
                      setCursorHistory([]);
                      setMessage(null);
                    }}
                    className="rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-stone-100"
                  >
                    {tiers.map((tier) => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void offerNext()}
                  disabled={busy || !tierId}
                  className="rounded-full bg-orange-400 px-5 py-2.5 text-sm font-bold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-busy={busy}
                >
                  {busy ? 'Creating offer…' : 'Offer next guest'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    setRefreshVersion((value) => value + 1);
                  }}
                  disabled={loading}
                  className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  Refresh queue
                </button>
              </div>
              {message ? (
                <p role="status" className="mt-4 text-sm text-emerald-300">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p role="alert" className="mt-4 text-sm text-red-300">
                  {error}
                </p>
              ) : null}
              <div className="mt-7 overflow-x-auto">
                {loading ? (
                  <p role="status" className="py-6 text-sm text-stone-400">
                    Loading queue…
                  </p>
                ) : entries.length === 0 ? (
                  <p className="py-6 text-sm text-stone-400">
                    No guests are waiting for this tier.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/15 text-stone-400">
                      <tr>
                        <th scope="col" className="py-3 pr-4">
                          Queue position
                        </th>
                        <th scope="col" className="py-3 pr-4">
                          Status
                        </th>
                        <th scope="col" className="py-3">
                          Offer expires
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/10">
                          <td className="py-3 pr-4">{entry.sequence}</td>
                          <td className="py-3 pr-4">{entry.status}</td>
                          <td className="py-3">
                            {entry.offerExpiresAt ? formatDateTime(entry.offerExpiresAt) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {pageInfo && pageInfo.total > 0 ? (
                <div className="flex items-center justify-end gap-3 text-sm text-stone-400">
                  <span>
                    Page {pageInfo.page} · {pageInfo.total} entries
                  </span>
                  <button
                    type="button"
                    disabled={cursorHistory.length === 0 || loading}
                    onClick={() => {
                      const previous = cursorHistory.at(-1);
                      if (cursorHistory.length === 0) return;
                      setLoading(true);
                      setError(null);
                      setCursorHistory((history) => history.slice(0, -1));
                      setCursor(previous ?? null);
                    }}
                    className="rounded-full border border-white/20 px-3 py-1.5 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={pageInfo.nextCursor === null || loading}
                    onClick={() => {
                      if (pageInfo.nextCursor === null) return;
                      setLoading(true);
                      setError(null);
                      setCursorHistory((history) => [...history, cursor]);
                      setCursor(pageInfo.nextCursor);
                    }}
                    className="rounded-full border border-white/20 px-3 py-1.5 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </main>
    </PageContainer>
  );
}

async function loadQueue(
  eventId: string,
  tierId: string,
  organizationId: string,
  cursor: string | null,
) {
  return apiClient.get({
    path: `/api/v2/events/${encodeURIComponent(eventId)}/tiers/${encodeURIComponent(tierId)}/waitlist`,
    query: { limit: 100, ...(cursor ? { cursor } : {}) },
    schema: waitlistQueueResponseSchema,
    headers: { 'x-organization-id': organizationId },
  });
}

function formatPaise(amountPaise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
    amountPaise / 100,
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}
