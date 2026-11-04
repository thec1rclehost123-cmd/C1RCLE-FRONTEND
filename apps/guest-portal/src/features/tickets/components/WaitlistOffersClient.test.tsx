import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WaitlistOffersClient } from './WaitlistOffersClient';

const { get, post, del, push } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
vi.mock('@/lib/bff/bff-client', () => ({ bffClient: { get, post, delete: del } }));
vi.mock('@/lib/bff/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'csrf' }) }));

const offer = {
  entry: {
    id: 'wait_1',
    eventId: 'evt_1',
    tierId: 'tier_1',
    sequence: 1,
    status: 'offered' as const,
    offerExpiresAt: '2099-10-28T15:00:00.000Z',
  },
  holdId: 'hold_1',
  expiresAt: '2099-10-28T15:00:00.000Z',
  pricing: {
    lines: [],
    subtotalPaise: 10000,
    discountPaise: 0,
    discountedSubtotalPaise: 10000,
    platformFeePaise: 0,
    paymentFeePaise: 0,
    gstPaise: 0,
    grandTotalPaise: 10000,
    appliedPromoCode: null,
    currency: 'INR' as const,
  },
};

beforeEach(() => {
  sessionStorage.clear();
  get.mockReset().mockResolvedValue({ items: [offer.entry] });
  post
    .mockReset()
    .mockResolvedValue({ entry: offer.entry, holdId: 'hold_1', expiresAt: offer.expiresAt });
  del.mockReset();
  push.mockReset();
});

describe('WaitlistOffersClient', () => {
  it('accepts the bounded offer and routes checkout to a server-authoritative offer lookup', async () => {
    render(<WaitlistOffersClient />);
    fireEvent.click(await screen.findByRole('button', { name: 'Accept & checkout' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/api/waitlist/wait_1/accept' }),
      );
      expect(push).toHaveBeenCalledWith('/checkout/evt_1?tier=tier_1&waitlist=1');
    });
    expect(sessionStorage.getItem('c1rcle.waitlist.accepted-entry-id')).toBe('wait_1');
    expect(sessionStorage.getItem('c1rcle.waitlist.accepted-offer')).toBeNull();
  });
});
