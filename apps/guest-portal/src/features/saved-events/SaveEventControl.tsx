'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { useSessionStore } from '@c1rcle/auth';
import { savedEventStateSchema } from '@c1rcle/contracts/saved-events';

import { guestContinuePath } from '@/lib/auth/continue-path';
import { csrfHeaders } from '@/lib/bff/csrf';

import { savedClient } from './client';
import { savedEventReturnPath } from './return-intent';

export function SaveEventControl({ eventId, slug }: { eventId: string; slug: string }) {
  const session = useSessionStore();
  const router = useRouter();
  const userId = session.session?.user.id;
  const [snapshot, setSnapshot] = useState<{
    userId: string;
    eventId: string;
    saved: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deniedFor, setDeniedFor] = useState<string | null>(null);
  const accountRequired = Boolean(userId && deniedFor === userId);
  const saved =
    snapshot &&
    session.status === 'authenticated' &&
    snapshot.userId === userId &&
    snapshot.eventId === eventId
      ? snapshot.saved
      : undefined;
  const path = `/api/saved-events/${encodeURIComponent(eventId)}`;
  const continuePath = savedEventReturnPath(
    slug,
    typeof window === 'undefined' ? '' : window.location.search,
  );
  useEffect(() => {
    if (session.status !== 'authenticated' || !userId) return;
    let active = true;
    void savedClient
      .get({ path, schema: savedEventStateSchema })
      .then((value) => {
        if (active) {
          setSnapshot({ userId, eventId, saved: value.saved });
          setDeniedFor(null);
          setError('');
        }
      })
      .catch((failure: unknown) => {
        if (!active) return;
        if (isApiClientError(failure) && (failure.status === 401 || failure.status === 403))
          setDeniedFor(userId);
        else setError('Save status could not be loaded. Try again.');
      });
    return () => {
      active = false;
    };
  }, [path, userId, session.status, eventId]);
  async function toggle() {
    if (busy) return;
    if (session.status !== 'authenticated' || !userId) {
      router.push(`/login?next=${encodeURIComponent(continuePath)}`);
      return;
    }
    if (accountRequired) {
      router.push(guestContinuePath(continuePath));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result =
        saved === undefined
          ? await savedClient.get({ path, schema: savedEventStateSchema })
          : await savedClient.put({
              path,
              body: { saved: !saved },
              schema: savedEventStateSchema,
              headers: csrfHeaders(),
            });
      setSnapshot({ userId, eventId, saved: result.saved });
    } catch (failure) {
      if (isApiClientError(failure) && (failure.status === 401 || failure.status === 403))
        router.push(continuePath);
      else setError('That change could not be saved. Try again.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button
        type="button"
        aria-label={
          saved === undefined && error && !accountRequired
            ? 'Retry save status'
            : saved
              ? 'Unsave event'
              : 'Save event'
        }
        aria-pressed={saved ?? false}
        disabled={
          busy ||
          !session.hydrated ||
          (session.status === 'authenticated' && saved === undefined && !error && !accountRequired)
        }
        onClick={() => void toggle()}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 text-[11px] font-semibold text-white disabled:opacity-50"
      >
        <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
        {saved === undefined && error && !accountRequired ? 'Retry' : saved ? 'Saved' : 'Save'}
      </button>
      {error && (
        <p role="status" className="mt-2 max-w-xs text-xs text-white/70">
          {error}
        </p>
      )}
    </div>
  );
}
