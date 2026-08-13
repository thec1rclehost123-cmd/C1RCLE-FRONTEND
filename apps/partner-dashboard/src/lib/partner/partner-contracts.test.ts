import { describe, expect, it } from 'vitest';

import { PARTNER_SHELL_CONFIG } from '@/components/partner-shell/config';

import { fixtureHostRepository } from './fixture-host-repository';
import { fixturePromoterRepository } from './fixture-promoter-repository';

describe('partner role contracts', () => {
  it('keeps promoter navigation focused on links instead of event creation or marketing', () => {
    const config = PARTNER_SHELL_CONFIG.promoter;
    expect(config.primaryAction).toMatchObject({
      label: 'Create Link',
      href: '/promoter/links/create',
    });
    expect(config.navigation.map((item) => item.label)).not.toContain('Marketing');
    expect(config.navigation.map((item) => item.href)).not.toContain('/promoter/events/create');
  });

  it('sanitizes the Partner Network promoter profile before rendering it to venues and hosts', async () => {
    const profile = await fixturePromoterRepository.getNetworkProfile();
    const serialized = JSON.stringify(profile).toLowerCase();

    expect(profile.stats.ticketsMoved).toBeGreaterThan(0);
    expect(profile.stats.trackedConversion).toBeGreaterThan(0);
    expect(serialized).not.toContain('revenue');
    expect(serialized).not.toContain('earning');
    expect(serialized).not.toContain('commission');
    expect(serialized).not.toContain('payout');
    expect(serialized).not.toContain('paise');
  });

  it('keeps private finance data in the promoter workspace repository only', async () => {
    const [finance, network] = await Promise.all([
      fixturePromoterRepository.getFinance(),
      fixturePromoterRepository.getNetworkProfile(),
    ]);
    expect(finance.availablePaise).toBeGreaterThan(0);
    expect(network).not.toHaveProperty('finance');
  });

  it('keeps Host data behind its repository and returns bookmarkable event IDs', async () => {
    const [overview, events] = await Promise.all([
      fixtureHostRepository.getOverview(),
      fixtureHostRepository.getEvents(),
    ]);
    expect(overview.profile.name.length).toBeGreaterThan(0);
    expect(events.length).toBeGreaterThan(0);
    expect(events.every((event) => /^[a-z0-9-]+$/.test(event.id))).toBe(true);
    await expect(fixtureHostRepository.getEvent(events[0]?.id ?? '')).resolves.not.toBeNull();
  });
});
