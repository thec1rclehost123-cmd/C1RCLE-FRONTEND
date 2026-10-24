'use client';

import { EmptyState, ErrorState } from '@/components/partner-v3/States';
import { requestHostAvailabilitySlot } from '@/lib/calendar/host-availability-repository';
import { useHostAvailability } from '@/lib/calendar/use-host-availability';
import { currentMonthKey } from '@/lib/calendar/venue-calendar-repository';
import { useRef } from 'react';

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
  const requestKeys = useRef(new Map<string, string>());
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
  if (state.loading) {
    return (
      <section role="status" aria-live="polite" aria-busy="true">
        Loading host availability…
      </section>
    );
  }
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
      onRequestSlot={async (venueId, slotId) => {
        let idempotencyKey = requestKeys.current.get(slotId);
        if (!idempotencyKey) {
          idempotencyKey = crypto.randomUUID();
          requestKeys.current.set(slotId, idempotencyKey);
        }
        await requestHostAvailabilitySlot({
          organizationId,
          venueId,
          slotId,
          idempotencyKey,
        });
        requestKeys.current.delete(slotId);
        state.retry();
      }}
    />
  );
}
