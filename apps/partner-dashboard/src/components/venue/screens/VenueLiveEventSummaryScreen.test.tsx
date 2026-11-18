import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VenueLiveEventSummaryScreen } from './VenueLiveEventSummaryScreen';

import type { VenueEventDetailViewModel } from '@/lib/events/load-venue-event-detail';

const record: VenueEventDetailViewModel = {
  event: {
    id: 'event-1',
    ownerType: 'host',
    title: 'C1RCLE STAGING ACCEPTANCE 001',
    imageUrl: null,
    hostName: 'Test Host',
    venueId: 'venue-1',
    venueName: 'Test Venue',
    status: 'published',
    startAt: '2026-11-29T12:30:00.000Z',
    endAt: '2026-11-29T16:30:00.000Z',
    eventCapacity: 80,
    venueCapacity: 240,
    ticketUnitsIssued: 30,
    rsvpUnitsIssued: 5,
    expectedGuests: 42,
    checkedInGuests: 12,
    operationalCountsComplete: true,
    baseStartingPricePaise: 80_000,
    currentStartingPricePaise: 65_000,
    isFree: false,
  },
  tiers: [
    {
      tierId: 'tier-general',
      name: 'General Entry',
      unitKind: 'ticket',
      unitsIssued: 30,
      expectedGuests: 30,
      checkedInGuests: 10,
    },
  ],
  hostName: 'Test Host',
  venueName: 'Test Venue',
};

describe('VenueLiveEventSummaryScreen', () => {
  it('presents operational counts and separates physical Venue and event capacity', () => {
    render(<VenueLiveEventSummaryScreen record={record} />);

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('Test Host')).toBeInTheDocument();
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.queryByText(/host-org-1|venue-1/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Expected guests')).toHaveLength(2);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/30 ticket · 5 RSVP/)).toBeInTheDocument();
    expect(screen.getByText('Physical Venue capacity')).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
    expect(screen.getByText('Event capacity')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'General Entry' })).toBeInTheDocument();
    expect(screen.queryByText(/₹|revenue|payable|commission/i)).not.toBeInTheDocument();
  });
});
