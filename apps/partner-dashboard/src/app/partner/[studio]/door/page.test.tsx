import { describe, expect, it, vi } from 'vitest';

import StudioDoorPage from './page';

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(),
}));

vi.mock('next/navigation', () => ({ notFound }));
vi.mock('@/components/partner-v3/door/PartnerDoorSelectionScreen', () => ({
  PartnerDoorSelectionScreen: () => <div>Venue scanner unavailable</div>,
}));

describe('Venue Door route', () => {
  it('shows the truthful unavailable state without linking to an unauthorized scanner', async () => {
    const page = await StudioDoorPage({ params: Promise.resolve({ studio: 'venue' }) });

    expect(page).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it('does not expose the Venue selector to other studios', async () => {
    notFound.mockImplementationOnce(() => {
      throw new Error('not found');
    });

    await expect(
      StudioDoorPage({
        params: Promise.resolve({ studio: 'host' }),
      }),
    ).rejects.toThrow('not found');
  });
});
