'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

import { PageContainer } from '@/components/partner-v3/PagePrimitives';
import { useOverlayFocus } from '@/components/venue/useOverlayFocus';
import { describeApiError } from '@/lib/api/describe-error';
import {
  cancelPartnerEvent,
  continueApprovedExternalEvent,
} from '@/lib/events/venue-event-repository';

import { ConnectedEventSummary } from './ConnectedEventSummary';
import { EventLifecycleActions } from './EventLifecycleActions';

import type { EventAnalyticsDto, EventOperationsDto, TicketTierDto } from '@c1rcle/contracts';
import type { SyntheticEvent } from 'react';

const cancellableStatuses = new Set<EventOperationsDto['status']>([
  'draft',
  'review',
  'scheduled',
  'published',
  'sales_paused',
  'postponed',
  'started',
]);

export function ConnectedPartnerEventScreen({
  event,
  analytics,
  tiers,
  organizationId,
  showEventHeader = true,
  studio = 'host',
}: {
  readonly event: EventOperationsDto;
  readonly analytics?: EventAnalyticsDto;
  readonly tiers?: readonly TicketTierDto[];
  readonly organizationId: string;
  readonly studio?: string;
  readonly showEventHeader?: boolean;
}) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [externalSubmissionBusy, setExternalSubmissionBusy] = useState(false);
  const [externalSubmissionError, setExternalSubmissionError] = useState<string | null>(null);
  const externalSubmissionKey = useRef<string | null>(null);
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
      <main className="mx-auto max-w-6xl py-7 text-stone-100">
        {analytics && tiers ? <ConnectedEventSummary analytics={analytics} tiers={tiers} /> : null}
        <section className="mt-2 rounded-2xl border border-white/15 bg-neutral-950 p-7">
          {showEventHeader ? <h1 className="text-2xl font-bold">{event.title}</h1> : null}
          {showEventHeader ? (
            <p className="mt-2 text-stone-300">
              {event.venueName ?? (event.venueId ? 'Venue name unavailable' : 'Not specified')}
            </p>
          ) : null}
          <h2 className="mt-5 text-xl font-bold">Event overview</h2>
          {studio === 'host' && event.externalLocation ? (
            <section
              aria-label="External venue approval"
              className="mt-4 rounded-xl border border-white/10 p-4"
            >
              {event.externalVenueReviewStatus === 'pending' ? (
                <p role="status" className="text-sm text-amber-200">
                  External venue awaiting C1RCLE review. The event cannot be published until the
                  location is approved.
                </p>
              ) : null}
              {event.externalVenueReviewStatus === 'rejected' ? (
                <p role="status" className="text-sm text-amber-200">
                  External venue changes are required. Open event details to resubmit the location.
                </p>
              ) : null}
              {event.externalVenueReviewStatus === 'approved' && event.status === 'draft' ? (
                <>
                  <p className="text-sm text-emerald-200">
                    External venue approved. Submit the event to publish it.
                  </p>
                  <button
                    type="button"
                    className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    disabled={externalSubmissionBusy}
                    onClick={() => {
                      setExternalSubmissionBusy(true);
                      setExternalSubmissionError(null);
                      externalSubmissionKey.current ??= crypto.randomUUID();
                      void continueApprovedExternalEvent(
                        organizationId,
                        event.id,
                        externalSubmissionKey.current,
                      )
                        .then(() => {
                          externalSubmissionKey.current = null;
                          router.refresh();
                        })
                        .catch((cause: unknown) => {
                          setExternalSubmissionError(
                            describeApiError(cause, 'The event could not be submitted.'),
                          );
                        })
                        .finally(() => {
                          setExternalSubmissionBusy(false);
                        });
                    }}
                  >
                    {externalSubmissionBusy ? 'Submitting…' : 'Submit approved event'}
                  </button>
                </>
              ) : null}
              {externalSubmissionError ? (
                <p role="alert" className="mt-3 text-sm text-red-300">
                  {externalSubmissionError}
                </p>
              ) : null}
            </section>
          ) : null}
          {event.summary ? <p className="mt-3 leading-7">{event.summary}</p> : null}
          {event.description && event.description !== event.summary ? (
            <p className="mt-3 whitespace-pre-wrap leading-7">{event.description}</p>
          ) : null}
          {showEventHeader ? (
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
                      : new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                        }).format(event.startingPricePaise / 100)}
                </dd>
              </div>
            </dl>
          ) : null}
          <EventLifecycleActions
            key={`${event.id}:${String(event.version)}`}
            event={event}
            organizationId={organizationId}
            studio={studio === 'venue' ? 'venue' : 'host'}
          />
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
