import { describe, expect, it } from 'vitest';

import { normalizePartnerRole, resolvePartnerDashboardPath } from './partner-role-routing';

describe('partner role routing', () => {
  it.each([
    ['venue', 'venue'],
    ['club', 'venue'],
    ['host', 'host'],
    ['promoter', 'promoter'],
  ])('normalizes %s to %s', (value, expected) => {
    expect(normalizePartnerRole(value)).toBe(expected);
  });

  it('does not silently map unsupported membership types', () => {
    expect(normalizePartnerRole('admin')).toBeNull();
    expect(normalizePartnerRole(undefined)).toBeNull();
    expect(normalizePartnerRole('')).toBeNull();
    expect(normalizePartnerRole('  unknown  ')).toBeNull();
    expect(normalizePartnerRole({ partnerType: 'host' })).toBeNull();
    expect(resolvePartnerDashboardPath('admin', 'overview')).toBeNull();
  });

  it('resolves normalized roles to their Studio routes', () => {
    expect(resolvePartnerDashboardPath('club', 'overview')).toBe('/venue/overview');
    expect(resolvePartnerDashboardPath('host')).toBe('/host');
    expect(resolvePartnerDashboardPath('promoter', 'overview')).toBe('/promoter/overview');
    expect(resolvePartnerDashboardPath('  PROMOTER  ', '/finance/orders/')).toBe(
      '/promoter/finance/orders',
    );
  });
});
