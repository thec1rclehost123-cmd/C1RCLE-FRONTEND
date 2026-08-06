import { describe, expect, it } from 'vitest';

import { cn } from './cn.js';
import { formatCurrency, formatDate, truncate } from './format.js';
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
