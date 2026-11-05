import { describe, expect, it } from 'vitest';

import { formatPaise } from './format';

describe('Admin authoritative paise display', () => {
  it.each([
    [108743, '₹1,087.43'],
    [108750, '₹1,087.5'],
    [1, '₹0.01'],
    [-43, '-₹0.43'],
  ])('preserves the paise in %i', (amount, expected) => {
    expect(formatPaise(amount)).toBe(expected);
  });
  it.each([
    [108700, '₹1,087'],
    [0, '₹0'],
  ])('keeps whole-rupee %i concise', (amount, expected) => {
    expect(formatPaise(amount)).toBe(expected);
  });
});
