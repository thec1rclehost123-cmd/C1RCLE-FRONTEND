import { describe, expect, it, vi } from 'vitest';

import { loadPromoterCampaignSummary } from './load-promoter-campaign-summary';

import type { ServerApiClient } from '@/lib/api/server-client';

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: () => ({ toString: () => '' }) }));

describe('loadPromoterCampaignSummary', () => {
  it('loads bounded campaign totals from the active Promoter organization', async () => {
    const apiCalls: { path: string; headers?: Readonly<Record<string, string>> }[] = [];
    const summary = {
      linkCount: 4,
      clicks: 17,
      conversions: 3,
      grossAttributedTicketRevenuePaise: 86_000,
      hasMoreLinks: false,
    };
    const client = {
      get: (options: { path: string; headers?: Readonly<Record<string, string>> }) => {
        apiCalls.push(options);
        return Promise.resolve(summary);
      },
    } as unknown as ServerApiClient;

    await expect(
      loadPromoterCampaignSummary({ client, organizationId: 'promoter_org_1' }),
    ).resolves.toEqual(summary);
    expect(apiCalls.map(({ path, headers }) => ({ path, headers }))).toEqual([
      {
        path: '/api/v2/promoters/promoter_org_1/campaign-summary',
        headers: { 'x-organization-id': 'promoter_org_1' },
      },
    ]);
  });

  it('requires a selected Promoter organization', async () => {
    const client = { get: vi.fn() } as unknown as ServerApiClient;
    await expect(loadPromoterCampaignSummary({ client })).rejects.toThrow(
      'Select a Promoter organization before viewing analytics.',
    );
    expect(client.get).not.toHaveBeenCalled();
  });
});
