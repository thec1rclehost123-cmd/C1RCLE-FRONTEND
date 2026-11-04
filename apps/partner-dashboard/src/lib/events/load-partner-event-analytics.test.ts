import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

const mocks = vi.hoisted(() => ({
  cookieHeader: vi.fn(() => 'session=local-test; c1rcle.active-org=host-org'),
  get: vi.fn(),
  notFound: vi.fn((): never => {
    throw new Error('not-found');
  }),
  redirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: () => ({ toString: mocks.cookieHeader }),
}));

vi.mock('next/navigation', () => ({ notFound: mocks.notFound, redirect: mocks.redirect }));

vi.mock('@/lib/api/server-client', () => ({
  createServerApiClient: () => ({ get: mocks.get }),
}));

describe('loadPartnerEventAnalytics', () => {
  beforeEach(() => {
    mocks.cookieHeader.mockReset();
    mocks.cookieHeader.mockReturnValue('session=local-test; c1rcle.active-org=host-org');
    mocks.get.mockReset();
    mocks.notFound.mockClear();
    mocks.redirect.mockClear();
  });

  it('renders inaccessible cross-organization event analytics as not found', async () => {
    mocks.get.mockRejectedValueOnce(
      new ApiClientError({
        code: 'not_found',
        status: 404,
        message: 'Event not found',
        requestId: undefined,
        fieldErrors: undefined,
      }),
    );
    const { loadPartnerEventAnalytics } = await import('./load-partner-event-analytics');

    await expect(loadPartnerEventAnalytics('venue-owned-event')).rejects.toThrow('not-found');
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
