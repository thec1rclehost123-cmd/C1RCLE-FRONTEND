import { describe, expect, it, vi } from 'vitest';

import StudioOverviewPage from './page';

const mocks = vi.hoisted(() => ({
  loadVenueOperationalOverview: vi.fn(),
  loadVenueOverviewAnalytics: vi.fn(),
  loadOverviewData: vi.fn(),
  loadOverviewNetwork: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({ toString: () => 'c1rcle.active-org=venue-org' }),
}));
vi.mock('@/lib/overview/load-venue-operational-overview', () => ({
  loadVenueOperationalOverview: mocks.loadVenueOperationalOverview,
}));
vi.mock('@/lib/events/load-venue-operational-analytics', () => ({
  loadVenueOverviewAnalytics: mocks.loadVenueOverviewAnalytics,
}));
vi.mock('@/lib/overview/load-overview-data', () => ({
  classifyOverviewFailure: vi.fn(),
  loadOverviewData: mocks.loadOverviewData,
  loadOverviewNetwork: mocks.loadOverviewNetwork,
  OverviewLoadError: class OverviewLoadError extends Error {},
}));
vi.mock('@/lib/events/load-promoter-overview', () => ({ loadPromoterOverview: vi.fn() }));
vi.mock('@/components/partner-v3/overview/OverviewLoadFailureState', () => ({
  OverviewLoadFailureState: () => <div>Overview unavailable</div>,
}));
vi.mock('@/components/partner-v3/overview/OverviewScreen', () => ({
  OverviewScreen: () => <div>Financial overview</div>,
}));
vi.mock('@/components/partner-v3/overview/VenueOperationalOverviewScreen', () => ({
  VenueOperationalOverviewScreen: () => <div>Venue operational overview</div>,
}));
vi.mock('@/components/partner-v3/promoter/PromoterOverviewConnected', () => ({
  PromoterOverviewConnected: () => <div>Promoter overview</div>,
}));

describe('Venue overview route', () => {
  it('uses Venue operational reads and the existing network loader', async () => {
    mocks.loadVenueOperationalOverview.mockResolvedValue({ summary: {}, upcomingEvents: [] });

    const page = await StudioOverviewPage({
      params: Promise.resolve({ studio: 'venue' }),
    });

    expect(page).toBeTruthy();
    expect(mocks.loadVenueOperationalOverview).toHaveBeenCalledWith('venue-org');
    expect(mocks.loadVenueOverviewAnalytics).toHaveBeenCalledWith('venue-org', expect.any(Date));
    expect(mocks.loadOverviewNetwork).toHaveBeenCalledWith('venue-org');
    expect(mocks.loadOverviewData).not.toHaveBeenCalled();
  });
});
