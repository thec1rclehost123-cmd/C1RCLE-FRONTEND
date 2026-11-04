import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConnectedEventTicketsScreen } from './ConnectedEventTicketsScreen';

import type { TicketTierDto } from '@c1rcle/contracts';

const tier: TicketTierDto = {
  id: 'tier-one',
  eventId: 'event-one',
  organizationId: 'host-one',
  name: 'General',
  description: '',
  entryType: 'general',
  currency: 'INR',
  priceInPaise: 50_000,
  quantity: 50,
  status: 'active',
  salesStartAt: null,
  salesEndAt: null,
  maxPerOrder: 10,
  version: 1,
  createdAt: '2026-11-04T00:00:00.000Z',
  updatedAt: '2026-11-04T00:00:00.000Z',
};
describe('authoritative ticket inventory', () => {
  it('shows sold, held and available quantities returned by the backend', () => {
    render(
      <ConnectedEventTicketsScreen
        tiers={[{ ...tier, soldQuantity: 20, heldQuantity: 4, availableQuantity: 26 }]}
      />,
    );
    const row = screen.getByRole('row', { name: /General active/ });
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['active', '₹500.00', '50', '20', '4', '26', '10']);
  });
  it('does not invent inventory breakdowns when the backend has not provided them', () => {
    render(<ConnectedEventTicketsScreen tiers={[tier]} />);
    expect(screen.getAllByText('Unavailable')).toHaveLength(3);
  });
});
