'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { describeApiError } from '@/lib/api/describe-error';
import {
  isoInstantToProductLocalInput,
  productLocalInputToIsoInstant,
} from '@/lib/events/event-time';
import { changePartnerEventLifecycle } from '@/lib/events/venue-event-repository';
import { loadSlotRequestsData } from '@/lib/slot-requests/slot-request-repository';

import type { EventDto } from '@c1rcle/contracts';
import type { SyntheticEvent } from 'react';

type Slot = Awaited<ReturnType<typeof loadSlotRequestsData>>['requests'][number];

export function EventLifecycleActions({
  event,
  organizationId,
  studio,
}: {
  readonly event: EventDto;
  readonly organizationId: string;
  readonly studio: 'host' | 'venue';
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(event);
  const [mode, setMode] = useState<'postpone' | 'reschedule' | null>(null);
  const [reason, setReason] = useState('');
  const [start, setStart] = useState(isoInstantToProductLocalInput(event.startAt));
  const [end, setEnd] = useState(event.endAt ? isoInstantToProductLocalInput(event.endAt) : '');
  const [slots, setSlots] = useState<readonly Slot[]>([]);
  const [slotId, setSlotId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const intent = useRef<{ signature: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const postponed = current.status === 'postponed';
  const canPostpone = ['scheduled', 'published', 'sales_paused', 'started'].includes(
    current.status,
  );

  const openReschedule = async () => {
    setMode('reschedule');
    setError(null);
    if (studio !== 'host') return;
    setBusy(true);
    try {
      const data = await loadSlotRequestsData('outgoing');
      setSlots(
        data.requests.filter((slot) => slot.eventId === event.id && slot.status === 'approved'),
      );
    } catch (cause) {
      setError(describeApiError(cause, 'Accepted Venue slots could not be loaded.'));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (form: SyntheticEvent<HTMLFormElement>) => {
    form.preventDefault();
    if (!mode || inFlight.current) return;
    const startAt = productLocalInputToIsoInstant(start);
    const endAt = end ? productLocalInputToIsoInstant(end) : null;
    const slot = slots.find((item) => item.id === slotId);
    if (mode === 'postpone' && !reason.trim()) return;
    if (
      mode === 'reschedule' &&
      (!startAt || (end && !endAt) || (studio === 'host' && !slot?.venueId))
    ) {
      setError(
        studio === 'host'
          ? 'Choose an accepted Venue slot and valid replacement times.'
          : 'Enter valid replacement times in IST.',
      );
      return;
    }
    const command =
      mode === 'postpone'
        ? { action: 'postpone' as const, reason: reason.trim() }
        : {
            action: 'reschedule' as const,
            startAt: startAt ?? '',
            endAt,
            expectedVersion: current.version,
            ...(slot?.venueId ? { slotRequestId: slot.id, venueId: slot.venueId } : {}),
          };
    const signature = JSON.stringify(command);
    if (intent.current?.signature !== signature)
      intent.current = { signature, key: crypto.randomUUID() };
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await changePartnerEventLifecycle(
        organizationId,
        event.id,
        command,
        intent.current.key,
      );
      setCurrent(updated);
      setMode(null);
      intent.current = null;
      setMessage(
        updated.status === 'postponed'
          ? 'Event postponed. Sales, transfers and admission are on hold.'
          : 'Replacement date announced. The event is live.',
      );
      router.refresh();
    } catch (cause) {
      setError(describeApiError(cause, 'The event could not be updated.'));
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  if (!postponed && !canPostpone && !message) return null;
  return (
    <section aria-label="Event lifecycle" className="mt-6 border-t border-white/15 pt-5">
      {postponed ? (
        <p className="text-sm text-amber-200">
          Postponed — new date to be announced. Sales, transfers, QR and admission are on hold.
          Existing tickets are preserved; purchasers may request a refund.
        </p>
      ) : null}
      {current.postponement?.initiatedBy === 'venue' && postponed ? (
        <p className="mt-2 text-sm text-stone-300">
          The Venue cancelled its booking. Move the event to an approved Venue, announce a new date,
          or cancel the event.
        </p>
      ) : null}
      {mode === null ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {canPostpone ? (
            <button
              type="button"
              className="rounded-lg border border-white/25 px-3 py-2 text-sm"
              onClick={() => {
                setMode('postpone');
                setError(null);
              }}
            >
              Postpone event
            </button>
          ) : null}
          {postponed ? (
            <button
              type="button"
              className="rounded-lg border border-white/25 px-3 py-2 text-sm"
              onClick={() => void openReschedule()}
            >
              Announce replacement date
            </button>
          ) : null}
        </div>
      ) : (
        <form onSubmit={(form) => void submit(form)} className="mt-4 grid max-w-xl gap-4">
          {mode === 'postpone' ? (
            <>
              <p className="text-sm text-stone-300">
                This pauses new sales, transfers and admission until a replacement date is
                announced. Existing tickets and history remain.
              </p>
              <label className="grid gap-2 text-sm">
                Postponement reason
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
            </>
          ) : (
            <>
              {studio === 'host' ? (
                <>
                  <Link
                    href={`/partner/host/calendar?event=${encodeURIComponent(event.id)}`}
                    className="text-sm underline"
                  >
                    Request another Venue slot
                  </Link>
                  <label className="grid gap-2 text-sm">
                    Accepted replacement Venue slot
                    <select
                      value={slotId}
                      disabled={busy}
                      onChange={(change) => {
                        setSlotId(change.target.value);
                        const slot = slots.find((item) => item.id === change.target.value);
                        if (slot?.slotStartTime)
                          setStart(isoInstantToProductLocalInput(slot.slotStartTime));
                        if (slot?.slotEndTime)
                          setEnd(isoInstantToProductLocalInput(slot.slotEndTime));
                      }}
                      className="rounded-lg border border-white/25 bg-black p-3"
                    >
                      <option value="">Choose an accepted slot</option>
                      {slots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.partnerName} ·{' '}
                          {slot.slotStartTime
                            ? new Intl.DateTimeFormat('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                                timeZone: 'Asia/Kolkata',
                              }).format(new Date(slot.slotStartTime))
                            : 'Time unavailable'}{' '}
                          IST
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
              <label className="grid gap-2 text-sm">
                Replacement start (IST)
                <input
                  type="datetime-local"
                  value={start}
                  required
                  onChange={(change) => {
                    setStart(change.target.value);
                  }}
                  className="rounded-lg border border-white/25 bg-black p-3"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Replacement end (IST)
                <input
                  type="datetime-local"
                  value={end}
                  required={studio === 'host'}
                  onChange={(change) => {
                    setEnd(change.target.value);
                  }}
                  className="rounded-lg border border-white/25 bg-black p-3"
                />
              </label>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy || (mode === 'postpone' && !reason.trim())}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy
                ? 'Saving…'
                : mode === 'postpone'
                  ? 'Confirm postponement'
                  : 'Announce replacement date'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setMode(null);
                setError(null);
              }}
              className="rounded-lg border border-white/25 px-3 py-2 text-sm"
            >
              Keep current state
            </button>
          </div>
        </form>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-3 text-sm text-emerald-300">
          {message}
        </p>
      ) : null}
    </section>
  );
}
