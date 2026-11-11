import { beforeEach, describe, expect, it, vi } from 'vitest';

import StudioPresencePage from './page';

const { notFound, redirect } = vi.hoisted(() => ({ notFound: vi.fn(), redirect: vi.fn() }));

vi.mock('next/navigation', () => ({ notFound, redirect }));

describe('Partner presence route', () => {
  beforeEach(() => {
    notFound.mockClear();
    redirect.mockClear();
  });

  it.each(['host', 'venue'])(
    'routes the %s Presence entry to public profile settings',
    async (studio) => {
      await StudioPresencePage({ params: Promise.resolve({ studio }) });

      expect(redirect).toHaveBeenCalledWith(`/partner/${studio}/settings`);
      expect(notFound).not.toHaveBeenCalled();
    },
  );

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
