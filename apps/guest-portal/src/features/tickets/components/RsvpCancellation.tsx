'use client';
import { useState } from 'react';
import { z } from 'zod';

import { orderDtoSchema } from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/bff/csrf';

export function RsvpCancellation({
  orderId,
  onCancelled,
}: {
  orderId: string;
  onCancelled: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  async function cancel() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await bffClient.post({
        path: `/api/rsvp/${encodeURIComponent(orderId)}/cancel`,
        body: {},
        headers: csrfHeaders(),
        schema: z.object({ order: orderDtoSchema }),
      });
      setDone(true);
      onCancelled();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  if (done) return <p role="status">Your RSVP is cancelled. Your place has been released.</p>;
  return (
    <section aria-label="Cancel RSVP" className="space-y-3 border-t border-white/10 pt-4 text-sm">
      {confirming ? (
        <>
          <p>Cancel your RSVP and release your place? Your entry code will stop working.</p>
          <button
            disabled={busy}
            onClick={() => {
              void cancel();
            }}
            className="min-h-11 underline"
          >
            {busy ? 'Cancelling…' : 'Confirm cancellation'}
          </button>
          <button
            disabled={busy}
            onClick={() => {
              setConfirming(false);
            }}
            className="ml-4 min-h-11"
          >
            Keep RSVP
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            setConfirming(true);
          }}
          className="min-h-11 underline"
        >
          Cancel RSVP
        </button>
      )}
      {error ? <p role="alert">We could not cancel your RSVP. Try again.</p> : null}
    </section>
  );
}
