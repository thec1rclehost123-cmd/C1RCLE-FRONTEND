'use client';

import { useRef, useState } from 'react';

import { guestRefundReviewDtoSchema } from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';

import type { GuestRefundReviewDto } from '@c1rcle/contracts';
import type { SyntheticEvent } from 'react';

export function GuestRefundRequest({
  ticketId,
  initialReview,
  allowed,
  reason,
}: {
  readonly ticketId: string;
  readonly initialReview?: GuestRefundReviewDto | null;
  readonly allowed: boolean;
  readonly reason?: string | null;
}) {
  const [submitted, setSubmitted] = useState<GuestRefundReviewDto | null>(null);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const review = submitted ?? initialReview;
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !allowed || !explanation.trim()) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await bffClient.post({
        path: `/api/tickets/${encodeURIComponent(ticketId)}/refund-review`,
        body: { reason: explanation.trim() },
        schema: guestRefundReviewDtoSchema,
      });
      setSubmitted(result);
    } catch {
      setError('Your request could not be sent. Please try again.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (review)
    return (
      <section aria-label="Refund request" className="border-t border-white/10 py-4">
        <p role="status">
          {review.status === 'resolved' || review.status === 'closed'
            ? 'Refund review completed.'
            : 'Your refund request is with our team.'}
        </p>
        <p className="mt-2 text-sm text-white/60">
          {review.status === 'resolved' || review.status === 'closed'
            ? 'See your support conversation for the review outcome.'
            : 'Submitting a request does not issue a refund. We’ll review it and reply in your support conversation.'}
        </p>
      </section>
    );
  if (!allowed) return reason ? <p className="text-sm text-white/60">{reason}</p> : null;
  return (
    <form onSubmit={(event) => void submit(event)} className="border-t border-white/10 py-4">
      <h3 className="font-semibold">Request refund</h3>
      <p className="mt-2 text-sm text-white/60">
        This request is for this ticket. Our team will review your event’s refund policy before a
        refund is approved.
      </p>
      <label className="mt-3 grid gap-2 text-sm">
        Why are you requesting a refund?
        <textarea
          value={explanation}
          onChange={(event) => {
            setExplanation(event.target.value);
          }}
          maxLength={2000}
          required
          rows={3}
          className="rounded-lg border border-white/20 bg-transparent p-3"
        />
      </label>
      <button
        type="submit"
        disabled={busy || !explanation.trim()}
        className="mt-3 rounded-lg border border-white/20 px-4 py-2 disabled:opacity-50"
      >
        {busy ? 'Sending…' : 'Send refund request'}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </form>
  );
}
