import { describe, expect, it, vi } from 'vitest';

import StudioAnalyticsPage from './page';

const mocks = vi.hoisted(() => ({
  loadVenueOperationalAnalytics: vi.fn(),
  loadPartnerOrganizationAnalytics: vi.fn(),
  loadPromoterCampaignSummary: vi.fn(),
}));

vi.mock('@/lib/events/load-venue-operational-analytics', () => ({
  loadVenueOperationalAnalytics: mocks.loadVenueOperationalAnalytics,
}));
vi.mock('@/lib/events/load-partner-organization-analytics', () => ({
  loadPartnerOrganizationAnalytics: mocks.loadPartnerOrganizationAnalytics,
}));
vi.mock('@/lib/events/load-promoter-campaign-summary', () => ({
  loadPromoterCampaignSummary: mocks.loadPromoterCampaignSummary,
}));
vi.mock('@/components/partner-v3/event-detail/VenueOperationalAnalyticsScreen', () => ({
  VenueOperationalAnalyticsScreen: () => <div>Venue operational analytics</div>,
}));
vi.mock('@/components/partner-v3/event-detail/ConnectedPartnerAnalyticsScreen', () => ({
  ConnectedPartnerAnalyticsScreen: () => <div>Financial analytics</div>,
}));
vi.mock('@/components/partner-v3/promoter/PromoterAnalyticsConnected', () => ({
  PromoterAnalyticsConnected: () => <div>Promoter analytics</div>,
}));

describe('Venue analytics route', () => {
  it('loads Venue operational analytics and skips Host financial analytics', async () => {
    mocks.loadVenueOperationalAnalytics.mockResolvedValue({ summary: {}, days: [], events: [] });

    const page = await StudioAnalyticsPage({
      params: Promise.resolve({ studio: 'venue' }),
      searchParams: Promise.resolve({ range: '30d' }),
    });

    expect(page).toBeTruthy();
    expect(mocks.loadVenueOperationalAnalytics).toHaveBeenCalledWith('30d');
    expect(mocks.loadPartnerOrganizationAnalytics).not.toHaveBeenCalled();
  });
});
