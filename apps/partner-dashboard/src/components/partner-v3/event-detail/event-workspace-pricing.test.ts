import { describe, expect, it } from 'vitest';

import { formatEventStartingPrice } from './event-workspace-pricing';

import type { TicketTierDto } from '@c1rcle/contracts';

const event = { isFree: true, startingPricePaise: 0 };

function ticketTier(accessType: 'ENTRY' | 'RSVP' | 'VIP', priceInPaise: number): TicketTierDto {
  return {
    id: `${accessType.toLowerCase()}-tier`,
    eventId: 'event-a',
    organizationId: 'org-a',
    name: accessType,
    description: '',
    entryType: accessType,
    currency: 'INR',
    priceInPaise,
    quantity: 20,
    status: 'active',
    salesStartAt: null,
    salesEndAt: null,
    maxPerOrder: 4,
    accessType,
    version: 1,
    createdAt: '2026-11-11T00:00:00.000Z',
    updatedAt: '2026-11-11T00:00:00.000Z',
  };
}

describe('formatEventStartingPrice', () => {
  it('uses paid ticket tiers for a draft whose event summary still has the free default', () => {
    expect(
      formatEventStartingPrice(event, [
        ticketTier('VIP', 100_000),
        ticketTier('ENTRY', 50_000),
      ]),
    ).toBe('₹500.00');
  });

  it('does not treat a free RSVP tier as the starting price of paid entry', () => {
    expect(
      formatEventStartingPrice(event, [
        ticketTier('RSVP', 0),
        ticketTier('ENTRY', 50_000),
      ]),
    ).toBe('₹500.00');
  });

  it('keeps free-only and unavailable legacy summaries readable', () => {
    expect(formatEventStartingPrice(event, [ticketTier('RSVP', 0)])).toBe('Free');
    expect(formatEventStartingPrice({ isFree: false, startingPricePaise: null })).toBe(
      'Unavailable',
    );
  });
});
