import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventTicketSelectorClient } from './EventTicketSelectorClient';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('@/lib/bff/bff-client', () => ({ bffClient: { post } }));
vi.mock('@/lib/access/use-ticket-access-grant-id', () => ({
  useTicketAccessGrantId: () => undefined,
}));
const soldOutTier = {
  id: 'tier_sold_out',
  name: 'Balcony',
  description: 'General admission',
  price: { amountPaise: 150_000, currency: 'INR' as const },
  availabilityLabel: 'Sold out',
  availableQuantity: 0,
};
beforeEach(() => {
  post.mockReset();
});
describe('V1 sold-out ticket selection', () => {
  it('shows Sold Out without a waitlist action or eligibility intake', () => {
    render(<EventTicketSelectorClient accentTone="orange" eventId="evt_1" tiers={[soldOutTier]} />);
    expect(screen.getByText('Sold Out')).toBeVisible();
    expect(screen.getByRole('button', { name: /Balcony/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /join waitlist/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });
  it('keeps sold-out inventory non-selectable while ordinary tiers remain available', () => {
    render(
      <EventTicketSelectorClient
        accentTone="orange"
        eventId="evt_1"
        tiers={[
          soldOutTier,
          {
            ...soldOutTier,
            id: 'available',
            name: 'General',
            availableQuantity: 5,
            availabilityLabel: 'Available',
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Balcony/ }));
    expect(screen.getByRole('button', { name: /^General/ })).not.toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });
});
