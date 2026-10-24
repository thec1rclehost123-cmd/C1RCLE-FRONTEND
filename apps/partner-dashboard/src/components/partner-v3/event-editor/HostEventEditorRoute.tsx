'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { EmptyState, ErrorState, LoadingState } from '@/components/partner-v3/States';
import { requestHostAvailabilitySlot } from '@/lib/calendar/host-availability-repository';
import { useHostAvailability } from '@/lib/calendar/use-host-availability';
import { currentMonthKey } from '@/lib/calendar/venue-calendar-repository';
import { formatEventDateLabel } from '@/lib/events/event-time';
import { publishVenueEvent } from '@/lib/events/venue-event-repository';
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
  }, [acceptedRequestId]);

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
  if (!state.data?.venues.length) {
    return (
      <EmptyState
        title="No active venue partnerships"
        description="Connect with a venue before creating a host event."
      />
    );
  }

  const acceptedSlot =
    acceptedRequest?.slotStartTime && acceptedRequest.slotEndTime
      ? {
          requestId: acceptedRequest.id,
          venueId: acceptedRequest.venueId ?? '',
          startAt: acceptedRequest.slotStartTime,
          endAt: acceptedRequest.slotEndTime,
          timezone: acceptedRequest.timezone ?? 'UTC',
        }
      : null;
  if (acceptedRequestId && !acceptedSlot) return <LoadingState label="Verifying accepted slot" />;
  const requestedVenueId = acceptedSlot?.venueId ?? initialVenueId;
  const selectedVenue =
    state.data.venues.find((item) => item.venue.id === requestedVenueId) ??
    (acceptedSlot ? undefined : state.data.venues[0]);
  if (!selectedVenue) {
    return (
      <ErrorState
        title="Accepted slot unavailable"
        description="The Venue for this approved slot is no longer available to the current Host organization. Refresh your partnerships and try again."
      />
    );
  }
  const requestedDay = selectedVenue.months
    .flatMap((month) => month.days)
    .find((day) => day.date === initialDate);
  const requestedSlot = requestedDay?.slots.find((slot) => slot.id === initialSlotId);
  const acceptedDate = acceptedSlot
    ? new Intl.DateTimeFormat('en-CA', { timeZone: acceptedSlot.timezone }).format(
        new Date(acceptedSlot.startAt),
      )
    : undefined;
  const acceptedTime = acceptedSlot
    ? new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: acceptedSlot.timezone,
      }).format(new Date(acceptedSlot.startAt))
    : undefined;
  const acceptedEndTime = acceptedSlot
    ? new Intl.DateTimeFormat('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: acceptedSlot.timezone,
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
      venueId: selectedVenue.venue.id,
      date: acceptedDate ?? data.defaultDraft.date,
      dateLabel: acceptedDate
        ? formatEventDateLabel(acceptedDate, acceptedSlot?.timezone ?? 'UTC')
        : data.defaultDraft.dateLabel,
      time: acceptedTime ?? requestedSlot?.label ?? data.defaultDraft.time,
      ...(acceptedEndTime ? { endTime: acceptedEndTime } : {}),
    },
  };

  const submitHostEvent = async (draft: EventEditorDraft, selectedSlotId: string) => {
    if (acceptedSlot) {
      await publishVenueEvent(organizationId, draft, {
        slotRequestId: acceptedSlot.requestId,
        startAt: acceptedSlot.startAt,
        endAt: acceptedSlot.endAt,
      });
      router.push('/partner/host/events');
      return;
    }
    if (!selectedSlotId) throw new Error('Choose an open Venue slot before requesting it.');
    let idempotencyKey = requestKeys.current.get(selectedSlotId);
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID();
      requestKeys.current.set(selectedSlotId, idempotencyKey);
    }
    await requestHostAvailabilitySlot({
      organizationId,
      venueId: draft.venueId,
      slotId: selectedSlotId,
      idempotencyKey,
    });
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
            timeZone: acceptedSlot.timezone,
          }).format(new Date(acceptedSlot.startAt))}{' '}
          to{' '}
          {new Intl.DateTimeFormat('en-IN', {
            timeStyle: 'short',
            timeZone: acceptedSlot.timezone,
          }).format(new Date(acceptedSlot.endAt))}{' '}
          ({acceptedSlot.timezone}). The event will use this reserved time.
        </p>
      ) : null}
      <PartnerEventEditor
        data={liveData}
        availability={state.data}
        mode="create"
        initialVenueId={selectedVenue.venue.id}
        onSubmit={submitHostEvent}
        {...(initialStep ? { initialStep } : {})}
        {...(requestedDay?.state === 'available' ? { initialDate: requestedDay.date } : {})}
        {...(requestedSlot ? { initialSlotId: requestedSlot.id } : {})}
        {...(acceptedSlot ? { acceptedSlotMode: true } : {})}
      />
    </>
  );
}
