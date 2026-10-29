import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadPromoterLinks } from './load-promoter-links';

const mocks = vi.hoisted(() => ({
  cookieHeader: 'c1rcle.active-org=promoter_org_1; session=session-value',
  get: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: () => ({ toString: () => mocks.cookieHeader }),
}));
vi.mock('@/lib/api/server-client', () => ({
  createServerApiClient: () => ({ get: mocks.get }),
}));

describe('loadPromoterLinks', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.cookieHeader = 'c1rcle.active-org=promoter_org_1; session=session-value';
  });

  it('requests the first bounded page from the active Promoter organization', async () => {
    mocks.get.mockResolvedValue({ items: [], pageInfo: {} });

    await loadPromoterLinks();

    expect(mocks.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/promoters/promoter_org_1/referral-links?limit=100',
        headers: { 'x-organization-id': 'promoter_org_1' },
      }),
    );
  });

  it('forwards a validated next-page cursor', async () => {
    mocks.get.mockResolvedValue({ items: [], pageInfo: {} });

    await loadPromoterLinks('100');

    expect(mocks.get).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v2/promoters/promoter_org_1/referral-links?limit=100&cursor=100',
      }),
    );
  });

  it('does not call the API for malformed or unsafe cursors', async () => {
    await expect(loadPromoterLinks('one')).rejects.toThrow('Invalid referral-link page cursor');
    await expect(loadPromoterLinks('9'.repeat(400))).rejects.toThrow(
      'Invalid referral-link page cursor',
    );
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('requires an active organization', async () => {
    mocks.cookieHeader = 'session=session-value';

    await expect(loadPromoterLinks()).rejects.toThrow(
      'Select a Promoter organization before viewing links.',
    );
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
