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

describe('partner event read routes without an active organization', () => {
  beforeEach(() => {
    mocks.cookieHeader.mockReset();
    mocks.cookieHeader.mockReturnValue('session=local-test');
    mocks.get.mockReset();
    mocks.redirect.mockClear();
  });

  it.each([
    ['analytics', () => import('./load-partner-event-analytics'), 'loadPartnerEventAnalytics'],
    ['sales', () => import('./load-partner-event-sales'), 'loadPartnerEventSales'],
  ])('routes %s requests to organization selection', async (_label, loadModule, exportName) => {
    const loaded = await loadModule();
    const loader = loaded[exportName as keyof typeof loaded] as (
      eventId: string,
    ) => Promise<unknown>;

    await expect(loader('event-1')).rejects.toThrow('redirect:/partner/select-organization');
    expect(mocks.redirect).toHaveBeenCalledWith('/partner/select-organization');
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
