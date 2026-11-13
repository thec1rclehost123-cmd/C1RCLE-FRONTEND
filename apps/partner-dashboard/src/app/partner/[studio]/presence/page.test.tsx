import { beforeEach, describe, expect, it, vi } from 'vitest';

import StudioPresencePage from './page';

const { notFound, redirect } = vi.hoisted(() => ({ notFound: vi.fn(), redirect: vi.fn() }));

vi.mock('next/navigation', () => ({ notFound, redirect }));

describe('Partner presence route', () => {
  beforeEach(() => {
    notFound.mockClear();
    redirect.mockClear();
  });

  it('routes Host Presence to the organization guest and attendee index', async () => {
    await StudioPresencePage({ params: Promise.resolve({ studio: 'host' }) });

    expect(redirect).toHaveBeenCalledWith('/partner/host/guests');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('keeps Venue Presence routed to public profile settings', async () => {
    await StudioPresencePage({ params: Promise.resolve({ studio: 'venue' }) });

    expect(redirect).toHaveBeenCalledWith('/partner/venue/settings');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('does not expose the route to unsupported workspaces', async () => {
    const notFoundError = new Error('not found');
    notFound.mockImplementationOnce(() => {
      throw notFoundError;
    });

    await expect(
      StudioPresencePage({ params: Promise.resolve({ studio: 'promoter' }) }),
    ).rejects.toBe(notFoundError);
    expect(notFound).toHaveBeenCalledOnce();
    expect(redirect).not.toHaveBeenCalled();
  });
});
