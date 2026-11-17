import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VenueOperationalAnalyticsScreen } from './VenueOperationalAnalyticsScreen';

import type { VenueOperationalAnalyticsDto } from '@c1rcle/contracts';

const analytics: VenueOperationalAnalyticsDto = {
  from: '2026-11-01',
  to: '2026-11-30',
  timeZone: 'Asia/Kolkata',
  summary: {
    eventCount: 2,
    ticketUnitsIssued: 40,
    rsvpUnitsIssued: 8,
    expectedGuests: 56,
    checkedInGuests: 12,
    physicalVenueCapacity: 300,
    expectedOccupancyPercent: 18.67,
    complete: true,
  },
  days: [
    {
      date: '2026-11-20',
      eventCount: 1,
      ticketUnitsIssued: 40,
      rsvpUnitsIssued: 8,
      expectedGuests: 56,
      checkedInGuests: 12,
      physicalVenueCapacity: 300,
      expectedOccupancyPercent: 18.67,
    },
  ],
  events: [
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

describe('VenueOperationalAnalyticsScreen', () => {
  it('reports Host-event operations and uses physical Venue capacity', () => {
    render(<VenueOperationalAnalyticsScreen analytics={analytics} range="30d" />);

    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Daily operations' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Host event at the Venue/ })).toHaveAttribute(
      'href',
      '/partner/venue/events/host-event-1',
    );
    expect(screen.getByText(/Hosted by Test Host/)).toBeInTheDocument();
    expect(screen.getAllByText('300')).toHaveLength(2);
    expect(screen.getByText(/Event cap/)).toHaveTextContent('100');
    expect(screen.queryByText(/₹|revenue|payable|commission|settlement/i)).not.toBeInTheDocument();
  });
});
