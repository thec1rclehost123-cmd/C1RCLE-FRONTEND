'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { EventStatusBadge } from '@/components/partner-v3/events/EventStatusBadge';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { useOverlayFocus } from '@/components/venue/useOverlayFocus';
import { describeApiError } from '@/lib/api/describe-error';
import { cancelPartnerEvent } from '@/lib/events/venue-event-repository';

import type { PartnerEventStatus } from '@/data/partner-data-source';
import type { EventOperationsDto } from '@c1rcle/contracts';
import type { SyntheticEvent } from 'react';

const statusLabels: Record<EventOperationsDto['status'], PartnerEventStatus> = {
  draft: 'Draft',
  review: 'Review',
  scheduled: 'Scheduled',
  published: 'Live',
  sales_paused: 'Paused',
  started: 'Live',
  ended: 'Past',
  archived: 'Archived',
  cancelled: 'Cancelled',
};

const eventViews = [
  ['Edit details', 'edit'],
  ['Analytics', 'analytics'],
  ['Sales', 'sales'],
  ['Attendees', 'guests'],
  ['Promoters', 'promoters'],
] as const;

const cancellableStatuses = new Set<EventOperationsDto['status']>([
  'draft',
  'review',
  'scheduled',
  'published',
  'sales_paused',
]);

export function ConnectedPartnerEventScreen({
  event,
  organizationId,
  studio,
}: {
  readonly event: EventOperationsDto;
  readonly organizationId: string;
  readonly studio: 'host' | 'venue';
}) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const cancelIntentKey = useRef<string | null>(null);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const cancelDialogRef = useRef<HTMLDivElement>(null);
  const cancellingRef = useRef(false);
  const closeCancelDialog = useCallback(() => {
    if (cancellingRef.current) return;
    cancelIntentKey.current = null;
    setCancelOpen(false);
  }, []);
  useOverlayFocus({
    containerRef: cancelDialogRef,
    open: cancelOpen,
    onClose: closeCancelDialog,
    restoreFocusRef: cancelTriggerRef,
    lockScroll: true,
  });
  const when = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(event.startAt));
  const eventsHref = `/partner/${studio}/events`;

  const submitCancellation = async (form: SyntheticEvent<HTMLFormElement>) => {
    form.preventDefault();
    const reason = cancelReason.trim();
    if (!reason) return;
    cancellingRef.current = true;
    setCancelling(true);
    setCancelError(null);
    try {
      cancelIntentKey.current ??= crypto.randomUUID();
      await cancelPartnerEvent(organizationId, event.id, reason, cancelIntentKey.current);
      cancellingRef.current = false;
      setCancelOpen(false);
      setCancelReason('');
      cancelIntentKey.current = null;
      setCancelMessage('Event cancellation submitted. Refreshing its current status.');
      router.refresh();
    } catch (cause: unknown) {
      setCancelError(describeApiError(cause, 'The event could not be cancelled.'));
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  };

  return (
    <PageContainer>
      <main className="mx-auto max-w-4xl py-7 text-stone-100">
        <Link
          href={eventsHref}
          className="text-sm font-medium text-stone-400 no-underline hover:text-stone-100"
        >
          ← All events
        </Link>
        <section className="mt-6 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          <EventStatusBadge status={statusLabels[event.status]} />
          <h1 className="mb-2 mt-4 text-3xl font-bold tracking-tight">{event.title}</h1>
          <p className="text-stone-300">{when}</p>
          {event.summary ? <p className="leading-7">{event.summary}</p> : null}
          {event.description ? (
            <p className="whitespace-pre-wrap leading-7">{event.description}</p>
          ) : null}
          <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-stone-400">Venue</dt>
              <dd>
                {event.venueName ?? (event.venueId ? 'Venue name unavailable' : 'Not specified')}
              </dd>
            </div>
            <div>
              <dt className="text-stone-400">Tickets sold</dt>
              <dd>
                {event.salesCountComplete
                  ? event.ticketsSold.toLocaleString('en-IN')
                  : `At least ${event.ticketsSold.toLocaleString('en-IN')}`}
              </dd>
            </div>
            <div>
              <dt className="text-stone-400">Room capacity</dt>
              <dd>{event.capacity?.toLocaleString('en-IN') ?? 'Not set'}</dd>
            </div>
            <div>
              <dt className="text-stone-400">Starting price</dt>
              <dd>
                {event.isFree
                  ? 'Free'
                  : event.startingPricePaise === null
                    ? 'Not available'
                    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
                        event.startingPricePaise / 100,
                      )}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-stone-400">
            Connected event views use the current event, finance, guest-roster, and referral-link
            projections for this organization.
          </p>
          <nav aria-label="Event views" className="mt-5 flex flex-wrap gap-3">
            {eventViews.map(([label, segment]) => (
              <Link
                key={segment}
                href={`/partner/${studio}/events/${encodeURIComponent(event.id)}/${segment}`}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-stone-100 hover:border-white/50 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </nav>
          {cancellableStatuses.has(event.status) ? (
            <div className="mt-5">
              <button
                ref={cancelTriggerRef}
                type="button"
                onClick={() => {
                  setCancelError(null);
                  cancelIntentKey.current = crypto.randomUUID();
                  setCancelOpen(true);
                }}
                className="rounded-full border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-200 hover:border-red-300"
              >
                Cancel event
              </button>
              {cancelMessage ? (
                <p role="status" className="mt-3 text-sm text-emerald-300">
                  {cancelMessage}
                </p>
              ) : null}
              {cancelError && !cancelOpen ? (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {cancelError}
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      </main>
      {cancelOpen ? (
        <div
          ref={cancelDialogRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="event-cancel-title"
          aria-describedby="event-cancel-warning"
          tabIndex={-1}
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"
        >
          <form
            onSubmit={(form) => void submitCancellation(form)}
            className="w-full max-w-lg rounded-2xl border border-red-300/30 bg-neutral-950 p-6 text-stone-100 shadow-2xl"
          >
            <h2 id="event-cancel-title" className="text-xl font-bold">
              Cancel {event.title}?
            </h2>
            <p id="event-cancel-warning" className="mt-3 text-sm leading-6 text-stone-300">
              This removes the event from public listings and starts the cancellation workflow for
              existing orders and tickets. Any refund review follows the existing policy.
            </p>
            <label htmlFor="event-cancel-reason" className="mt-5 block text-sm font-medium">
              Cancellation reason
            </label>
            <textarea
              id="event-cancel-reason"
              value={cancelReason}
              required
              maxLength={1000}
              rows={4}
              onChange={(change) => {
                setCancelReason(change.target.value);
              }}
              className="mt-2 w-full rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
            />
            {cancelError ? (
              <p role="alert" className="mt-3 text-sm text-red-300">
                {cancelError}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={closeCancelDialog}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Keep event
              </button>
              <button
                type="submit"
                disabled={cancelling || !cancelReason.trim()}
                className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Confirm cancellation'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </PageContainer>
  );
}
