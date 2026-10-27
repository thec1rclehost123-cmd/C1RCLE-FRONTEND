import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConnectedPartnerAnalyticsScreen } from './ConnectedPartnerAnalyticsScreen';

describe('ConnectedPartnerAnalyticsScreen', () => {
  it('renders lifetime totals separately from the bounded trend window', () => {
    render(
      <ConnectedPartnerAnalyticsScreen
        studio="venue"
        analytics={{
          overview: {
            organizationId: 'org_1',
            totalEvents: 4,
            publishedEvents: 3,
            totalRevenuePaise: 125_000,
            totalTicketsSold: 125,
            totalCheckIns: 80,
            topEvents: [
              {
                eventId: 'evt_1',
                title: 'Connected event',
                revenuePaise: 100_000,
                tickets: 100,
                date: '2026-10-20T18:30:00.000Z',
              },
            ],
            lastEventAt: null,
          },
          salesBreakdown: {
            totalTicketsIssued: 110,
            paidTickets: 100,
            freeRsvpTickets: 10,
            paidOrderCount: 50,
            guestGrossCollectedPaise: 125_000,
            ticketRevenuePaise: 100_000,
          },
          partnerPayable: {
            availablePaise: 8_000,
            pendingPaise: 2_000,
            reservedPaise: 1_000,
            heldPaise: 500,
            paidPaise: 3_000,
            lifetimePaise: 14_500,
            holds: {
              reservePaise: 0,
              cancellationPaise: 0,
              chargebackPaise: 0,
              reconciliationPaise: 0,
            },
            readModel: 'legacy_ledger_v1',
          },
          lastThirtyDays: {
            organizationId: 'org_1',
            granularity: 'day',
            from: '2026-10-01',
            to: '2026-10-30',
            buckets: [
              {
                key: '2026-10-20',
                revenuePaise: 10_000,
                tickets: 10,
                checkIns: 8,
                totalTicketsIssued: 10,
                paidTickets: 8,
                freeRsvpTickets: 2,
                paidOrderCount: 4,
                guestGrossCollectedPaise: 12_000,
                ticketRevenuePaise: 10_000,
              },
            ],
            totals: {
              revenuePaise: 10_000,
              tickets: 10,
              checkIns: 8,
              totalTicketsIssued: 10,
              paidTickets: 8,
              freeRsvpTickets: 2,
              paidOrderCount: 4,
              guestGrossCollectedPaise: 12_000,
              ticketRevenuePaise: 10_000,
            },
          },
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByText('Total tickets issued')).toBeInTheDocument();
    expect(screen.getByText('Free RSVP tickets')).toBeInTheDocument();
    expect(screen.getAllByText('Paid orders')).toHaveLength(3);
    expect(screen.getAllByText('Guest gross collected')).toHaveLength(2);
    expect(screen.getAllByText('Ticket revenue')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Partner payable' })).toBeInTheDocument();
    expect(screen.getByText('₹145.00')).toBeInTheDocument();
    expect(screen.getAllByText('₹100.00')).toHaveLength(4);
    expect(screen.getByText('Connected event')).toBeInTheDocument();
    expect(screen.getByText(/Window totals are separate/)).toBeInTheDocument();
    expect(screen.getByText('Paid tickets / free RSVPs')).toBeInTheDocument();
    expect(screen.getAllByText('Net captured after refunds')).toHaveLength(2);
  });
});
