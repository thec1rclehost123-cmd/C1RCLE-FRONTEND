import { describe, expect, it } from 'vitest';

import { PARTNER_SHELL_CONFIG } from './config';
import { isPartnerNavigationItemActive } from './partner-navigation';

describe('partner navigation matching', () => {
  it.each([
    ['venue', '/venue/finance/orders'],
    ['host', '/host/finance/orders'],
    ['promoter', '/promoter/finance/orders'],
  ] as const)('keeps nested %s Finance routes active', (role, pathname) => {
    const finance = PARTNER_SHELL_CONFIG[role].navigation.find((item) => item.label === 'Finance');
    expect(finance).toBeDefined();
    expect(isPartnerNavigationItemActive(pathname, finance!)).toBe(true);
  });

  it('does not treat a similarly named route as a Finance child', () => {
    const finance = PARTNER_SHELL_CONFIG.host.navigation.find((item) => item.label === 'Finance');
    expect(finance).toBeDefined();
    expect(isPartnerNavigationItemActive('/host/finance-old', finance!)).toBe(false);
  });

  it.each([
    ['venue', '/venue/events/neon-nights-afrobeats', 'Events'],
    ['venue', '/venue/partners', 'Partners'],
    ['host', '/host/events/neon-nights/guests', 'Events'],
    ['host', '/host/partners', 'Partners'],
    ['promoter', '/promoter/events/neon-nights?tab=orders', 'Events'],
    ['promoter', '/promoter/links', 'Links'],
    ['promoter', '/promoter/settings', 'Settings'],
  ] as const)(
    'activates only the expected %s navigation domain for %s',
    (role, pathname, label) => {
      const activeLabels = PARTNER_SHELL_CONFIG[role].navigation
        .filter((item) => isPartnerNavigationItemActive(pathname, item))
        .map((item) => item.label);

      expect(activeLabels).toEqual([label]);
    },
  );

  it('does not activate a different role shell for nested paths', () => {
    for (const [role, pathname] of [
      ['venue', '/host/finance/orders'],
      ['host', '/promoter/events/neon-nights'],
      ['promoter', '/venue/partners'],
    ] as const) {
      const activeLabels = PARTNER_SHELL_CONFIG[role].navigation.filter((item) =>
        isPartnerNavigationItemActive(pathname, item),
      );
      expect(activeLabels).toEqual([]);
    }
  });
});
