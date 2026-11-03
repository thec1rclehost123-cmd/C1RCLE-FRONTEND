/*
 * Pure draft→ISO helpers shared by the host submit flow (BFF gateway, server
 * side) and the venue publish flow (client side). Event-editor values are venue
 * wall-clock values in India, so persist the corresponding UTC instant rather
 * than treating a local clock time as UTC.
 */
import { PRODUCT_TIME_ZONE, PRODUCT_TIME_ZONE_OFFSET_MINUTES } from '@c1rcle/contracts';

const PRODUCT_TIME_ZONE_OFFSET_MS = PRODUCT_TIME_ZONE_OFFSET_MINUTES * 60_000;

export function formatProductDateTime(
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return 'Time unavailable';
  const formatted = new Intl.DateTimeFormat('en-IN', {
    ...options,
    timeZone: PRODUCT_TIME_ZONE,
  }).format(instant);
  const includesTime =
    options.timeStyle !== undefined ||
    options.hour !== undefined ||
    options.minute !== undefined ||
    options.second !== undefined;
  return includesTime ? `${formatted} IST` : formatted;
}

export function isProductCalendarDay(value: string | undefined, now = new Date()): boolean {
  if (!value) return false;
  const eventDate = new Date(value);
  if (Number.isNaN(eventDate.getTime())) return false;

  const dateKey = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: PRODUCT_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);

  return dateKey(eventDate) === dateKey(now);
}

interface ClockTime {
  readonly hours: number;
  readonly minutes: number;
}

function parseDateMidnight(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return null;
  return parsed.getTime();
}

function parseClockTime(value: string): ClockTime | null {
  const twelveHour = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\b/i.exec(value);
  const twentyFourHour = /^\s*(\d{1,2}):(\d{2})\b/.exec(value);
  const match = twelveHour ?? twentyFourHour;
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (minutes < 0 || minutes > 59) return null;
  if (twelveHour) {
    if (hours < 1 || hours > 12) return null;
    hours %= 12;
    if (twelveHour[3]?.toUpperCase() === 'PM') hours += 12;
  } else if (hours < 0 || hours > 23) {
    return null;
  }
  return { hours, minutes };
}

function localIndiaInstant(dateMidnight: number, clock: ClockTime): number {
  return (
    dateMidnight +
    clock.hours * 60 * 60 * 1000 +
    clock.minutes * 60 * 1000 -
    PRODUCT_TIME_ZONE_OFFSET_MS
  );
}

export function isoInstantToProductLocalInput(value: string): string {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PRODUCT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function productLocalInputToIsoInstant(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    return null;
  }
  const localStamp = Date.UTC(year, month - 1, day, hour, minute);
  const normalized = new Date(localStamp);
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() + 1 !== month ||
    normalized.getUTCDate() !== day ||
    normalized.getUTCHours() !== hour ||
    normalized.getUTCMinutes() !== minute
  ) {
    return null;
  }
  return new Date(localStamp - PRODUCT_TIME_ZONE_OFFSET_MS).toISOString();
}

export function eventStartAtFromDraft(draft: {
  readonly date: string;
  readonly time: string;
}): string | null {
  const dateMidnight = parseDateMidnight(draft.date);
  const clock = parseClockTime(draft.time);
  if (dateMidnight === null || clock === null) return null;
  return new Date(localIndiaInstant(dateMidnight, clock)).toISOString();
}

export function eventEndAtFromDraft(
  draft: { readonly date: string; readonly time: string } & { readonly endTime?: string },
): string | null {
  const startAt = eventStartAtFromDraft(draft);
  if (!startAt) return null;

  let endTimeStr = draft.endTime?.trim();
  if (!endTimeStr && draft.time.includes('-')) {
    endTimeStr = draft.time.split('-')[1]?.trim();
  } else if (!endTimeStr && draft.time.includes('–')) {
    endTimeStr = draft.time.split('–')[1]?.trim();
  }

  if (!endTimeStr) return null;

  const dateMidnight = parseDateMidnight(draft.date);
  const startClock = parseClockTime(draft.time);
  const endClock = parseClockTime(endTimeStr);
  if (dateMidnight === null || startClock === null || endClock === null) return null;

  const startLocal =
    dateMidnight + startClock.hours * 60 * 60 * 1000 + startClock.minutes * 60 * 1000;
  let endLocal = dateMidnight + endClock.hours * 60 * 60 * 1000 + endClock.minutes * 60 * 1000;
  if (endLocal <= startLocal) endLocal += 24 * 60 * 60 * 1000;

  return new Date(endLocal - PRODUCT_TIME_ZONE_OFFSET_MS).toISOString();
}

/** Format a date-only value in the fixed product timezone. */
export function formatEventDateLabel(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const stableMiddayUtc = new Date(`${date}T12:00:00.000Z`);
  if (
    Number.isNaN(stableMiddayUtc.getTime()) ||
    stableMiddayUtc.toISOString().slice(0, 10) !== date
  ) {
    return '';
  }
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeZone: PRODUCT_TIME_ZONE,
  }).format(stableMiddayUtc);
}
