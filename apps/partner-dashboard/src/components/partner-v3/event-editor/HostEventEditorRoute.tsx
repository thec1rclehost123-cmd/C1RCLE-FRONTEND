'use client';

import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, LoadingState } from '@/components/partner-v3/States';
import { useHostAvailability } from '@/lib/calendar/use-host-availability';
import { currentMonthKey } from '@/lib/calendar/venue-calendar-repository';
import { submitHostEventRequest } from '@/lib/events/venue-event-repository';
import { useConnectedPromoters } from '@/lib/partner/use-connected-promoters';

import { PartnerEventEditor } from './PartnerEventEditor';

import type { EventEditorData, EventEditorDraft } from '@/data/partner-data-source';

export function HostEventEditorRoute({
  organizationId,
  data,
  initialStep,
  initialVenueId,
  initialDate,
  initialSlotId,
}: {
  readonly organizationId: string | null;
  readonly data: EventEditorData;
  readonly initialStep?: string;
  readonly initialVenueId?: string;
  readonly initialDate?: string;
  readonly initialSlotId?: string;
}) {
  const router = useRouter();
  const anchorMonth =
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)
      ? initialDate.slice(0, 7)
      : currentMonthKey();
  const state = useHostAvailability({ organizationId, anchorMonth, monthsAfter: 12 });
  const promoters = useConnectedPromoters(organizationId);

  if (!organizationId) {
    return (
      <EmptyState
        title="Choose an organization"
        description="Select an active host organization before creating an event."
      />
    );
  }
  if (state.loading || promoters.loading) return <LoadingState label="Loading event setup" />;
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

  const selectedVenue =
    state.data.venues.find((item) => item.venue.id === initialVenueId) ?? state.data.venues[0];
  if (!selectedVenue) return null;
  const requestedDay = selectedVenue.months
    .flatMap((month) => month.days)
    .find((day) => day.date === initialDate);
  const requestedSlot = requestedDay?.slots.find((slot) => slot.id === initialSlotId);
  const artwork = data.artworkOptions[0] ?? data.defaultDraft.artwork;
  const liveData: EventEditorData = {
    ...data,
    promoters: promoters.data.length ? promoters.data : data.promoters,
    venues: state.data.venues.map((item, index) => ({
      id: item.venue.id,
      name: item.venue.name,
      meta: item.venue.meta,
      artwork: data.artworkOptions[index % Math.max(1, data.artworkOptions.length)] ?? artwork,
    })),
    defaultDraft: {
      ...data.defaultDraft,
      venueId: selectedVenue.venue.id,
      time: requestedSlot?.label ?? data.defaultDraft.time,
    },
  };

  const submitHostEvent = async (draft: EventEditorDraft) => {
    await submitHostEventRequest(organizationId, draft);
    const params = new URLSearchParams({ requested: 'true' });
    router.push(`/partner/host/slot-requests?${params.toString()}`);
  };

  return (
    <PartnerEventEditor
      data={liveData}
      availability={state.data}
      mode="create"
      initialVenueId={selectedVenue.venue.id}
      onSubmit={submitHostEvent}
      {...(initialStep ? { initialStep } : {})}
      {...(requestedDay?.state === 'available' ? { initialDate: requestedDay.date } : {})}
      {...(requestedSlot ? { initialSlotId: requestedSlot.id } : {})}
    />
  );
}
