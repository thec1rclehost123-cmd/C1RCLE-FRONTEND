'use client';

import { EmptyState, ErrorState } from '@/components/partner-v3/States';
import { useVenueCalendar } from '@/lib/calendar/use-venue-calendar';
import { blockVenueDate, currentMonthKey } from '@/lib/calendar/venue-calendar-repository';

import { VenueCalendarScreen } from './VenueCalendarScreen';

export function VenueCalendarRoute({
  organizationId,
  initialMonth,
  initialDate,
  initialDialog,
}: {
  readonly organizationId: string | null;
  readonly initialMonth?: string;
  readonly initialDate?: string;
  readonly initialDialog?: boolean;
}) {
  const state = useVenueCalendar({
    organizationId,
    anchorMonth: initialMonth ?? currentMonthKey(),
    monthsBefore: 1,
    monthsAfter: 12,
  });

  if (!organizationId) {
    return (
      <EmptyState
        title="Choose an organization"
        description="Select an active venue organization to view its calendar."
      />
    );
  }
  if (state.loading) return null;
  if (state.error) {
    return (
      <ErrorState title="Calendar unavailable" description={state.error} onRetry={state.retry} />
    );
  }
  if (!state.data?.venue || !state.data.calendar) {
    return (
      <EmptyState
        title="No active venue"
        description="Create or activate a venue before managing its calendar."
      />
    );
  }
  const venueId = state.data.venue.id;

  return (
    <VenueCalendarScreen
      data={state.data.calendar}
      initialMonth={initialMonth ?? currentMonthKey()}
      {...(initialDate ? { initialDate } : {})}
      {...(initialDialog ? { initialDialog } : {})}
      onBlockDate={async (input) => {
        await blockVenueDate({ organizationId, venueId, input });
        state.retry();
      }}
    />
  );
}
