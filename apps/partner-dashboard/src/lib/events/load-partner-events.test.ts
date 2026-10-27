import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cookieHeader: vi.fn(() => 'session=local-test'),
  get: vi.fn(),
  redirect: vi.fn((destination: string): never => {
    throw new Error(`redirect:${destination}`);
  }),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: () => ({ toString: mocks.cookieHeader }) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/api/server-client', () => ({
  createServerApiClient: () => ({ get: mocks.get }),
}));

describe('loadPartnerEvents', () => {
  beforeEach(() => {
    mocks.cookieHeader.mockReset();
    mocks.cookieHeader.mockReturnValue('session=local-test');
    mocks.get.mockReset();
    mocks.redirect.mockClear();
  });

  it('routes an authenticated user with no active organization through workspace selection', async () => {
    const { loadPartnerEvents } = await import('./load-partner-events');

    await expect(loadPartnerEvents({ studio: 'host' })).rejects.toThrow(
      'redirect:/partner/select-organization',
    );

    expect(mocks.redirect).toHaveBeenCalledWith('/partner/select-organization');
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
