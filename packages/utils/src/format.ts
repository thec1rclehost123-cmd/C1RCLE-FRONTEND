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

/** Truncates on a word boundary, appending an ellipsis only when it cut. */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }

  const clipped = input.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');

  return `${lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped}…`;
}
