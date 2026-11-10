import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseEventStatus } from '@/components/partner-v3/events/PartnerEventsScreen';

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

  it('keeps incomplete drafts distinct and completes published events at their effective end', async () => {
    const { mapStatus } = await import('./load-partner-events');
    const now = new Date('2026-11-09T12:00:00.000Z');
    expect(mapStatus('draft', new Date('2026-11-08T12:00:00Z'), null, now)).toBe('Draft');
    expect(
      mapStatus(
        'published',
        new Date('2026-11-09T11:00:00Z'),
        new Date('2026-11-10T12:00:00Z'),
        now,
      ),
    ).toBe('Live');
    expect(
      mapStatus(
        'published',
        new Date('2026-11-08T12:00:00Z'),
        new Date('2026-11-09T11:00:00Z'),
        now,
      ),
    ).toBe('Completed');
    expect(mapStatus('published', new Date('2026-11-09T11:00:00Z'), null, now)).toBe('Completed');
    expect(mapStatus('postponed', new Date('2026-11-08T12:00:00Z'), null, now)).toBe('Postponed');
    expect(mapStatus('cancelled', new Date('2026-11-08T12:00:00Z'), null, now)).toBe('Cancelled');
    expect(mapStatus('archived', new Date('2026-11-08T12:00:00Z'), null, now)).toBe('Archived');
  });

  it('parses the Completed status filter', () => {
    expect(parseEventStatus('completed')).toBe('Completed');
    expect(parseEventStatus('draft')).toBe('Draft');
  });
});
