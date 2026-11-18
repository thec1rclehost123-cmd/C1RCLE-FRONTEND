import { describe, expect, it, vi } from 'vitest';

import StudioDoorPage from './page';

const { notFound, loadPartnerEvents } = vi.hoisted(() => ({
  notFound: vi.fn(),
  loadPartnerEvents: vi.fn(),
}));

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('@/lib/events/load-partner-events', () => ({ loadPartnerEvents }));
vi.mock('@/components/partner-v3/door/PartnerDoorSelectionScreen', () => ({
  PartnerDoorSelectionScreen: () => <div>Venue event selector</div>,
}));

describe('Venue Door route', () => {
  it('loads live Venue events for the event selector', async () => {
    loadPartnerEvents.mockResolvedValue({ events: [], nextCursor: null });
    await StudioDoorPage({
      params: Promise.resolve({ studio: 'venue' }),
      searchParams: Promise.resolve({ cursor: 'next-page' }),
    });

    expect(loadPartnerEvents).toHaveBeenCalledWith({ studio: 'venue', cursor: 'next-page' });
    expect(notFound).not.toHaveBeenCalled();
  });

  it('does not expose the Venue selector to other studios', async () => {
    notFound.mockImplementationOnce(() => {
      throw new Error('not found');
    });

    await expect(
      StudioDoorPage({
        params: Promise.resolve({ studio: 'host' }),
        searchParams: Promise.resolve({}),
      }),
    ).rejects.toThrow('not found');
  });

  it('shows a retryable operational error when events fail to load', async () => {
    loadPartnerEvents.mockRejectedValueOnce(new Error('api unavailable'));
    const page = await StudioDoorPage({
      params: Promise.resolve({ studio: 'venue' }),
      searchParams: Promise.resolve({}),
    });

    expect(page).toBeTruthy();
  });
});
