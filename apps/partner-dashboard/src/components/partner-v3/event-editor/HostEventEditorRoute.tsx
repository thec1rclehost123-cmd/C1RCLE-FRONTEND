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
import { useAssignablePromoters } from '@/lib/partner/use-connected-promoters';
import { loadSlotRequestsData } from '@/lib/slot-requests/slot-request-repository';

import { PartnerEventEditor } from './PartnerEventEditor';

import type { EventEditorData, EventEditorDraft, SlotRequest } from '@/data/partner-data-source';

function localParts(value: string) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: PRODUCT_TIME_ZONE }).format(
    new Date(value),
  );
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: PRODUCT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
  return { date, time };
}

function draftFromRejectedRequest(base: EventEditorDraft, request: SlotRequest): EventEditorDraft {
  const proposal = request.eventDraft;
  if (!proposal) return base;
  const { date, time } = localParts(proposal.event.startAt);
  const endTime = proposal.event.endAt ? localParts(proposal.event.endAt).time : base.endTime;
  const compensation = proposal.event.compensation;
  return {
    ...base,
    name: proposal.event.title,
    description: proposal.event.description ?? proposal.event.summary ?? '',
    venueId: proposal.event.venueId,
    date,
    dateLabel: formatEventDateLabel(date),
    time,
    ...(endTime ? { endTime } : {}),
    genres: proposal.event.tags,
    artwork: proposal.event.imageUrl
      ? { type: 'image', value: proposal.event.imageUrl, alt: proposal.event.title }
      : base.artwork,
    ...(proposal.event.visibilityMode ? { visibilityMode: proposal.event.visibilityMode } : {}),
    ...(proposal.event.addressDisclosure
      ? { addressDisclosure: proposal.event.addressDisclosure }
      : {}),
    ticketTiers: proposal.tiers.map(({ localId, command }) => ({
      ...base.ticketTiers[0],
      id: localId,
      name: command.name,
      price: (command.priceInPaise ?? 0) / 100,
      quantity: command.quantity,
      ...(command.maxPerOrder != null ? { maxPerOrder: command.maxPerOrder } : {}),
      ...(command.accessType ? { accessType: command.accessType } : {}),
      ...(command.accessMode ? { accessMode: command.accessMode } : {}),
      ...(command.audienceType ? { audienceType: command.audienceType } : {}),
      ...(command.guestCount ? { guestCount: command.guestCount } : {}),
      ...(command.admissionMode ? { admissionMode: command.admissionMode } : {}),
      ...(command.doorPriceInPaise != null ? { doorPrice: command.doorPriceInPaise / 100 } : {}),
      ...(command.benefits ? { benefits: command.benefits } : {}),
      ...(command.minAge != null ? { minAge: command.minAge } : {}),
      ...(command.maxAge != null ? { maxAge: command.maxAge } : {}),
      ...(command.minPerOrder != null ? { minPerOrder: command.minPerOrder } : {}),
      ...(command.maxPerUser != null ? { maxPerUser: command.maxPerUser } : {}),
      ...(command.commissionEligible != null
        ? { commissionEligible: command.commissionEligible }
        : {}),
      ...(command.description ? { description: command.description } : {}),
      ...(command.coverAmountPaise ? { coverAmountPaise: command.coverAmountPaise } : {}),
      ...(command.tableConfig ? { tableConfig: command.tableConfig } : {}),
      ...(command.pricingPhases
        ? {
            pricingPhases: command.pricingPhases.map((phase) => {
              const start = 'startsAt' in phase ? localParts(phase.startsAt).date : phase.startDate;
              const end = 'endsAt' in phase ? localParts(phase.endsAt).date : phase.endDate;
              const ddMm = (value: string) => {
                const [, month = '', day = ''] = value.split('-');
                return `${day}-${month}`;
              };
              return {
                id: phase.id,
                name: phase.name,
                priceInPaise: phase.priceInPaise,
                startDate: /^\d{4}-\d{2}-\d{2}$/.test(start) ? ddMm(start) : start,
                endDate: /^\d{4}-\d{2}-\d{2}$/.test(end) ? ddMm(end) : end,
                quantity: phase.quantity,
              };
            }),
          }
        : {}),
    })),
    selectedPromoterIds: proposal.promoters.map((item) => item.promoterId),
    ...(proposal.promoters.length
      ? {
          promoterOverrides: Object.fromEntries(
            proposal.promoters.map((item) => [
              item.promoterId,
              Object.fromEntries(
                Object.entries(item.tierRates ?? {}).map(([tierId, rate]) => [
                  tierId,
                  rate.ratePercent,
                ]),
              ),
            ]),
          ),
        }
      : {}),
    promoCodes: proposal.promotions.map((item) => item.code),
    promoCodeSettings: proposal.promotions.map((item, index) => ({
      id: `resubmit-promo-${String(index)}`,
      code: item.code,
      discountType: item.discountType,
      discountValue: item.discountType === 'fixed' ? item.discountValue / 100 : item.discountValue,
      quantity: item.maxRedemptions ?? null,
      endsAt: item.endsAt ? `${localParts(item.endsAt).date}T${localParts(item.endsAt).time}` : '',
      fundingOwner: item.discountFundingOwner === 'venue' ? 'venue' : 'host',
    })),
    ...(proposal.event.media
      ? {
          media: {
            ...(proposal.event.media.titleFont
              ? { titleFont: proposal.event.media.titleFont }
              : {}),
            youtubeUrl: proposal.event.media.youtubeUrl ?? '',
            gallery: proposal.event.media.gallery.map((item) => ({
              type: 'image' as const,
              value: item.url,
              alt: item.alt,
            })),
            spotlights: proposal.event.media.spotlights.map((item) => ({
              id: item.id,
              title: item.title,
              link: item.link ?? '',
              description: item.description,
              startTime: item.startTime ?? '',
              endTime: item.endTime ?? '',
              ...(item.imageUrl
                ? { artwork: { type: 'image' as const, value: item.imageUrl, alt: item.title } }
                : {}),
            })),
          },
        }
      : {}),
    ...(compensation
      ? {
          compensation: compensation.model,
          commissionRate: compensation.globalRatePercent ?? base.commissionRate,
          tierCommissions: compensation.tierRates,
          ...(compensation.salaryAmountPaise != null
            ? { salaryAmount: compensation.salaryAmountPaise / 100 }
            : {}),
          ...(compensation.salaryPeriod ? { salaryPeriod: compensation.salaryPeriod } : {}),
          ...(compensation.salaryNotes ? { salaryNotes: compensation.salaryNotes } : {}),
        }
      : {}),
  };
}

export function HostEventEditorRoute({
  organizationId,
  data,
  initialStep,
  initialVenueId,
  initialDate,
  initialSlotId,
  acceptedRequestId,
  resubmitRequestId,
}: {
  readonly organizationId: string | null;
  readonly data: EventEditorData;
  readonly initialStep?: string;
  readonly initialVenueId?: string;
  readonly initialDate?: string;
  readonly initialSlotId?: string;
  readonly acceptedRequestId?: string;
  readonly resubmitRequestId?: string;
}) {
  const router = useRouter();
  const requestKeys = useRef(new Map<string, string>());
  const [acceptedRequest, setAcceptedRequest] = useState<
    Awaited<ReturnType<typeof loadSlotRequestsData>>['requests'][number] | null
  >(null);
  const [acceptedRequestError, setAcceptedRequestError] = useState<string | null>(null);
  const [acceptedRequestLoading, setAcceptedRequestLoading] = useState(Boolean(acceptedRequestId));
  const [rejectedRequest, setRejectedRequest] = useState<SlotRequest | null>(null);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [resubmitLoading, setResubmitLoading] = useState(Boolean(resubmitRequestId));
  // Keep the availability request range stable while the user changes the
  // selected date. Changing the query param otherwise changes the request key,
  // renders the loading state, and unmounts the editor (discarding its draft).
  const [anchorMonth] = useState(() =>
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)
      ? initialDate.slice(0, 7)
      : currentMonthKey(),
  );
  const state = useHostAvailability({ organizationId, anchorMonth, monthsAfter: 12 });
  const promoters = useAssignablePromoters(organizationId);

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

  useEffect(() => {
    if (!resubmitRequestId) return;
    let active = true;
    loadSlotRequestsData('outgoing')
      .then((result) => {
        if (!active) return;
        const request = result.requests.find((item) => item.id === resubmitRequestId);
        if (request?.status !== 'rejected' || !request.eventDraft) {
          setResubmitError('This rejected request no longer has an editable Host proposal.');
          return;
        }
        setRejectedRequest(request);
      })
      .catch((error: unknown) => {
        if (active)
          setResubmitError(
            error instanceof Error ? error.message : 'Could not load the rejected proposal.',
          );
      })
      .finally(() => {
        if (active) setResubmitLoading(false);
      });
    return () => {
      active = false;
    };
  }, [resubmitRequestId]);

  if (!organizationId) {
    return (
      <EmptyState
        title="Choose an organization"
        description="Select an active host organization before creating an event."
      />
    );
  }
  if (state.loading || promoters.loading || acceptedRequestLoading || resubmitLoading)
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
  if (resubmitError)
    return <ErrorState title="Rejected request unavailable" description={resubmitError} />;
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
  const requestDate = rejectedRequest?.eventDraft
    ? localParts(rejectedRequest.eventDraft.event.startAt).date
    : undefined;
  const requestedVenueId = acceptedSlot?.venueId ?? rejectedRequest?.venueId ?? initialVenueId;
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
    .find((day) => day.date === (initialDate ?? requestDate));
  const requestedSlotId = initialSlotId ?? rejectedRequest?.slotId;
  const requestedSlot = requestedDay?.slots.find((slot) => slot.id === requestedSlotId);
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
  const requestEditorDraft = rejectedRequest
    ? draftFromRejectedRequest(data.defaultDraft, rejectedRequest)
    : data.defaultDraft;
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
      ...requestEditorDraft,
      venueId: selectedVenue?.venue.id ?? '',
      date: acceptedDate ?? requestEditorDraft.date,
      dateLabel: acceptedDate ? formatEventDateLabel(acceptedDate) : requestEditorDraft.dateLabel,
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
        requestEditorDraft.time,
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
          : requestEditorDraft.endTime
            ? { endTime: requestEditorDraft.endTime }
            : {}),
    },
  };

  const submitHostEvent = async (draft: EventEditorDraft, selectedSlotId: string) => {
    if (draft.externalVenue) {
      const key = draft.externalWorkflowKey ?? crypto.randomUUID();
      await publishVenueEvent(organizationId, draft, key);
      await clearDraftPoster(organizationId);
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
      await clearDraftPoster(organizationId);
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
      {rejectedRequest?.rejectionReason ? (
        <p role="status">
          Venue response: {rejectedRequest.rejectionReason}. Edit the proposal and choose an
          available time to send a new request. The rejected request and response remain in your
          history.
        </p>
      ) : null}
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
        restoreHostDraft={!rejectedRequest}
        organizationId={organizationId}
        {...(requestedVenueId ? { initialVenueId: requestedVenueId } : {})}
        onSubmit={submitHostEvent}
        {...(initialStep ? { initialStep } : {})}
        {...(requestedDay?.state === 'available' ? { initialDate: requestedDay.date } : {})}
        {...(requestedSlot ? { initialSlotId: requestedSlot.id } : {})}
        {...(acceptedSlot ? { acceptedSlotMode: true } : {})}
      />
    </>
  );
}
