/**
 * Formatting helpers.
 *
 * Every one of these takes an explicit locale. Defaulting to the ambient
 * system locale produces output that differs between server render and client
 * render, which React reports as a hydration mismatch.
 */

export function formatCurrency(amountMinorUnits: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amountMinorUnits / 100);
}

export function formatDate(
  value: Date | number,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  return new Intl.DateTimeFormat(locale, options).format(value);
}

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

const BOOKING_REFERENCE = /^C1-[A-F0-9]{5}(?:-[A-F0-9]{5}){3}$/;

/** Never falls back to an internal order id on a guest-facing surface. */
export function formatBookingReference(value: string | null | undefined): string {
  const normalized = value?.trim().toUpperCase();
  return normalized && BOOKING_REFERENCE.test(normalized) ? normalized : 'Reference unavailable';
}

export function formatFreshness(
  generatedAt: string | Date,
  locale: string,
  timeZone = 'Asia/Kolkata',
): string {
  const date = typeof generatedAt === 'string' ? new Date(generatedAt) : generatedAt;
  if (Number.isNaN(date.getTime())) return 'Freshness unavailable';
  return `Updated ${new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(date)}`;
}

/** Truncates on a word boundary, appending an ellipsis only when it cut. */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }

  const clipped = input.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');

  return `${lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped}…`;
}
