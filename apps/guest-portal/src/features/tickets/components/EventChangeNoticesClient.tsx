'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  eventChangeResponseDtoSchema,
  markReadResultDtoSchema,
  notificationListResponseSchema,
} from '@c1rcle/contracts/client';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import type { SocialNotificationDto } from '@c1rcle/contracts/client';

export function EventChangeNoticesClient() {
  const [items, setItems] = useState<SocialNotificationDto[]>([]);
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
      .get({
        path: '/api/notifications/me',
        query: { limit: 100 },
        schema: notificationListResponseSchema,
        retries: 0,
      })
      .then((response) => {
        if (!cancelled) {
          setItems(response.items.filter((item) => item.type === 'event.material_change'));
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

  async function markSeen(item: SocialNotificationDto) {
    setBusyId(item.id);
    setMessage(null);
    try {
      await bffClient.post({
        path: '/api/notifications/me/read',
        body: { ids: [item.id] },
        headers: csrfHeaders(),
        schema: markReadResultDtoSchema,
      });
      reload();
    } catch {
      setMessage('Could not update this notice. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function respond(item: SocialNotificationDto, response: 'accepted' | 'refund_requested') {
    if (!item.eventChange) return;
    setBusyId(item.id);
    setMessage(null);
    try {
      const result = await bffClient.post({
        path: `/api/tickets/${encodeURIComponent(item.eventChange.entitlementId)}/event-changes/${String(item.eventChange.eventVersion)}/respond`,
        body: { response },
        headers: csrfHeaders(),
        schema: eventChangeResponseDtoSchema,
      });
      setItems((current) =>
        current.map((notice) =>
          notice.id === item.id
            ? {
                ...notice,
                eventChangeResponse: { response: result.response, respondedAt: result.respondedAt },
              }
            : notice,
        ),
      );
    } catch {
      setMessage('Could not save your response. The ticket remains unchanged. Try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (state === 'loading' || (state === 'ready' && items.length === 0)) return null;

  return (
    <section
      aria-labelledby="event-change-notices-heading"
      className="mb-5 rounded-2xl border border-orange-400/20 bg-orange-950/20 p-4 text-white"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="event-change-notices-heading" className="text-sm font-bold">
            Event updates
          </h2>
          <p className="mt-1 text-xs leading-5 text-white/60">
            Review the current event details in your ticket wallet. A refund review request does not
            create or issue a refund.
          </p>
        </div>
        {state === 'error' ? (
          <button type="button" onClick={reload} className="text-xs font-semibold text-orange-200">
            Retry
          </button>
        ) : null}
      </div>
      {state === 'error' ? (
        <p role="status" className="mt-3 text-xs text-white/60">
          Event updates are temporarily unavailable.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-white/65">{item.body}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <time className="text-[11px] text-white/40" dateTime={item.createdAt}>
                  {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                    new Date(item.createdAt),
                  )}
                </time>
                {item.readAt ? (
                  <span className="text-[11px] text-white/45">Seen</span>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void markSeen(item)}
                    className="rounded-full border border-orange-300/30 px-3 py-1 text-[11px] font-semibold text-orange-100 disabled:opacity-50"
                  >
                    {busyId === item.id ? 'Saving…' : 'Mark seen'}
                  </button>
                )}
              </div>
              {item.eventChange && item.eventChangeResponse ? (
                <p className="mt-3 text-xs text-orange-100" role="status">
                  {item.eventChangeResponse.response === 'accepted'
                    ? 'You confirmed the updated event details.'
                    : 'Refund review requested. No refund has been issued.'}
                </p>
              ) : item.eventChange ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.eventChange.canAccept ? (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void respond(item, 'accepted')}
                      className="rounded-full bg-orange-400 px-3 py-1.5 text-[11px] font-bold text-black disabled:opacity-50"
                    >
                      Confirm updated details
                    </button>
                  ) : null}
                  {item.eventChange.canRequestRefund ? (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void respond(item, 'refund_requested')}
                      className="rounded-full border border-white/20 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
                    >
                      Request refund review
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {message ? (
        <p role="status" className="mt-3 text-xs text-red-200">
          {message}
        </p>
      ) : null}
    </section>
  );
}
