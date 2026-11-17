import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VenueLiveEventSummaryScreen } from './VenueLiveEventSummaryScreen';

import type { VenueEventDetailResponse } from '@c1rcle/contracts';

const record: VenueEventDetailResponse = {
  event: {
    id: 'event-1',
    organizationId: 'host-org-1',
    venueId: 'venue-1',
    slug: 'acceptance-event',
    title: 'C1RCLE STAGING ACCEPTANCE 001',
    summary: 'Staging event summary',
    description: 'Staging event description',
    imageUrl: 'https://storage.googleapis.com/example/poster.jpg',
    startAt: '2026-11-29T12:30:00.000Z',
    endAt: '2026-11-29T16:30:00.000Z',
    status: 'published',
    visibilityMode: 'public',
    addressDisclosure: 'public',
    isPublic: true,
    tags: [],
    startingPricePaise: 80000,
    isFree: false,
    cancellationReason: null,
    version: 1,
    createdAt: '2026-11-10T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
  },
  tiers: [
    {
      id: 'tier-general',
      eventId: 'event-1',
      organizationId: 'host-org-1',
      name: 'General Entry',
      description: '',
      entryType: 'standard',
      currency: 'INR',
      priceInPaise: 80000,
      quantity: 80,
      status: 'active',
      salesStartAt: null,
      salesEndAt: null,
      maxPerOrder: 4,
      version: 1,
      createdAt: '2026-11-10T00:00:00.000Z',
      updatedAt: '2026-11-10T00:00:00.000Z',
      pricingPhases: [
        {
          id: 'early-bird',
          name: 'Early Bird',
          priceInPaise: 65000,
          quantity: null,
          startsAt: '2026-11-16T00:00:00.000Z',
          endsAt: '2026-11-22T00:00:00.000Z',
        },
      ],
    },
  ],
};

describe('VenueLiveEventSummaryScreen', () => {
  it('presents the Venue-authorized event data in overview and ticket-tier cards', () => {
    render(<VenueLiveEventSummaryScreen record={record} />);

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('Host organization · host-org-1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'General Entry' })).toBeInTheDocument();
    expect(screen.getByText('₹800.00')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('4 per order')).toBeInTheDocument();
    expect(screen.getByText('Early Bird')).toBeInTheDocument();
    expect(screen.getByText('₹650.00')).toBeInTheDocument();
  });
});
