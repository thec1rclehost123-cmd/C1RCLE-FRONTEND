/*
 * Pure draft→ISO helpers shared by the host submit flow (BFF gateway, server
 * side) and the venue publish flow (client side). Event-editor values are venue
 * wall-clock values in India, so persist the corresponding UTC instant rather
 * than treating a local clock time as UTC.
 */

const INDIA_OFFSET_MS = 5.5 * 60 * 60 * 1000;

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
  return dateMidnight + clock.hours * 60 * 60 * 1000 + clock.minutes * 60 * 1000 - INDIA_OFFSET_MS;
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

  return new Date(endLocal - INDIA_OFFSET_MS).toISOString();
}

/** Format a date-only value in its event timezone without inheriting the host OS timezone. */
export function formatEventDateLabel(date: string, timezone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  const stableMiddayUtc = new Date(`${date}T12:00:00.000Z`);
  if (
    Number.isNaN(stableMiddayUtc.getTime()) ||
    stableMiddayUtc.toISOString().slice(0, 10) !== date
  ) {
    return '';
  }
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: timezone }).format(
    stableMiddayUtc,
  );
}
