'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getClientEnv } from '@c1rcle/config';
import {
  createEventCoverRedemptionChallengeSchema,
  eventCoverRedemptionChallengeDtoSchema,
} from '@c1rcle/contracts';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { apiClient } from '@/lib/api/client';
import { describeApiError } from '@/lib/api/describe-error';

import type { EventCoverRedemptionChallengeDto } from '@c1rcle/contracts';

const inputClass = 'min-h-11 rounded-lg border border-white/20 bg-neutral-900 p-3 text-stone-100';

async function challengeIdForKey(idempotencyKey: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(idempotencyKey));
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `COV-CH-${hex.slice(0, 32)}`;
}

export function ConnectedEventCoverRedemptionScreen({
  studio,
  eventId,
  eventTitle,
  organizationId,
}: {
  readonly studio: 'venue';
  readonly eventId: string;
  readonly eventTitle: string;
  readonly organizationId: string;
}) {
  const operationStorageKey = `c1rcle:event-cover-redemption:v1:${organizationId}:${eventId}`;
  const [entitlementId, setEntitlementId] = useState('');
  const [amount, setAmount] = useState('');
  const [grossSpend, setGrossSpend] = useState('');
  const [categories, setCategories] = useState('');
  const [terminalId, setTerminalId] = useState('');
  const [receiptReference, setReceiptReference] = useState('');
  const [containsAlcohol, setContainsAlcohol] = useState(false);
  const [challenge, setChallenge] = useState<EventCoverRedemptionChallengeDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : window.sessionStorage.getItem(operationStorageKey),
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (challenge?.status === 'consumed' || challenge?.status === 'expired' || !challenge) return;
    let cancelled = false;
    const timer = setInterval(() => {
      void apiClient
        .get({
          path: `/api/v2/event-cover/redemption-challenges/${encodeURIComponent(challenge.id)}`,
          schema: eventCoverRedemptionChallengeDtoSchema,
          headers: { 'x-organization-id': organizationId },
        })
        .then((result) => {
          if (!cancelled) setChallenge(result);
        })
        .catch(() => undefined);
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [challenge, organizationId]);

  async function createChallenge() {
    setBusy(true);
    setError(null);
    setNotice(null);
    let operationKey: string | null = null;
    try {
      const toPaise = (value: string) => {
        if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Enter a valid amount in rupees.');
        return Math.round(Number(value) * 100);
      };
      const body = createEventCoverRedemptionChallengeSchema.parse({
        entitlementId: entitlementId.trim(),
        amountPaise: toPaise(amount),
        grossSpendPaise: toPaise(grossSpend),
        categories: categories
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
        containsAlcohol,
        receiptReference: receiptReference.trim(),
        terminalId: terminalId.trim(),
      });
      operationKey = idempotencyKey ?? crypto.randomUUID();
      setIdempotencyKey(operationKey);
      window.sessionStorage.setItem(operationStorageKey, operationKey);
      const created = await apiClient.post({
        path: '/api/v2/event-cover/redemption-challenges',
        body,
        schema: eventCoverRedemptionChallengeDtoSchema,
        headers: {
          'x-organization-id': organizationId,
          'idempotency-key': operationKey,
        },
      });
      setChallenge(created);
      setIdempotencyKey(null);
      window.sessionStorage.removeItem(operationStorageKey);
      setNotice(
        'Show the Guest confirmation page. The amount is temporarily reserved and is only spent after Guest confirmation and Venue completion.',
      );
    } catch (cause) {
      // A write may have committed even if its response was lost. Recover by
      // the deterministic challenge id before offering another operation.
      if (operationKey) {
        try {
          const recoveredId = await challengeIdForKey(operationKey);
          const recovered = await apiClient.get({
            path: `/api/v2/event-cover/redemption-challenges/${encodeURIComponent(recoveredId)}`,
            schema: eventCoverRedemptionChallengeDtoSchema,
            headers: { 'x-organization-id': organizationId },
          });
          setChallenge(recovered);
          setIdempotencyKey(null);
          window.sessionStorage.removeItem(operationStorageKey);
          setNotice('Recovered the existing Guest confirmation request. No duplicate was created.');
          return;
        } catch {
          // Keep the same key so retrying the unchanged form resolves to the
          // same operation through the API idempotency record.
        }
      }
      setError(describeApiError(cause, 'A Guest-confirmed cover request could not be created.'));
    } finally {
      setBusy(false);
    }
  }

  async function consume() {
    if (challenge?.status !== 'confirmed' || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await apiClient.post({
        path: `/api/v2/event-cover/redemption-challenges/${encodeURIComponent(challenge.id)}/consume`,
        body: {},
        schema: eventCoverRedemptionChallengeDtoSchema,
        headers: {
          'x-organization-id': organizationId,
          'idempotency-key': crypto.randomUUID(),
        },
      });
      setChallenge(result);
      setNotice('Cover charge captured and recorded against the Guest ticket.');
    } catch (cause) {
      setError(describeApiError(cause, 'The confirmed cover charge could not be completed.'));
    } finally {
      setBusy(false);
    }
  }

  const guestUrl = challenge
    ? `${getClientEnv().NEXT_PUBLIC_GUEST_PORTAL_URL.replace(/\/$/, '')}/event-cover-confirm/${encodeURIComponent(challenge.id)}`
    : '';

  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <Link
          href={`/partner/${studio}/events/${encodeURIComponent(eventId)}/cover`}
          className="text-sm text-stone-400"
        >
          ← Event cover policy
        </Link>
        <h1 className="mt-5 text-3xl font-bold">Venue cover redemption</h1>
        <p className="mt-2 text-sm leading-6 text-stone-400">
          {eventTitle}. Each redemption is linked to one Guest ticket, exact accepted policy, and
          authorized Venue terminal.
        </p>
        <form
          className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void createChallenge();
          }}
        >
          <label className="grid gap-2 text-xs text-stone-300">
            Ticket entitlement ID
            <input
              required
              className={inputClass}
              value={entitlementId}
              onChange={(event) => {
                setEntitlementId(event.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-xs text-stone-300">
            Venue terminal ID
            <input
              required
              className={inputClass}
              value={terminalId}
              onChange={(event) => {
                setTerminalId(event.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-xs text-stone-300">
            Cover to use (₹)
            <input
              required
              inputMode="decimal"
              className={inputClass}
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-xs text-stone-300">
            Purchase total (₹)
            <input
              required
              inputMode="decimal"
              className={inputClass}
              value={grossSpend}
              onChange={(event) => {
                setGrossSpend(event.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-xs text-stone-300">
            Product categories
            <input
              required
              className={inputClass}
              placeholder="food, merchandise"
              value={categories}
              onChange={(event) => {
                setCategories(event.target.value);
              }}
            />
          </label>
          <label className="grid gap-2 text-xs text-stone-300">
            Receipt reference
            <input
              required
              className={inputClass}
              value={receiptReference}
              onChange={(event) => {
                setReceiptReference(event.target.value);
              }}
            />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm text-stone-300 md:col-span-2">
            <input
              type="checkbox"
              checked={containsAlcohol}
              onChange={(event) => {
                setContainsAlcohol(event.target.checked);
              }}
            />
            Purchase contains alcohol
          </label>
          <button
            disabled={busy}
            className="min-h-11 rounded-full bg-white px-5 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50 md:col-span-2"
          >
            {busy ? 'Working…' : 'Request Guest confirmation'}
          </button>
        </form>
        {challenge ? (
          <section
            aria-label="Guest confirmation status"
            className="mt-5 space-y-3 rounded-2xl border border-white/10 p-5"
          >
            <h2 className="font-bold">Confirmation: {challenge.status.replace('_', ' ')}</h2>
            {guestUrl ? (
              <a className="break-all text-sm text-orange-200 underline" href={guestUrl}>
                {guestUrl}
              </a>
            ) : (
              <p className="text-sm leading-6 text-amber-100">
                Set NEXT_PUBLIC_GUEST_PORTAL_URL in this Partner app to generate the Guest link.
                Challenge ID: {challenge.id}
              </p>
            )}
            <p className="text-xs text-stone-400">
              This request expires at {new Date(challenge.expiresAt).toLocaleTimeString()}.
            </p>
            {challenge.status === 'confirmed' ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void consume();
                }}
                className="min-h-11 rounded-full bg-emerald-300 px-5 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
              >
                {busy ? 'Completing…' : 'Complete confirmed cover charge'}
              </button>
            ) : null}
          </section>
        ) : null}
        {notice ? (
          <p role="status" className="mt-4 text-sm text-emerald-200">
            {notice}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-4 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
      </main>
    </PageContainer>
  );
}
