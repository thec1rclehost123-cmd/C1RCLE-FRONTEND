import { paginatedSchema } from '@c1rcle/api-client';
import {
  eventDtoSchema,
  venueDtoSchema,
  venueSlotDtoSchema,
  type EventDto,
  type VenueDto,
  type VenueSlotDto,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';

import type {
  AvailabilitySlot,
  CalendarBlock,
  CalendarDay,
  CalendarDayState,
  CalendarEvent,
  CalendarMonth,
  VenueCalendarData,
} from '@/data/partner-data-source';

const inactiveEventStatuses = new Set<EventDto['status']>(['archived', 'cancelled']);
const pendingEventStatuses = new Set<EventDto['status']>(['draft', 'review']);

export interface VenueCalendarWorkspace {
  readonly venues: readonly VenueDto[];
  readonly venue: VenueDto | null;
  readonly calendar: VenueCalendarData | null;
}

export interface LoadVenueCalendarInput {
  readonly organizationId: string;
  readonly monthKeys: readonly string[];
  readonly venueId?: string;
  readonly signal?: AbortSignal;
}

export interface CreateVenueBlockInput {
  readonly date: string;
  readonly from: string;
  readonly to: string;
  readonly reason: string;
}

export async function blockVenueDate({
  organizationId,
  venueId,
  input,
}: {
  readonly organizationId: string;
  readonly venueId: string;
  readonly input: CreateVenueBlockInput;
}): Promise<VenueSlotDto> {
  const range = venueBlockTimeRange(input);
  if (!range) throw new Error('Choose a valid date and time range.');

  const label = input.reason.trim();
  if (!label) throw new Error('Enter a reason for blocking this date.');

  return apiClient.post({
    path: `/api/v2/venues/${encodeURIComponent(venueId)}/calendar/blocks`,
    body: { label, ...range },
    headers: {
      'x-organization-id': organizationId,
      'Idempotency-Key': crypto.randomUUID(),
    },
    schema: venueSlotDtoSchema,
  });
}

export function venueBlockTimeRange(
  input: Pick<CreateVenueBlockInput, 'date' | 'from' | 'to'>,
): { readonly startTime: string; readonly endTime: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.from)) return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.to)) return null;

  const start = new Date(`${input.date}T${input.from}:00.000Z`);
  const end = new Date(`${input.date}T${input.to}:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start.toISOString().slice(0, 10) !== input.date || start.getTime() === end.getTime()) {
    return null;
  }
  if (end < start) end.setUTCDate(end.getUTCDate() + 1);

  return { startTime: start.toISOString(), endTime: end.toISOString() };
}

export function currentMonthKey(now = new Date()): string {
  return `${String(now.getUTCFullYear())}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function calendarMonthKeys(
  anchorMonth: string,
  monthsBefore = 0,
  monthsAfter = 12,
): readonly string[] {
  const anchor = parseMonthKey(anchorMonth) ?? parseMonthKey(currentMonthKey());
  if (!anchor) return [];

  return Array.from({ length: monthsBefore + monthsAfter + 1 }, (_, index) => {
    const date = new Date(Date.UTC(anchor.year, anchor.month - 1 - monthsBefore + index, 1));
    return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  });
}

export async function loadVenueCalendarWorkspace({
  organizationId,
  monthKeys,
  venueId,
  signal,
}: LoadVenueCalendarInput): Promise<VenueCalendarWorkspace> {
  const venueResponse = await apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/venues`,
    query: { limit: 100 },
    headers: { 'x-organization-id': organizationId },
    schema: paginatedSchema(venueDtoSchema),
    ...(signal ? { signal } : {}),
  });
  const venues = venueResponse.items.filter((venue) => venue.status === 'active');
  const venue = venues.find((item) => item.id === venueId) ?? venues[0] ?? null;

  if (!venue || monthKeys.length === 0) {
    return { venues, venue, calendar: null };
  }

  const range = rangeForMonthKeys(monthKeys);
  if (!range) return { venues, venue, calendar: null };

  const [slots, eventResponse] = await Promise.all([
    apiClient.get({
      path: `/api/v2/venues/${encodeURIComponent(venue.id)}/calendar`,
      query: range,
      headers: { 'x-organization-id': organizationId },
      schema: venueSlotDtoSchema.array(),
      ...(signal ? { signal } : {}),
    }),
    apiClient.get({
      path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/events`,
      query: { limit: 100 },
      headers: { 'x-organization-id': organizationId },
      schema: paginatedSchema(eventDtoSchema),
      ...(signal ? { signal } : {}),
    }),
  ]);

  return {
    venues,
    venue,
    calendar: mapVenueCalendar({
      monthKeys,
      venue,
      slots,
      events: eventResponse.items.filter((event) => event.venueId === venue.id),
    }),
  };
}

export function mapVenueCalendar({
  monthKeys,
  venue,
  slots,
  events,
}: {
  readonly monthKeys: readonly string[];
  readonly venue: VenueDto;
  readonly slots: readonly VenueSlotDto[];
  readonly events: readonly EventDto[];
}): VenueCalendarData {
  const eventsByDate = new Map<string, CalendarEvent[]>();
  const slotsByDate = new Map<string, VenueSlotDto[]>();

  for (const event of events) {
    if (inactiveEventStatuses.has(event.status)) continue;
    const date = isoDatePart(event.startAt);
    if (!date) continue;
    const calendarEvent: CalendarEvent = {
      id: event.id,
      date,
      name: event.title,
      time: formatTimeRange(event.startAt, event.endAt),
      status: pendingEventStatuses.has(event.status) ? 'pending' : 'confirmed',
      venue: venue.name,
      href: `/partner/venue/events/${event.id}`,
    };
    eventsByDate.set(date, [...(eventsByDate.get(date) ?? []), calendarEvent]);
  }

  for (const slot of slots) {
    if (slot.status === 'cancelled') continue;
    const date = isoDatePart(slot.startTime);
    if (!date) continue;
    slotsByDate.set(date, [...(slotsByDate.get(date) ?? []), slot]);
  }

  const blocks: CalendarBlock[] = slots
    .filter((slot) => slot.status === 'blocked')
    .flatMap((slot) => {
      const date = isoDatePart(slot.startTime);
      return date
        ? [
            {
              id: slot.id,
              date,
              reason: slot.label,
              from: isoTimePart(slot.startTime),
              to: isoTimePart(slot.endTime),
            },
          ]
        : [];
    });

  const months = monthKeys.flatMap((key): CalendarMonth[] => {
    const parsed = parseMonthKey(key);
    if (!parsed) return [];
    const daysInMonth = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
    const firstDayOffset = new Date(Date.UTC(parsed.year, parsed.month - 1, 1)).getUTCDay();
    const days = Array.from({ length: daysInMonth }, (_, index): CalendarDay => {
      const day = index + 1;
      const date = `${key}-${String(day).padStart(2, '0')}`;
      const dayEvents = eventsByDate.get(date) ?? [];
      const daySlots = slotsByDate.get(date) ?? [];
      return {
        date,
        day,
        state: stateForDay(dayEvents, daySlots),
        events: dayEvents,
        slots: availabilityForSlots(daySlots),
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
        firstDayOffset,
        daysInMonth,
        days,
      },
    ];
  });

  return { dataStatus: 'live', accent: 'orange', months, blocks };
}

function stateForDay(
  events: readonly CalendarEvent[],
  slots: readonly VenueSlotDto[],
): CalendarDayState {
  if (events.some((event) => event.status === 'pending')) return 'pending';
  if (events.length > 0 || slots.some((slot) => slot.status === 'booked')) return 'confirmed';
  if (slots.some((slot) => slot.status === 'blocked')) return 'blocked';
  if (slots.some((slot) => slot.status === 'open')) return 'available';
  return 'unavailable';
}

function availabilityForSlots(slots: readonly VenueSlotDto[]): readonly AvailabilitySlot[] {
  return slots
    .filter((slot) => slot.status === 'open')
    .map((slot) => ({
      id: slot.id,
      label: `${slot.label} · ${formatTimeRange(slot.startTime, slot.endTime)}`,
      status: 'available',
    }));
}

export function rangeForMonthKeys(
  monthKeys: readonly string[],
): { readonly from: string; readonly to: string } | null {
  const first = parseMonthKey(monthKeys[0] ?? '');
  const last = parseMonthKey(monthKeys.at(-1) ?? '');
  if (!first || !last) return null;
  return {
    from: new Date(Date.UTC(first.year, first.month - 1, 1)).toISOString(),
    to: new Date(Date.UTC(last.year, last.month, 0, 23, 59, 59, 999)).toISOString(),
  };
}

export function parseMonthKey(
  value: string,
): { readonly year: number; readonly month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return Number.isInteger(year) && month >= 1 && month <= 12 ? { year, month } : null;
}

export function isoDatePart(value: string): string | null {
  const date = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
}

function isoTimePart(value: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1] ?? '00'}:${match[2] ?? '00'}` : '00:00';
}

export function formatTimeRange(start: string, end: string | null): string {
  const startLabel = formatClock(isoTimePart(start));
  return end ? `${startLabel} – ${formatClock(isoTimePart(end))}` : startLabel;
}

function formatClock(value: string): string {
  const [hours = 0, minutes = 0] = value.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${String(hours % 12 || 12)}:${String(minutes).padStart(2, '0')} ${period}`;
}
