'use client';

import { useRef } from 'react';

import { EmptyState, ErrorState } from '@/components/partner-v3/States';
import { useVenueCalendar } from '@/lib/calendar/use-venue-calendar';
import {
  blockVenueDate,
  currentMonthKey,
  publishVenueAvailability,
  unblockVenueDate,
  type CreateVenueBlockInput,
  type PublishVenueAvailabilityInput,
} from '@/lib/calendar/venue-calendar-repository';

import { VenueCalendarScreen } from './VenueCalendarScreen';

export function VenueCalendarRoute({
  organizationId,
  initialMonth,
  initialDate,
  initialDialog,
  initialAvailabilityDialog,
}: {
  readonly organizationId: string | null;
  readonly initialMonth?: string;
  readonly initialDate?: string;
  readonly initialDialog?: boolean;
  readonly initialAvailabilityDialog?: boolean;
}) {
  const unblockIdempotencyKeys = useRef(new Map<string, string>());
  const availabilityIdempotencyKeys = useRef(new Map<string, string>());
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
  if (state.loading) {
    return (
      <section role="status" aria-live="polite" aria-busy="true">
        Loading venue calendar…
      </section>
    );
  }
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
      {...(initialAvailabilityDialog ? { initialAvailabilityDialog } : {})}
      onBlockDate={async (input: CreateVenueBlockInput) => {
        await blockVenueDate({ organizationId, venueId, input });
        state.retry();
      }}
      onUnblockDate={async (blockId) => {
        let idempotencyKey = unblockIdempotencyKeys.current.get(blockId);
        if (!idempotencyKey) {
          idempotencyKey = crypto.randomUUID();
          unblockIdempotencyKeys.current.set(blockId, idempotencyKey);
        }
        await unblockVenueDate({ organizationId, venueId, blockId, idempotencyKey });
        state.retry();
      }}
      onPublishAvailability={async (input: PublishVenueAvailabilityInput) => {
        const key = JSON.stringify(input);
        let idempotencyKey = availabilityIdempotencyKeys.current.get(key);
        if (!idempotencyKey) {
          idempotencyKey = crypto.randomUUID();
          availabilityIdempotencyKeys.current.set(key, idempotencyKey);
        }
        await publishVenueAvailability({
          organizationId,
          venueId,
          input,
          idempotencyKey,
        });
        availabilityIdempotencyKeys.current.delete(key);
        state.retry();
      }}
    />
  );
}
