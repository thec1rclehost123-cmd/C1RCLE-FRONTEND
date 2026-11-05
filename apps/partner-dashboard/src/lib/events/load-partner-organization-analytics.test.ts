import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadPartnerOrganizationAnalytics } from './load-partner-organization-analytics';

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  createServerApiClient: vi.fn(),
  getOrganizationOverview: vi.fn(),
  getOrganizationSalesBreakdown: vi.fn(),
  getOrganizationTrends: vi.fn(),
  getFinanceBalance: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/api/server-client', () => ({ createServerApiClient: mocks.createServerApiClient }));
vi.mock('@/lib/overview/api-overview-repository', () => ({
  getOrganizationOverview: mocks.getOrganizationOverview,
  getOrganizationSalesBreakdown: mocks.getOrganizationSalesBreakdown,
  getOrganizationTrends: mocks.getOrganizationTrends,
}));
vi.mock('@/lib/finance/api-finance-repository', () => ({
  getFinanceBalance: mocks.getFinanceBalance,
}));

describe('loadPartnerOrganizationAnalytics', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('requests the trailing inclusive 30-day range, ending today', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T12:00:00.000Z'));
    const client = {
      get: vi.fn().mockResolvedValue({
        rows: [],
        channels: { promoter: 0, unattributed: 0 },
        purchaseDays: [0, 0, 0, 0, 0, 0, 0],
      }),
    };
    mocks.cookies.mockResolvedValue({ toString: () => 'c1rcle.active-org=org_m3' });
    mocks.createServerApiClient.mockReturnValue(client);
    mocks.getOrganizationOverview.mockResolvedValue({});
    mocks.getOrganizationSalesBreakdown.mockResolvedValue({});
    mocks.getFinanceBalance.mockResolvedValue({});
    mocks.getOrganizationTrends.mockResolvedValue({});

    await loadPartnerOrganizationAnalytics({ range: '30d', breakdown: 'day' });

    expect(mocks.getOrganizationTrends).toHaveBeenCalledWith(client, 'org_m3', {
      from: '2026-09-24',
      to: '2026-10-23',
      granularity: 'day',
    });
    expect(mocks.getOrganizationSalesBreakdown).toHaveBeenCalledWith(client, 'org_m3');
    expect(mocks.getFinanceBalance).not.toHaveBeenCalled();
    expect(client.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/organizations/org_m3/analytics/ticket-tiers?from=2026-09-24&to=2026-10-23',
        headers: { 'x-organization-id': 'org_m3' },
      }),
    );
  });
  it('requests daily source bounds even for a monthly chart', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T12:00:00Z'));
    const client = {
      get: vi.fn().mockResolvedValue({
        rows: [],
        channels: { promoter: 0, unattributed: 0 },
        purchaseDays: [0, 0, 0, 0, 0, 0, 0],
      }),
    };
    mocks.cookies.mockResolvedValue({ toString: () => 'c1rcle.active-org=org_m3' });
    mocks.createServerApiClient.mockReturnValue(client);
    mocks.getOrganizationOverview.mockResolvedValue({});
    mocks.getOrganizationSalesBreakdown.mockResolvedValue({});
    mocks.getOrganizationTrends.mockResolvedValue({
      organizationId: 'org_m3',
      from: '2026-09-24',
      to: '2026-10-23',
      granularity: 'day',
      buckets: [],
      totals: {},
    });
    const result = await loadPartnerOrganizationAnalytics({ range: '30d', breakdown: 'month' });
    expect(mocks.getOrganizationTrends).toHaveBeenCalledWith(client, 'org_m3', {
      from: '2026-09-24',
      to: '2026-10-23',
      granularity: 'day',
    });
    expect(result.lastThirtyDays.granularity).toBe('month');
    expect(result.lastThirtyDays.from).toBe('2026-09-24');
  });
});
