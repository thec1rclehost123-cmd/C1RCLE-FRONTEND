import { describe, expect, it } from 'vitest';

import { cn } from './cn.js';
import {
  formatBookingReference,
  formatCurrency,
  formatDate,
  formatFreshness,
  truncate,
} from './format.js';
import { err, isErr, isOk, ok, unwrapOr } from './result.js';

describe('cn', () => {
  it('lets the caller override a conflicting Tailwind utility', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('formatCurrency', () => {
  it('renders minor units as a major-unit amount', () => {
    expect(formatCurrency(123456, 'USD', 'en-US')).toBe('$1,234.56');
  });
});

describe('formatDate', () => {
  it('is deterministic for a fixed locale', () => {
    expect(formatDate(Date.UTC(2026, 7, 6), 'en-GB', { dateStyle: 'short', timeZone: 'UTC' })).toBe(
      '06/08/2026',
    );
  });
});

describe('truncate', () => {
  it('leaves short input untouched', () => {
    expect(truncate('short', 20)).toBe('short');
  });

  it('cuts on a word boundary', () => {
    expect(truncate('the quick brown fox', 12)).toBe('the quick…');
  });
});

describe('guest-safe references', () => {
  it('formats only the public booking-reference shape', () => {
    expect(formatBookingReference('c1-abcde-12345-fffff-00000')).toBe('C1-ABCDE-12345-FFFFF-00000');
    expect(formatBookingReference('order_internal_123')).toBe('Reference unavailable');
  });
});

describe('freshness labels', () => {
  it('uses an explicit locale and timezone', () => {
    expect(formatFreshness('2026-10-16T12:00:00.000Z', 'en-IN', 'UTC')).toMatch(
      /^Updated 16 Oct 2026, 12:00 pm$/,
    );
    expect(formatFreshness('invalid', 'en-IN')).toBe('Freshness unavailable');
  });
});

describe('Result', () => {
  it('narrows on ok', () => {
    const result = ok(42);
    expect(isOk(result)).toBe(true);
    expect(unwrapOr(result, 0)).toBe(42);
  });

  it('narrows on err and falls back', () => {
    const result = err('boom');
    expect(isErr(result)).toBe(true);
    expect(unwrapOr(result, 7)).toBe(7);
  });
});
