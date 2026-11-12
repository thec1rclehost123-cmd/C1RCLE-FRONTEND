'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';

import { EmptyState, ErrorState, LoadingState } from '@/components/partner-v3/States';
import { requestHostAvailabilitySlot } from '@/lib/calendar/host-availability-repository';
import { useHostAvailability } from '@/lib/calendar/use-host-availability';
import { currentMonthKey } from '@/lib/calendar/venue-calendar-repository';
import { clearDraftPoster } from '@/lib/events/draft-poster-store';
import { discardHostEventDraft } from '@/lib/events/event-draft-repository';
import { formatEventDateLabel } from '@/lib/events/event-time';
import {
  buildSlotRequestEventDraft,
  eventStartAtFromDraft,
  eventEndAtFromDraft,
  publishVenueEvent,
} from '@/lib/events/venue-event-repository';
import { useConnectedPromoters } from '@/lib/partner/use-connected-promoters';
import { loadSlotRequestsData } from '@/lib/slot-requests/slot-request-repository';

import { PartnerEventEditor } from './PartnerEventEditor';

import type { EventEditorData, EventEditorDraft } from '@/data/partner-data-source';

export function HostEventEditorRoute({
  organizationId,
  data,
  initialStep,
  initialVenueId,
  initialDate,
  initialSlotId,
  acceptedRequestId,
}: {
  readonly organizationId: string | null;
  readonly data: EventEditorData;
  readonly initialStep?: string;
  readonly initialVenueId?: string;
  readonly initialDate?: string;
  readonly initialSlotId?: string;
  readonly acceptedRequestId?: string;
}) {
  const router = useRouter();
  const requestKeys = useRef(new Map<string, string>());
  const [acceptedRequest, setAcceptedRequest] = useState<
    Awaited<ReturnType<typeof loadSlotRequestsData>>['requests'][number] | null
  >(null);
  const [acceptedRequestError, setAcceptedRequestError] = useState<string | null>(null);
  const [acceptedRequestLoading, setAcceptedRequestLoading] = useState(Boolean(acceptedRequestId));
  // Keep the availability request range stable while the user changes the
  // selected date. Changing the query param otherwise changes the request key,
  // renders the loading state, and unmounts the editor (discarding its draft).
  const [anchorMonth] = useState(() =>
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)
      ? initialDate.slice(0, 7)
      : currentMonthKey(),
  );
  const state = useHostAvailability({ organizationId, anchorMonth, monthsAfter: 12 });
  const promoters = useConnectedPromoters(organizationId);

  useEffect(() => {
    if (!acceptedRequestId) return;
    let active = true;
    loadSlotRequestsData('outgoing')
      .then((result) => {
        if (!active) return;
        const request = result.requests.find((item) => item.id === acceptedRequestId);
        if (
          request?.status !== 'approved' ||
          !request.venueId ||
          !request.slotId ||
          !request.slotStartTime ||
          !request.slotEndTime
        ) {
          setAcceptedRequestError(
            'This accepted Venue slot is not available to the current Host session.',
          );
          return;
        }
        if (request.linkedEventStatus === 'published' && request.eventId) {
          router.replace(`/partner/host/events/${encodeURIComponent(request.eventId)}`);
          return;
        }
        setAcceptedRequest(request);
      })
      .catch((error: unknown) => {
        if (active)
          setAcceptedRequestError(
            error instanceof Error ? error.message : 'Could not verify the accepted slot.',
          );
      })
      .finally(() => {
        if (active) setAcceptedRequestLoading(false);
      });
    return () => {
      active = false;
    };
  }, [acceptedRequestId, router]);

  if (!organizationId) {
    return (
      <EmptyState
        title="Choose an organization"
        description="Select an active host organization before creating an event."
      />
    );
  }
  if (state.loading || promoters.loading || acceptedRequestLoading)
    return <LoadingState label="Loading event setup" />;
  if (acceptedRequestError)
    return <ErrorState title="Accepted slot unavailable" description={acceptedRequestError} />;
  if (state.error) {
    return (
      <ErrorState
        title="Availability unavailable"
        description={state.error}
        onRetry={state.retry}
      />
    );
  }
  if (promoters.error) {
    return (
      <ErrorState
        title="Promoters unavailable"
        description={promoters.error}
        onRetry={promoters.retry}
      />
    );
  }
  if (!state.data) return <LoadingState label="Loading venue options" />;

  const acceptedSlot =
    acceptedRequest?.slotStartTime && acceptedRequest.slotEndTime
      ? {
          requestId: acceptedRequest.id,
          venueId: acceptedRequest.venueId ?? '',
          startAt: acceptedRequest.slotStartTime,
          endAt: acceptedRequest.slotEndTime,
          timezone: PRODUCT_TIME_ZONE,
        }
      : null;
  if (acceptedRequestId && !acceptedSlot) return <LoadingState label="Verifying accepted slot" />;
  const requestedVenueId = acceptedSlot?.venueId ?? initialVenueId;
  const selectedVenue =
    state.data.venues.find((item) => item.venue.id === requestedVenueId) ??
    (acceptedSlot ? undefined : state.data.venues[0]);
  if (!selectedVenue && acceptedSlot) {
    return (
      <ErrorState
        title="Accepted slot unavailable"
        description="The Venue for this approved slot is no longer available to the current Host organization. Refresh your partnerships and try again."
      />
    );
  }
  const requestedDay = selectedVenue?.months
    .flatMap((month) => month.days)
    .find((day) => day.date === initialDate);
  const requestedSlot = requestedDay?.slots.find((slot) => slot.id === initialSlotId);
  const acceptedDate = acceptedSlot
    ? new Intl.DateTimeFormat('en-CA', { timeZone: PRODUCT_TIME_ZONE }).format(
        new Date(acceptedSlot.startAt),
      )
    : undefined;
  const acceptedTime = acceptedSlot
    ? new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: PRODUCT_TIME_ZONE,
      }).format(new Date(acceptedSlot.startAt))
    : undefined;
  const acceptedEndTime = acceptedSlot
    ? new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: PRODUCT_TIME_ZONE,
      }).format(new Date(acceptedSlot.endAt))
    : undefined;
  const artwork = data.artworkOptions[0] ?? data.defaultDraft.artwork;
  const liveData: EventEditorData = {
    ...data,
    promoters: promoters.data,
    venues: state.data.venues.map((item, index) => ({
      id: item.venue.id,
      name: item.venue.name,
      meta: item.venue.meta,
      artwork: data.artworkOptions[index % Math.max(1, data.artworkOptions.length)] ?? artwork,
    })),
    defaultDraft: {
      ...data.defaultDraft,
      venueId: selectedVenue?.venue.id ?? '',
      date: acceptedDate ?? data.defaultDraft.date,
      dateLabel: acceptedDate ? formatEventDateLabel(acceptedDate) : data.defaultDraft.dateLabel,
      time:
        acceptedTime ??
        (requestedSlot?.startTime
          ? new Intl.DateTimeFormat('en-GB', {
              timeZone: PRODUCT_TIME_ZONE,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }).format(new Date(requestedSlot.startTime))
          : requestedSlot?.label) ??
        data.defaultDraft.time,
      ...(acceptedEndTime
        ? { endTime: acceptedEndTime }
        : requestedSlot?.endTime
          ? {
              endTime: new Intl.DateTimeFormat('en-GB', {
                timeZone: PRODUCT_TIME_ZONE,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).format(new Date(requestedSlot.endTime)),
            }
          : {}),
    },
  };

  const submitHostEvent = async (draft: EventEditorDraft, selectedSlotId: string) => {
    if (draft.externalVenue) {
      const key = draft.externalWorkflowKey ?? crypto.randomUUID();
      await publishVenueEvent(organizationId, draft, key);
      await discardHostEventDraft(organizationId);
      router.push('/partner/host/events');
      return;
    }
    if (acceptedSlot) {
      if (acceptedRequest?.eventId && acceptedRequest.linkedEventStatus === 'published') {
        router.push(`/partner/host/events/${encodeURIComponent(acceptedRequest.eventId)}`);
        return;
      }
      if (acceptedRequest?.hasEventDraft)
        throw new Error(
          'The Venue approved this slot, but event publication is still processing. Ask the Venue to retry approval if it does not appear shortly.',
        );
      await publishVenueEvent(organizationId, draft, {
        slotRequestId: acceptedSlot.requestId,
        startAt: acceptedSlot.startAt,
        endAt: acceptedSlot.endAt,
      });
      await discardHostEventDraft(organizationId);
      router.push('/partner/host/events');
      return;
    }
    if (!selectedSlotId) throw new Error('Choose an open Venue slot before requesting it.');
    const requestFingerprint = JSON.stringify([
      selectedSlotId,
      draft.date,
      draft.time,
      draft.endTime,
      draft.name,
      draft.description,
      draft.ticketTiers,
      draft.selectedPromoterIds,
      draft.promoCodeSettings,
    ]);
    let idempotencyKey = requestKeys.current.get(requestFingerprint);
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID();
      requestKeys.current.set(requestFingerprint, idempotencyKey);
    }
    const windowEnd = state.data?.venues
      .find((item) => item.venue.id === draft.venueId)
      ?.months.flatMap((month) => month.days)
      .flatMap((day) => day.slots)
      .find((slot) => slot.id === selectedSlotId)?.endTime;
    const startTime = eventStartAtFromDraft(draft);
    const fallbackEnd =
      windowEnd && startTime
        ? new Date(
            Math.min(Date.parse(windowEnd), Date.parse(startTime) + 24 * 60 * 60 * 1000),
          ).toISOString()
        : '';
    const startAt = eventStartAtFromDraft(draft);
    const endAt = eventEndAtFromDraft(draft) ?? fallbackEnd;
    if (!startAt || !endAt) throw new Error('Enter a valid event start and end time.');
    const eventDraft = await buildSlotRequestEventDraft(organizationId, draft, startAt, endAt);
    await requestHostAvailabilitySlot({
      organizationId,
      venueId: draft.venueId,
      slotId: selectedSlotId,
      ...(selectedSlotId.startsWith('free-')
        ? {
            startTime: eventStartAtFromDraft(draft) ?? '',
            endTime: draft.endTime?.trim() ? (eventEndAtFromDraft(draft) ?? '') : fallbackEnd,
          }
        : {}),
      eventDraft,
      idempotencyKey,
    });
    await discardHostEventDraft(organizationId);
    await clearDraftPoster(organizationId);
    const params = new URLSearchParams({ requested: 'true' });
    router.push(`/partner/host/slot-requests?${params.toString()}`);
  };

  return (
    <>
      {acceptedSlot ? (
        <p role="status">
          Reserved Host slot:{' '}
          {new Intl.DateTimeFormat('en-IN', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: PRODUCT_TIME_ZONE,
          }).format(new Date(acceptedSlot.startAt))}{' '}
          to{' '}
          {new Intl.DateTimeFormat('en-IN', {
            timeStyle: 'short',
            timeZone: PRODUCT_TIME_ZONE,
          }).format(new Date(acceptedSlot.endAt))}{' '}
          (IST). The event will use this reserved time.
        </p>
      ) : null}
      <PartnerEventEditor
        data={liveData}
        availability={state.data}
        mode="create"
        organizationId={organizationId}
        {...(selectedVenue ? { initialVenueId: selectedVenue.venue.id } : {})}
        onSubmit={submitHostEvent}
        {...(initialStep ? { initialStep } : {})}
        {...(requestedDay?.state === 'available' ? { initialDate: requestedDay.date } : {})}
        {...(requestedSlot ? { initialSlotId: requestedSlot.id } : {})}
        {...(acceptedSlot ? { acceptedSlotMode: true } : {})}
      />
    </>
  );
}
