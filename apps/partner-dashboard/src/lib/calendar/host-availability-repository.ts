import { paginatedSchema } from '@c1rcle/api-client';
import { PRODUCT_TIME_ZONE } from '@c1rcle/contracts';
import {
  eventDtoSchema,
  partnershipDtoSchema,
  slotRequestDtoSchema,
  venueAvailabilityDtoSchema,
  venueDtoSchema,
  type EventDto,
  type VenueAvailabilityDto,
  type VenueDto,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import {
  eventDatePartInIndia,
  formatEventTimeRange,
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
          query: {
            ...range,
            to: new Date(Date.parse(range.to) + 48 * 60 * 60 * 1000).toISOString(),
          },
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
    const date = eventDatePartInIndia(event.startAt);
    if (!date) continue;
    const item: CalendarEvent = {
      id: event.id,
      date,
      name: event.title,
      time: formatEventTimeRange(event.startAt, event.endAt),
      status: pendingEventStatuses.has(event.status) ? 'pending' : 'confirmed',
      venue: venue.name,
      href: `/partner/host/events/${event.id}`,
    };
    eventsByDate.set(date, [...(eventsByDate.get(date) ?? []), item]);
  }

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
        state: freeTimeSlots(date, availability.slots, events).length
          ? 'available'
          : hostDayState(dayEvents, daySlots),
        events: dayEvents,
        slots: freeTimeSlots(date, availability.slots, events),
      };
    });
    return [
      {
        key,
        label: new Intl.DateTimeFormat('en-US', {
          month: 'long',
          year: 'numeric',
          timeZone: PRODUCT_TIME_ZONE,
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
  if (events.some((event) => event.status === 'pending')) return 'pending';
  if (slots.some((slot) => slot.status === 'pending')) return 'pending';
  if (events.length > 0 || slots.some((slot) => slot.status === 'booked')) return 'confirmed';
  if (slots.some((slot) => slot.status === 'open')) return 'available';
  return 'unavailable';
}

export function freeTimeSlots(
  date: string,
  slots: VenueAvailabilityDto['slots'],
  events: readonly EventDto[] = [],
): readonly AvailabilitySlot[] {
  const start = Date.parse(`${date}T00:00:00+05:30`);
  const dayEnd = start + 24 * 60 * 60 * 1000;
  const end = dayEnd + 24 * 60 * 60 * 1000;
  const occupied = [
    ...slots
      .filter((slot) => slot.status !== 'open' && slot.status !== 'cancelled')
      .map((slot) => [Date.parse(slot.startTime), Date.parse(slot.endTime)]),
    ...events
      .filter((event) => !inactiveEventStatuses.has(event.status))
      .map((event) => [Date.parse(event.startAt), Date.parse(event.endAt ?? event.startAt)]),
  ]
    .filter((range) => (range[0] ?? end) < end && (range[1] ?? start) > start)
    .sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0));
  let cursor = Math.max(start, Math.ceil((Date.now() + 60_000) / 60_000) * 60_000);
  const gaps: [number, number][] = [];
  for (const range of occupied) {
    const from = Math.max(start, range[0] ?? start);
    const to = Math.min(end, range[1] ?? end);
    if (from > cursor && cursor < end) gaps.push([cursor, from]);
    cursor = Math.max(cursor, to);
  }
  if (cursor < end) gaps.push([cursor, end]);
  const format = (value: number) =>
    new Intl.DateTimeFormat('en-IN', {
      timeZone: PRODUCT_TIME_ZONE,
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  return gaps
    .filter(([from]) => from < dayEnd)
    .map(([from, to], index) => ({
      id: `free-${date}-${String(index)}`,
      label: `${format(from)} – ${format(to)}${to >= end ? ' (+2 days)' : to >= dayEnd ? ' (next day)' : ''} IST`,
      status: 'available' as const,
      startTime: new Date(from).toISOString(),
      endTime: new Date(to).toISOString(),
      timezone: PRODUCT_TIME_ZONE,
    }));
}

export async function requestHostAvailabilitySlot({
  organizationId,
  venueId,
  slotId,
  idempotencyKey,
  eventId,
  startTime,
  endTime,
}: {
  readonly organizationId: string;
  readonly venueId: string;
  readonly slotId: string;
  readonly idempotencyKey: string;
  readonly eventId?: string;
  readonly startTime?: string;
  readonly endTime?: string;
}) {
  return apiClient.post({
    path: `/api/v2/venues/${encodeURIComponent(venueId)}/slot-requests`,
    body: {
      ...(slotId.startsWith('free-') ? { startTime, endTime } : { slotId }),
      ...(eventId ? { eventId } : {}),
      message: eventId
        ? `Requesting a new Venue slot for event ${eventId}.`
        : 'Requesting the selected Venue time.',
    },
    headers: {
      'x-organization-id': organizationId,
      'Idempotency-Key': idempotencyKey,
    },
    schema: slotRequestDtoSchema,
  });
}

function emptyHostAvailability(): HostAvailabilityData {
  return { dataStatus: 'live', accent: 'lavender', venues: [] };
}
