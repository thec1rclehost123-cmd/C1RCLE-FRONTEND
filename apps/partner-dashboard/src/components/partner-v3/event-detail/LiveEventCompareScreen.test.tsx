import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LiveEventCompareScreen } from './LiveEventCompareScreen';

const analytics = (
  eventId: string,
  values: Partial<{
    totalRevenuePaise: number;
    ticketsSold: number;
    refundAmountPaise: number;
    totalCheckIns: number;
  }> = {},
) => ({
  eventId,
  totalRevenuePaise: 250000,
  ticketsSold: 20,
  totalCheckIns: 12,
  totalTicketInventory: 40,
  capacity: 40,
  views: 0,
  guestlistSignups: 0,
  avgTicketPricePaise: 12500,
  occupancyRate: 0.5,
  sellThroughRate: 0.5,
  refundAmountPaise: 0,
  refundRate: 0,
  noShowRate: null,
  repeatGuests: 0,
  conversionRate: 0,
  ...values,
});

describe('LiveEventCompareScreen', () => {
  it('labels live totals separately from prior final totals', () => {
    render(
      <LiveEventCompareScreen
        data={{
          current: {
            eventId: 'evt_current',
            title: 'Current Night',
            startAt: '2026-11-01T20:00:00.000Z',
            status: 'current',
            analytics: analytics('evt_current'),
          },
          previous: [
            {
              eventId: 'evt_previous',
              title: 'Last Night',
              startAt: '2026-10-01T20:00:00.000Z',
              status: 'final',
              analytics: analytics('evt_previous', { ticketsSold: 18 }),
            },
          ],
        }}
      />,
    );
    expect(screen.getByText(/Current totals/)).toBeInTheDocument();
    expect(screen.getByText(/Final totals/)).toBeInTheDocument();
    expect(screen.getByText('Last Night')).toBeInTheDocument();
    expect(screen.getByText('Tickets sold')).toBeInTheDocument();
  });

  it('renders a clear empty state without inventing comparison values', () => {
    render(
      <LiveEventCompareScreen
        data={{
          current: {
            eventId: 'evt_current',
            title: 'Current Night',
            startAt: '2026-11-01T20:00:00.000Z',
            status: 'current',
            analytics: analytics('evt_current'),
          },
          previous: [],
        }}
      />,
    );
    expect(screen.getByText('No completed events to compare yet')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
