import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VenueOperationalOverviewScreen } from './VenueOperationalOverviewScreen';

import type {
  VenueOperationalAnalyticsDto,
  VenueOperationalEventDto,
  VenueOperationalOverviewDto,
} from '@c1rcle/contracts';

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

const now = new Date('2026-11-17T12:00:00.000Z');
const hostEvent = data.upcomingEvents[0];
if (!hostEvent) throw new Error('Missing Host event fixture');
const venueEvent: VenueOperationalEventDto = {
  ...hostEvent,
  id: 'venue-event-1',
  title: 'Venue event',
  ownerType: 'venue',
  hostName: null,
  // IST midnight boundary
  startAt: '2026-11-20T19:00:00.000Z',
  endAt: null,
};
const day = {
  date: '2026-11-17',
  eventCount: 1,
  ticketUnitsIssued: 23,
  rsvpUnitsIssued: 7,
  expectedGuests: 30,
  checkedInGuests: 10,
  physicalVenueCapacity: 300,
  expectedOccupancyPercent: 10,
};
const analytics: VenueOperationalAnalyticsDto = {
  from: '2026-11-01',
  to: '2026-11-30',
  timeZone: 'Asia/Kolkata',
  summary: {
    eventCount: 3,
    ticketUnitsIssued: 121,
    rsvpUnitsIssued: 14,
    expectedGuests: 60,
    checkedInGuests: 20,
    physicalVenueCapacity: 600,
    expectedOccupancyPercent: 10,
    complete: true,
  },
  days: [day, { ...day, date: '2026-11-20', eventCount: 2, ticketUnitsIssued: 98 }],
  events: [],
};

describe('VenueOperationalOverviewScreen', () => {
  it('features the earliest associated Host event and shows both owners in the schedule', () => {
    const { container } = render(
      <VenueOperationalOverviewScreen
        data={{ ...data, upcomingEvents: [venueEvent, hostEvent] }}
        analytics={analytics}
        now={now}
      />,
    );

    const hero = within(screen.getByRole('article', { name: hostEvent.title }));
    expect(hero.getByText('Hosted by Test Host')).toBeInTheDocument();
    expect(hero.getByRole('link', { name: 'View event' })).toHaveAttribute(
      'href',
      '/partner/venue/events/host-event-1',
    );
    expect(hero.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('[class*="heroPosterFallback"]')).toBeInTheDocument();

    const upcoming = within(screen.getByRole('region', { name: 'Upcoming events' }));
    expect(upcoming.getByRole('link', { name: /Host event at the Venue/ })).toHaveAttribute(
      'href',
      '/partner/venue/events/host-event-1',
    );
    expect(upcoming.getByRole('link', { name: /Venue event/ })).toHaveAttribute(
      'href',
      '/partner/venue/events/venue-event-1',
    );
    expect(screen.getByRole('link', { name: 'Create event' })).toHaveAttribute(
      'href',
      '/partner/venue/events/create',
    );
    expect(
      screen.queryByText(/recent orders|₹|revenue|payable|commission|settlement/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /guest list|door mode|edit/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('18.67%')).toBeInTheDocument();

    expect(screen.getByLabelText('November 2026, 20, 2 events')).toBeInTheDocument();
    expect(screen.getByLabelText('November 2026, 21, 1 event')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all events' })).toHaveAttribute(
      'href',
      '/partner/venue/calendar',
    );
    expect(screen.getByRole('img', { name: /tickets 1W trend: 23/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View analytics' })).toHaveAttribute(
      'href',
      '/partner/venue/analytics',
    );
  });

  it('features a Venue-owned event when it is next', () => {
    render(
      <VenueOperationalOverviewScreen
        data={{ ...data, upcomingEvents: [venueEvent] }}
        analytics={analytics}
        now={now}
      />,
    );
    expect(
      within(screen.getByRole('article', { name: venueEvent.title })).getByText(
        'Organized by Test Venue',
      ),
    ).toBeInTheDocument();
  });

  it('keeps a live associated Host event eligible ahead of the future schedule', () => {
    render(
      <VenueOperationalOverviewScreen
        data={{ ...data, upcomingEvents: [venueEvent] }}
        analytics={{
          ...analytics,
          events: [
            {
              ...hostEvent,
              status: 'started',
              startAt: '2026-11-17T11:00:00.000Z',
              endAt: '2026-11-17T14:00:00.000Z',
            },
          ],
        }}
        now={now}
      />,
    );
    expect(
      within(screen.getByRole('article', { name: hostEvent.title })).getByText('Live now'),
    ).toBeInTheDocument();
  });

  it('shows unknown capacity, incomplete counts and unavailable performance honestly', () => {
    render(
      <VenueOperationalOverviewScreen
        data={{
          summary: {
            ...data.summary,
            physicalVenueCapacity: 0,
            expectedOccupancyPercent: null,
            complete: false,
          },
          upcomingEvents: [{ ...hostEvent, venueCapacity: null, operationalCountsComplete: false }],
        }}
        analytics={null}
        now={now}
      />,
    );
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Not available')).toBeInTheDocument();
    expect(screen.getByText('≥ 40')).toBeInTheDocument();
    expect(screen.getByText(/minimum recorded/)).toBeInTheDocument();
    expect(screen.getByText('At least 56 expected guests')).toBeInTheDocument();
    expect(screen.getByText('Venue performance is temporarily unavailable.')).toBeInTheDocument();
  });

  it('renders an empty schedule with calendar and create access', () => {
    render(
      <VenueOperationalOverviewScreen
        data={{ ...data, upcomingEvents: [] }}
        analytics={analytics}
        now={now}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No upcoming events' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('article', { name: 'No upcoming events' })).queryByRole('link'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all events' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create event' })).toBeInTheDocument();
  });
});
