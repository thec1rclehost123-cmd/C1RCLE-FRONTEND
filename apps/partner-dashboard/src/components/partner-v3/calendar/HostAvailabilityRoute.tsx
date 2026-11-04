'use client';

import { useRef } from 'react';

import { PartnerDashboardSkeleton } from '@/components/partner-v3/PartnerDashboardSkeleton';
import { EmptyState, ErrorState } from '@/components/partner-v3/States';
import { requestHostAvailabilitySlot } from '@/lib/calendar/host-availability-repository';
import { useHostAvailability } from '@/lib/calendar/use-host-availability';
import { currentMonthKey } from '@/lib/calendar/venue-calendar-repository';

import { HostAvailabilityScreen } from './HostAvailabilityScreen';

export function HostAvailabilityRoute({
  organizationId,
  initialMonth,
  initialDate,
  initialVenue,
  initialSlot,
  initialEventId,
}: {
  readonly organizationId: string | null;
  readonly initialMonth?: string;
  readonly initialDate?: string;
  readonly initialVenue?: string;
  readonly initialSlot?: string;
  readonly initialEventId?: string;
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
    return <PartnerDashboardSkeleton label="Loading host availability…" />;
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

  const displayData = {
    ...state.data,
    venues: state.data.venues.map((item) => ({
      ...item,
      months: item.months.map((month) => ({
        ...month,
        days: month.days.map((day) => ({
          ...day,
          slots: day.slots.map((slot) => {
            if (!slot.id.startsWith('free-') || !slot.startTime || !slot.endTime) return slot;
            const endTime = new Date(
              Math.min(Date.parse(slot.endTime), Date.parse(slot.startTime) + 24 * 60 * 60 * 1000),
            ).toISOString();
            const format = (value: string) =>
              new Intl.DateTimeFormat('en-IN', {
                timeZone: 'Asia/Kolkata',
                day: 'numeric',
                month: 'short',
                hour: 'numeric',
                minute: '2-digit',
              }).format(new Date(value));
            return {
              ...slot,
              endTime,
              label: `${format(slot.startTime)} – ${format(endTime)} IST`,
            };
          }),
        })),
      })),
    })),
  };
  return (
    <HostAvailabilityScreen
      data={displayData}
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
        const selected = state.data?.venues
          .find((item) => item.venue.id === venueId)
          ?.months.flatMap((month) => month.days)
          .flatMap((day) => day.slots)
          .find((slot) => slot.id === slotId);
        await requestHostAvailabilitySlot({
          organizationId,
          venueId,
          slotId,
          ...(selected?.startTime && selected.endTime
            ? {
                startTime: selected.startTime,
                endTime: new Date(
                  Math.min(
                    Date.parse(selected.endTime),
                    Date.parse(selected.startTime) + 24 * 60 * 60 * 1000,
                  ),
                ).toISOString(),
              }
            : {}),
          idempotencyKey,
          ...(initialEventId ? { eventId: initialEventId } : {}),
        });
        requestKeys.current.delete(slotId);
        state.retry();
      }}
    />
  );
}
