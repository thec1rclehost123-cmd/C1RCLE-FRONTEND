/**
 * Notification `link`s are backend data rendered as in-app navigation. Accept
 * only same-origin relative paths — `//host` and `/\host` are protocol-relative
 * in browsers and would turn a notification into an open redirect.
 */
export function safeNotificationHref(link: string | null): string | null {
  if (!link?.startsWith('/')) return null;
  if (link.startsWith('//') || link.startsWith('/\\')) return null;
  return link;
}

const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

/**
 * "3 hours ago" relative to an explicit `now`, so the label is computed once
 * on the server and never re-derived (and mismatched) during hydration.
 */
export function relativeTimeLabel(iso: string, now: Date, locale = 'en-IN'): string {
  const seconds = Math.round((Date.parse(iso) - now.getTime()) / 1000);
  if (!Number.isFinite(seconds)) return '';
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.trunc(seconds / size), unit);
  }
  return 'just now';
}
