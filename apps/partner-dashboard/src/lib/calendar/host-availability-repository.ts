import { paginatedSchema } from '@c1rcle/api-client';
import {
  eventDtoSchema,
  partnershipDtoSchema,
  venueAvailabilityDtoSchema,
  venueDtoSchema,
  type EventDto,
  type VenueAvailabilityDto,
  type VenueDto,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import {
  formatTimeRange,
  isoDatePart,
  parseMonthKey,
  rangeForMonthKeys,
} from './venue-calendar-repository';

import type {
  AvailabilitySlot,
  CalendarDay,
  CalendarDayState,
  CalendarEvent,
  CalendarMonth,
  HostAvailabilityData,
  HostAvailabilityVenue,
} from '@/data/partner-data-source';

const inactiveEventStatuses = new Set<EventDto['status']>(['archived', 'cancelled']);
const pendingEventStatuses = new Set<EventDto['status']>(['draft', 'review']);

export interface LoadHostAvailabilityInput {
  readonly organizationId: string;
  readonly monthKeys: readonly string[];
  readonly signal?: AbortSignal;
}

export async function loadHostAvailability({
  organizationId,
  monthKeys,
  signal,
}: LoadHostAvailabilityInput): Promise<HostAvailabilityData> {
  const range = rangeForMonthKeys(monthKeys);
  if (!range) return emptyHostAvailability();

  const headers = { 'x-organization-id': organizationId };
  const [partnershipResponse, eventResponse] = await Promise.all([
    apiClient.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partnerships`,
      query: { limit: 100 },
      headers,
      schema: paginatedSchema(partnershipDtoSchema),
      ...(signal ? { signal } : {}),
    }),
    apiClient.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/events`,
      query: { limit: 100 },
      headers,
      schema: paginatedSchema(eventDtoSchema),
      ...(signal ? { signal } : {}),
    }),
  ]);

  const partnerships = partnershipResponse.items.filter(
    (partnership) =>
      partnership.hostOrganizationId === organizationId && partnership.status === 'active',
  );
  const venues = await Promise.all(
    partnerships.map(async (partnership) => {
      const venueId = encodeURIComponent(partnership.venueId);
      const [venue, availability] = await Promise.all([
        apiClient.get({
          path: `/api/v2/venues/${venueId}`,
          headers,
          schema: venueDtoSchema,
          ...(signal ? { signal } : {}),
        }),
        apiClient.get({
          path: `/api/v2/venues/${venueId}/availability`,
          query: range,
          headers,
          schema: venueAvailabilityDtoSchema,
          ...(signal ? { signal } : {}),
        }),
      ]);
      return { venue, availability };
    }),
  );

  return mapHostAvailability({
    monthKeys,
    venues,
    events: eventResponse.items,
  });
}

export function mapHostAvailability({
  monthKeys,
  venues,
  events,
}: {
  readonly monthKeys: readonly string[];
  readonly venues: readonly {
    readonly venue: VenueDto;
    readonly availability: VenueAvailabilityDto;
  }[];
  readonly events: readonly EventDto[];
}): HostAvailabilityData {
  return {
    dataStatus: 'live',
    accent: 'lavender',
    venues: venues.map(({ venue, availability }): HostAvailabilityVenue => ({
      venue: {
        id: venue.id,
        name: venue.name,
        meta: [venue.city, venue.capacity === null ? null : `Capacity ${String(venue.capacity)}`]
          .filter(Boolean)
          .join(' · '),
        status: 'Partnered',
      },
      months: buildHostMonths(
        monthKeys,
        venue,
        availability,
        events.filter((event) => event.venueId === venue.id),
      ),
    })),
  };
}

function buildHostMonths(
  monthKeys: readonly string[],
  venue: VenueDto,
  availability: VenueAvailabilityDto,
  events: readonly EventDto[],
): readonly CalendarMonth[] {
  const slotsByDate = new Map<string, VenueAvailabilityDto['slots']>();
  for (const slot of availability.slots) {
    if (slot.status === 'cancelled') continue;
    const date = isoDatePart(slot.startTime);
    if (!date) continue;
    slotsByDate.set(date, [...(slotsByDate.get(date) ?? []), slot]);
  }

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    if (inactiveEventStatuses.has(event.status)) continue;
    const date = isoDatePart(event.startAt);
    if (!date) continue;
    const item: CalendarEvent = {
      id: event.id,
      date,
      name: event.title,
      time: formatTimeRange(event.startAt, event.endAt),
      status: pendingEventStatuses.has(event.status) ? 'pending' : 'confirmed',
      venue: venue.name,
      href: `/partner/host/events/${event.id}`,
    };
    eventsByDate.set(date, [...(eventsByDate.get(date) ?? []), item]);
  }

  // Cancelled slots are historical records, not a configured venue schedule.
  // Counting them here makes every other date appear unavailable to hosts.
  return monthKeys.flatMap((key): CalendarMonth[] => {
    const parsed = parseMonthKey(key);
    if (!parsed) return [];
    const daysInMonth = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
    const days = Array.from({ length: daysInMonth }, (_, index): CalendarDay => {
      const day = index + 1;
      const date = `${key}-${String(day).padStart(2, '0')}`;
      const dayEvents = eventsByDate.get(date) ?? [];
      const daySlots = slotsByDate.get(date) ?? [];
      return {
        date,
        day,
        state: hostDayState(dayEvents, daySlots),
        events: dayEvents,
        slots: openSlots(date, daySlots),
      };
    });
    return [
      {
        key,
        label: new Intl.DateTimeFormat('en-US', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1))),
        firstDayOffset: new Date(Date.UTC(parsed.year, parsed.month - 1, 1)).getUTCDay(),
        daysInMonth,
        days,
      },
    ];
  });
}

function hostDayState(
  events: readonly CalendarEvent[],
  slots: VenueAvailabilityDto['slots'],
): CalendarDayState {
  // A day can contain a booked/pending event and still have another open
  // venue slot. Availability is slot-granular, so an open slot must keep the
  // day selectable for hosts instead of being masked by the day's events.
  if (slots.some((slot) => slot.status === 'open')) return 'available';
  if (events.some((event) => event.status === 'pending')) return 'pending';
  if (events.length > 0 || slots.some((slot) => slot.status === 'booked')) return 'confirmed';
  // No venue slot record means the date has not been explicitly closed. Host
  // requests use the default windows below until the venue books/blocks it.
  if (slots.length === 0 && events.length === 0) return 'available';
  return 'unavailable';
}

function openSlots(
  date: string,
  slots: VenueAvailabilityDto['slots'],
): readonly AvailabilitySlot[] {
  const explicitOpen = slots
    .filter((slot) => slot.status === 'open')
    .map((slot) => ({
      id: slot.id,
      label: formatTimeRange(slot.startTime, slot.endTime),
      status: 'available' as const,
    }));
  if (explicitOpen.length > 0) return explicitOpen;

  if (slots.length === 0) {
    return [
      { id: `${date}-late`, label: '8:00 PM – 11:00 PM', status: 'available' },
      { id: `${date}-night`, label: '11:00 PM – 3:00 AM', status: 'available' },
    ];
  }

  return [];
}

function emptyHostAvailability(): HostAvailabilityData {
  return { dataStatus: 'live', accent: 'lavender', venues: [] };
}
