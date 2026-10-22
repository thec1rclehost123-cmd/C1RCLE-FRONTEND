import { describe, expect, it } from 'vitest';

import { PARTNER_SHELL_CONFIG } from './config';
import { isPartnerNavigationItemActive } from './partner-navigation';

import type { PartnerDashboardRole } from './types';

/** Mirror of the server's OWNER matrix (`partner-access.ts`, VENUE/HOST/PROMOTER
 * OWNER rows) — the "OWNER fixture" for the visibility gate below. */
const OWNER_PERMISSIONS: Record<PartnerDashboardRole, readonly string[]> = {
  venue: [
    'VIEW_FINANCIALS',
    'MANAGE_STAFF',
    'MANAGE_EVENTS',
    'EDIT_EVENT_RULES',
    'MANAGE_TABLES',
    'VIEW_GUESTLIST',
    'SCAN_ENTRY',
    'LOG_INCIDENTS',
    'VIEW_ANALYTICS',
    'MANAGE_SETTINGS',
    'MANAGE_PARTNERSHIPS',
    'MANAGE_PAGE_CONTENT',
    'MANAGE_PAYOUTS',
    'MANAGE_GUEST_OPS',
    'CHARGE_COVER_WALLETS',
    'EXPORT_GUESTS',
  ],
  host: [
    'VIEW_FINANCIALS',
    'MANAGE_STAFF',
    'MANAGE_EVENTS',
    'MANAGE_PROMOTERS',
    'MANAGE_PAGE_CONTENT',
    'VIEW_ANALYTICS',
    'MANAGE_PAYOUTS',
    'MANAGE_PARTNERSHIPS',
    'VIEW_REAL_TIME_SCANS',
  ],
  promoter: [
    'VIEW_ANALYTICS',
    'MANAGE_PAGE_CONTENT',
    'VIEW_GUESTLIST',
    'VIEW_FINANCIALS',
    'MANAGE_PAYOUTS',
  ],
};

const visibleLabels = (role: PartnerDashboardRole, granted: readonly string[]): string[] =>
  PARTNER_SHELL_CONFIG[role].navigation
    .filter((item) => item.permission === undefined || granted.includes(item.permission))
    .map((item) => item.label);

describe('partner navigation permission gating', () => {
  it.each([
    ['venue', 'Events'],
    ['venue', 'Partners'],
    ['venue', 'Marketing'],
    ['venue', 'Finance'],
    ['host', 'Events'],
    ['host', 'Partners'],
    ['host', 'Marketing'],
    ['host', 'Finance'],
    ['promoter', 'Events'],
    ['promoter', 'Partners'],
    ['promoter', 'Finance'],
    ['promoter', 'Links'],
  ] as const)('%s OWNER sees the %s tab', (role, label) => {
    expect(visibleLabels(role, OWNER_PERMISSIONS[role])).toContain(label);
  });

  it('every declared nav permission is a real key its OWNER holds', () => {
    for (const role of Object.keys(PARTNER_SHELL_CONFIG) as PartnerDashboardRole[]) {
      for (const item of PARTNER_SHELL_CONFIG[role].navigation) {
        if (item.permission === undefined) continue;
        expect(OWNER_PERMISSIONS[role], `${role} ${item.label} → ${item.permission}`).toContain(
          item.permission,
        );
      }
    }
  });
});

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
    ['venue', '/venue/support', 'Support'],
    ['host', '/host/support', 'Support'],
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
