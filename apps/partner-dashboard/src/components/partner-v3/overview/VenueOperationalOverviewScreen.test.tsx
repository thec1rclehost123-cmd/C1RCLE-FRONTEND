import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VenueOperationalOverviewScreen } from './VenueOperationalOverviewScreen';

import type { VenueOperationalOverviewDto } from '@c1rcle/contracts';

const data: VenueOperationalOverviewDto = {
  summary: {
    eventsTonight: 1,
    upcomingEvents: 2,
    ticketUnitsIssued: 40,
    rsvpUnitsIssued: 8,
    expectedGuests: 56,
    checkedInGuests: 12,
    physicalVenueCapacity: 300,
    expectedOccupancyPercent: 18.67,
    complete: true,
  },
  upcomingEvents: [
    {
      id: 'host-event-1',
      ownerType: 'host',
      title: 'Host event at the Venue',
      imageUrl: null,
      hostName: 'Test Host',
      venueId: 'venue-1',
      venueName: 'Test Venue',
      status: 'published',
      startAt: '2026-11-20T15:00:00.000Z',
      endAt: '2026-11-20T20:00:00.000Z',
      eventCapacity: 100,
      venueCapacity: 300,
      ticketUnitsIssued: 40,
      rsvpUnitsIssued: 8,
      expectedGuests: 56,
      checkedInGuests: 12,
      operationalCountsComplete: true,
      baseStartingPricePaise: 5_000,
      currentStartingPricePaise: 3_500,
      isFree: false,
    },
  ],
};

describe('VenueOperationalOverviewScreen', () => {
  it('shows the first Venue-hosted operation and physical occupancy without finance', () => {
    render(<VenueOperationalOverviewScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Host event at the Venue/ })).toHaveAttribute(
      'href',
      '/partner/venue/events/host-event-1',
    );
    expect(screen.getByText(/Hosted by Test Host/)).toBeInTheDocument();
    expect(screen.getByText('18.67%')).toBeInTheDocument();
    expect(screen.getByText('Physical Venue capacity')).toBeInTheDocument();
    expect(screen.queryByText(/₹|revenue|payable|commission|settlement/i)).not.toBeInTheDocument();
  });
});
