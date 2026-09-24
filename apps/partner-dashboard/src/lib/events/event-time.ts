/*
 * Pure draft→ISO helpers shared by the host submit flow (BFF gateway, server
 * side) and the venue publish flow (client side). Deterministic and timezone
 * free: everything is interpreted in UTC from locally formatted parts.
 */

export function eventStartAtFromDraft(
  draft: { readonly date: string; readonly time: string },
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) return null;
  const date = new Date(`${draft.date}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== draft.date) return null;

  const twelveHour = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\b/i.exec(draft.time);
  const twentyFourHour = /^\s*(\d{1,2}):(\d{2})\b/.exec(draft.time);
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

  return `${draft.date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000Z`;
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

  const twelveHour = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\b/i.exec(endTimeStr);
  const twentyFourHour = /^\s*(\d{1,2}):(\d{2})\b/.exec(endTimeStr);
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

  const startDate = new Date(startAt);
  const endDate = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
      hours,
      minutes,
    ),
  );

  if (endDate <= startDate) {
    endDate.setUTCDate(endDate.getUTCDate() + 1);
  }

  return endDate.toISOString();
}