import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

const mocks = vi.hoisted(() => ({
  cookieHeader: vi.fn(() => 'session=local-test'),
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

describe('loadPartnerEvent', () => {
  beforeEach(() => {
    mocks.cookieHeader.mockReset();
    mocks.cookieHeader.mockReturnValue('session=local-test');
    mocks.get.mockReset();
    mocks.redirect.mockClear();
  });

  it('sends users without an active organization to the organization selector', async () => {
    const { loadPartnerEvent } = await import('./load-partner-event');

    await expect(loadPartnerEvent('event-1')).rejects.toThrow(
      'redirect:/partner/select-organization',
    );

    expect(mocks.redirect).toHaveBeenCalledWith('/partner/select-organization');
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it('renders inaccessible cross-organization events as not found', async () => {
    mocks.cookieHeader.mockReturnValue('session=local-test; c1rcle.active-org=host-org');
    mocks.get.mockRejectedValueOnce(
      new ApiClientError({
        code: 'not_found',
        status: 404,
        message: 'Event not found',
        requestId: undefined,
        fieldErrors: undefined,
      }),
    );
    const { loadPartnerEvent } = await import('./load-partner-event');

    await expect(loadPartnerEvent('venue-owned-event')).rejects.toThrow('not-found');
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
