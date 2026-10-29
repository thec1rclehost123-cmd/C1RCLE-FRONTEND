'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSession } from '@c1rcle/auth';
import { eventCoverRedemptionChallengeDtoSchema } from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

import type { EventCoverRedemptionChallengeDto } from '@c1rcle/contracts';

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function EventCoverConfirmPage() {
  const params = useParams<{ challengeId: string }>();
  const challengeId = params.challengeId;
  const { isAuthenticated, isLoading: sessionLoading } = useSession();
  const [challenge, setChallenge] = useState<EventCoverRedemptionChallengeDto | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'confirmed' | 'failed'>('loading');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !challengeId) return;
    let cancelled = false;
    void bffClient
      .get({
        path: `/api/wallet/event-cover-redemption-challenges/${encodeURIComponent(challengeId)}`,
        schema: eventCoverRedemptionChallengeDtoSchema,
      })
      .then((result) => {
        if (cancelled) return;
        setChallenge(result);
        setState(
          result.status === 'confirmed'
            ? 'confirmed'
            : result.status === 'pending'
              ? 'ready'
              : 'failed',
        );
      })
      .catch(() => {
        if (!cancelled) setState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, challengeId]);

  async function confirm() {
    if (!challengeId || busy) return;
    setBusy(true);
    try {
      const result = await bffClient.post({
        path: `/api/wallet/event-cover-redemption-challenges/${encodeURIComponent(challengeId)}`,
        body: {},
        headers: csrfHeaders(),
        schema: eventCoverRedemptionChallengeDtoSchema,
      });
      setChallenge(result);
      setState('confirmed');
    } catch {
      setState('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[75vh] w-full max-w-xl items-center px-4 py-16 text-white sm:px-6">
      <section className="w-full rounded-3xl border border-white/10 bg-[#101010] p-6 shadow-2xl sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">
          Guest confirmation
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase tracking-tight">Venue purchase</h1>
        {sessionLoading ? (
          <p className="mt-5 text-sm text-white/55">Checking your account…</p>
        ) : null}
        {!sessionLoading && !isAuthenticated ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-6 text-white/60">
              Sign in with the account that holds this ticket to review and confirm the cover use.
            </p>
            <Link
              className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-xs font-black uppercase tracking-wider text-black"
              href={`/login?next=${encodeURIComponent(`/event-cover-confirm/${challengeId}`)}`}
            >
              Sign in to review
            </Link>
          </div>
        ) : null}
        {isAuthenticated && state === 'loading' ? (
          <p role="status" className="mt-5 text-sm text-white/55">
            Loading confirmation…
          </p>
        ) : null}
        {isAuthenticated && state === 'failed' ? (
          <p role="alert" className="mt-5 text-sm leading-6 text-rose-200">
            This confirmation is unavailable, belongs to another account, or has expired. Ask the
            Venue to start again.
          </p>
        ) : null}
        {isAuthenticated && challenge && (state === 'ready' || state === 'confirmed') ? (
          <div className="mt-5 space-y-5">
            <dl className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Cover to use</dt>
                <dd className="font-bold">{money.format(challenge.amountPaise / 100)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/50">Purchase total</dt>
                <dd>{money.format(challenge.grossSpendPaise / 100)}</dd>
              </div>
              <div>
                <dt className="text-white/50">Purchase categories</dt>
                <dd className="mt-1">{challenge.categories.join(', ')}</dd>
              </div>
            </dl>
            {state === 'confirmed' ? (
              <p
                role="status"
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-100"
              >
                Confirmed. The Venue can complete this purchase now. Your cover is recorded against
                this ticket.
              </p>
            ) : (
              <>
                <p className="text-xs leading-5 text-white/45">
                  Confirm only if these amounts and purchase categories match what you agreed to.
                  The confirmation expires shortly.
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void confirm()}
                  className="min-h-12 w-full rounded-full bg-white px-5 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
                >
                  {busy ? 'Confirming…' : 'Confirm this cover use'}
                </button>
              </>
            )}
          </div>
        ) : null}
      </section>
    </main>
  );
}
