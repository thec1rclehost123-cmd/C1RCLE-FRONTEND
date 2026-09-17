'use client';

import { EmptyState, ErrorState } from '@/components/partner-v3/States';
import { useHostAvailability } from '@/lib/calendar/use-host-availability';
import { currentMonthKey } from '@/lib/calendar/venue-calendar-repository';

import { HostAvailabilityScreen } from './HostAvailabilityScreen';

export function HostAvailabilityRoute({
  organizationId,
  initialMonth,
  initialDate,
  initialVenue,
  initialSlot,
}: {
  readonly organizationId: string | null;
  readonly initialMonth?: string;
  readonly initialDate?: string;
  readonly initialVenue?: string;
  readonly initialSlot?: string;
}) {
  const state = useHostAvailability({
    organizationId,
    anchorMonth: initialMonth ?? currentMonthKey(),
    monthsBefore: 1,
    monthsAfter: 12,
  });

  if (!organizationId) {
    return (
      <EmptyState
        title="Choose an organization"
        description="Select an active host organization to view partnered venue availability."
      />
    );
  }
  if (state.loading) return null;
  if (state.error) {
    return (
      <ErrorState
        title="Availability unavailable"
        description={state.error}
        onRetry={state.retry}
      />
    );
  }
  if (!state.data?.venues.length) {
    return (
      <EmptyState
        title="No active venue partnerships"
        description="Connect with a venue before looking for an available event slot."
      />
    );
  }

  return (
    <HostAvailabilityScreen
      data={state.data}
      initialMonth={initialMonth ?? currentMonthKey()}
      {...(initialDate ? { initialDate } : {})}
      {...(initialVenue ? { initialVenue } : {})}
      {...(initialSlot ? { initialSlot } : {})}
    />
  );
}
