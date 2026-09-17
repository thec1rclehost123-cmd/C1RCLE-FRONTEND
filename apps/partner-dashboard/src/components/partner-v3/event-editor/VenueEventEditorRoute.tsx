'use client';

import { useRouter } from 'next/navigation';

import { EmptyState, ErrorState, LoadingState } from '@/components/partner-v3/States';
import { useVenueCalendar } from '@/lib/calendar/use-venue-calendar';
import { currentMonthKey } from '@/lib/calendar/venue-calendar-repository';
import { publishVenueEvent } from '@/lib/events/venue-event-repository';
import { useConnectedPromoters } from '@/lib/partner/use-connected-promoters';

import { canSelectEventDate } from './event-date-selection';
import { PartnerEventEditor } from './PartnerEventEditor';

import type { EventEditorData, EventEditorDraft } from '@/data/partner-data-source';

export function VenueEventEditorRoute({
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
  const state = useVenueCalendar({
    organizationId,
    anchorMonth,
    ...(initialVenueId ? { venueId: initialVenueId } : {}),
    monthsAfter: 12,
  });
  const promoters = useConnectedPromoters(organizationId);

  if (!organizationId) {
    return (
      <EmptyState
        title="Choose an organization"
        description="Select an active venue organization before creating an event."
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
  if (!state.data?.venue || !state.data.calendar) {
    return (
      <EmptyState
        title="No active venue"
        description="Create or activate a venue before creating an event."
      />
    );
  }

  const selectedVenue = state.data.venue;
  const artwork = data.artworkOptions[0] ?? data.defaultDraft.artwork;
  const liveData: EventEditorData = {
    ...data,
    promoters: promoters.data,
    venues: state.data.venues.map((venue, index) => ({
      id: venue.id,
      name: venue.name,
      meta: [venue.city, venue.capacity ? `${String(venue.capacity)} capacity` : 'Capacity not set']
        .filter(Boolean)
        .join(' · '),
      artwork: data.artworkOptions[index % Math.max(1, data.artworkOptions.length)] ?? artwork,
    })),
    defaultDraft: { ...data.defaultDraft, venueId: selectedVenue.id },
  };

  const requestedDay = state.data.calendar.months
    .flatMap((month) => month.days)
    .find((day) => day.date === initialDate);
  const usableInitialDate =
    requestedDay && canSelectEventDate(requestedDay.state, 'venue') ? initialDate : undefined;
  const publishEvent = async (draft: EventEditorDraft) => {
    await publishVenueEvent(organizationId, draft);
    const params = new URLSearchParams({ month: draft.date.slice(0, 7), date: draft.date });
    router.push(`/partner/venue/calendar?${params.toString()}`);
  };

  return (
    <PartnerEventEditor
      data={liveData}
      availability={state.data.calendar}
      mode="create"
      initialVenueId={selectedVenue.id}
      onSubmit={publishEvent}
      {...(initialStep ? { initialStep } : {})}
      {...(usableInitialDate ? { initialDate: usableInitialDate } : {})}
      {...(initialSlotId ? { initialSlotId } : {})}
    />
  );
}
