'use client';

import { useRef, useState } from 'react';

import { describeApiError } from '@/lib/api/describe-error';
import { cancelAcceptedVenueBooking } from '@/lib/slot-requests/venue-booking-lifecycle';

import type { SyntheticEvent } from 'react';

export function VenueBookingCancellation({
  requestId,
  onCancelled,
}: {
  readonly requestId: string;
  readonly onCancelled?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const intent = useRef<{ reason: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const submit = async (form: SyntheticEvent<HTMLFormElement>) => {
    form.preventDefault();
    if (!reason.trim() || inFlight.current) return;
    if (intent.current?.reason !== reason.trim())
      intent.current = { reason: reason.trim(), key: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await cancelAcceptedVenueBooking(requestId, reason.trim(), intent.current.key);
      setComplete(true);
      setOpen(false);
      onCancelled?.();
    } catch (cause) {
      setError(describeApiError(cause, 'The booking could not be cancelled.'));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  return (
    <section aria-label="Venue booking cancellation" className="border-t border-white/15 p-5">
      {complete ? (
        <p role="status">
          Booking cancelled. The linked event is on hold; the Host must resolve its Venue or
          schedule.
        </p>
      ) : open ? (
        <form onSubmit={(form) => void submit(form)} className="grid gap-3">
          <p className="text-sm text-stone-300">
            Cancelling this accepted booking freezes sales and admission for its linked event.
            Tickets and history are preserved. The Host and platform operations receive the
            cancellation evidence.
          </p>
          <label className="grid gap-2 text-sm">
            Venue cancellation reason
            <textarea
              value={reason}
              onChange={(change) => {
                setReason(change.target.value);
              }}
              required
              maxLength={1000}
              rows={3}
              className="rounded-lg border border-white/25 bg-black p-3"
            />
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy || !reason.trim()}
              className="rounded-lg border border-red-300/50 px-3 py-2 text-sm text-red-200 disabled:opacity-50"
            >
              {busy ? 'Cancelling…' : 'Confirm booking cancellation'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false);
              }}
              className="rounded-lg border border-white/25 px-3 py-2 text-sm"
            >
              Keep booking
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setError(null);
          }}
          className="rounded-lg border border-red-300/50 px-3 py-2 text-sm text-red-200"
        >
          Cancel accepted booking
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </section>
  );
}
