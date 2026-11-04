import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventTicketSelectorClient } from './EventTicketSelectorClient';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@/lib/bff/bff-client', () => ({ bffClient: { post } }));
vi.mock('@/lib/bff/csrf', () => ({ csrfHeaders: () => ({ 'x-csrf-token': 'csrf' }) }));
vi.mock('@/lib/access/use-ticket-access-grant-id', () => ({
  useTicketAccessGrantId: () => undefined,
}));

const tiers = [
  {
    id: 'tier_sold_out',
    name: 'Balcony',
    description: 'General admission',
    price: { amountPaise: 150_000, currency: 'INR' as const },
    availabilityLabel: 'Sold out',
    availableQuantity: 0,
  },
];

beforeEach(() => post.mockReset().mockResolvedValue({ id: 'wait_1', status: 'waiting' }));

describe('EventTicketSelectorClient waitlist', () => {
  it('submits a user eligibility attestation for the sold-out tier', async () => {
    render(<EventTicketSelectorClient accentTone="orange" eventId="evt_1" tiers={tiers} />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/waitlist',
          body: { eventId: 'evt_1', tierId: 'tier_sold_out', eligibilityAttested: true },
        }),
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/you are on the waitlist/i);
  });

  it('surfaces the service response when joining fails', async () => {
    post.mockRejectedValueOnce(new Error('unauthorized'));
    render(<EventTicketSelectorClient accentTone="orange" eventId="evt_1" tiers={tiers} />);
    fireEvent.click(screen.getByRole('button', { name: 'Join waitlist' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/verified account/i);
  });
});
