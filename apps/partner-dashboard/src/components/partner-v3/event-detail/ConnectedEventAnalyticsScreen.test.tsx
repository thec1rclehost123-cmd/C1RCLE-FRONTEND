import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConnectedEventAnalyticsScreen } from './ConnectedEventAnalyticsScreen';

const heatmap = {
  eventId: 'evt_123',
  timeZone: 'Asia/Kolkata' as const,
  totalBookings: 0,
  complete: true,
  weekdays: (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const).map((day) => ({
    day,
    hours: Array(24).fill(0) as number[],
  })),
};

describe('ConnectedEventAnalyticsScreen', () => {
  it('renders only metrics supplied by the event analytics contract', () => {
    render(
      <ConnectedEventAnalyticsScreen
        studio="venue"
        bookingHeatmap={heatmap}
        analytics={{
          eventId: 'evt_123',
          totalRevenuePaise: 125_000,
          ticketsSold: 125,
          totalCheckIns: 80,
          totalTicketInventory: 300,
          capacity: 200,
          views: 5_000,
          guestlistSignups: 22,
          avgTicketPricePaise: 1_000,
          occupancyRate: 0.4,
          sellThroughRate: 0.625,
          refundAmountPaise: 5_000,
          refundRate: 0.04,
          noShowRate: 0.36,
          repeatGuests: 18,
          conversionRate: 0.025,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Event analytics' })).toBeInTheDocument();
    expect(screen.getByText('Gross amount paid')).toBeInTheDocument();
    expect(screen.getAllByText('Ticket inventory')[0]).toBeInTheDocument();
    expect(screen.getAllByText('300')[0]).toBeInTheDocument();
    expect(screen.getByText('Room capacity')).toBeInTheDocument();
    expect(screen.getByText('₹1,250.00')).toBeInTheDocument();
    expect(screen.getByText('63%')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Event details/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/demographics/i)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Bookings by day and time' })).toBeInTheDocument();
    expect(
      screen.getByRole('gridcell', { name: 'Tue, 23:00 to 24:00: 0 bookings' }),
    ).toBeInTheDocument();
  });

  it('warns when the bounded booking scan is incomplete', () => {
    render(
      <ConnectedEventAnalyticsScreen
        studio="venue"
        bookingHeatmap={{ ...heatmap, totalBookings: 1000, complete: false }}
        analytics={{
          eventId: 'evt_123',
          totalRevenuePaise: 0,
          ticketsSold: 0,
          totalCheckIns: 0,
          totalTicketInventory: 0,
          capacity: null,
          views: 0,
          guestlistSignups: 0,
          avgTicketPricePaise: 0,
          occupancyRate: null,
          sellThroughRate: null,
          refundAmountPaise: 0,
          refundRate: 0,
          noShowRate: null,
          repeatGuests: 0,
          conversionRate: 0,
        }}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/partial result/i);
  });

  it('does not invent zero capacity or a no-show rate before an event ends', () => {
    render(
      <ConnectedEventAnalyticsScreen
        studio="venue"
        bookingHeatmap={heatmap}
        analytics={{
          eventId: 'evt_future',
          totalRevenuePaise: 10_885,
          ticketsSold: 1,
          totalCheckIns: 0,
          totalTicketInventory: 1,
          capacity: null,
          views: 0,
          guestlistSignups: 0,
          avgTicketPricePaise: 10_885,
          occupancyRate: null,
          sellThroughRate: null,
          refundAmountPaise: 0,
          refundRate: 0,
          noShowRate: null,
          repeatGuests: 1,
          conversionRate: 0,
        }}
      />,
    );

    expect(screen.getAllByText('₹108.85')).toHaveLength(2);
    expect(screen.getByText('Average amount paid per ticket')).toBeInTheDocument();
    expect(screen.getByText('Not configured')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
  });
});
