import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PromoterOverviewConnected } from './PromoterOverviewConnected';

describe('PromoterOverviewConnected', () => {
  it('renders server aggregates and authoritative balance without a tracked commission total', () => {
    const data = {
      campaignSummary: {
        linkCount: 2,
        clicks: 12,
        conversions: 3,
        grossAttributedTicketRevenuePaise: 45_000,
        hasMoreLinks: true,
      },
      events: {
        linkedEvents: [],
      },
      balance: {
        pendingPaise: 1_500,
        heldPaise: 500,
        availablePaise: 2_000,
        lifetimePaise: 3_000,
        readModel: 'financial_journal',
      },
      ledger: {
        hasNextPage: true,
        items: [
          {
            id: 'ledger_commission_1',
            orderId: 'order_private_1',
            eventId: 'event_1',
            entryType: 'promoter_commission',
            amountPaise: 1_500,
            status: 'pending',
            createdAt: '2026-10-28T12:00:00.000Z',
          },
          {
            id: 'ledger_refund_1',
            orderId: 'order_private_1',
            eventId: 'event_1',
            entryType: 'refund',
            amountPaise: 500,
            status: 'settled',
            createdAt: '2026-10-28T12:30:00.000Z',
          },
        ],
      },
      attributedOrders: {
        pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
        items: [
          {
            id: 'order_1',
            bookingReference: 'C1-BOOK-123',
            eventId: 'event_1',
            status: 'paid',
            ticketCount: 2,
            attributedTicketValuePaise: 45_000,
            promoterCommissionPaise: 4_500,
            attributedAt: '2026-10-28T12:00:00.000Z',
          },
        ],
      },
    } as unknown as Parameters<typeof PromoterOverviewConnected>[0]['data'];

    render(<PromoterOverviewConnected data={data} />);

    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('Gross attributed ticket revenue')).toBeTruthy();
    expect(screen.getByText(/first 1,000 referral links/)).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('Held')).toBeTruthy();
    expect(screen.getByText('Available')).toBeTruthy();
    expect(screen.getByText('Commission activity')).toBeTruthy();
    expect(screen.getByText('Attributed orders')).toBeTruthy();
    expect(screen.getByText('C1-BOOK-123')).toBeTruthy();
    expect(screen.getByText('event_1')).toBeTruthy();
    expect(
      screen.getByText(
        'Guest contact details, payment identifiers, referral codes, and attribution signatures are not shown.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Commission reversal')).toBeTruthy();
    expect(screen.queryByText('order_private_1')).toBeNull();
    expect(screen.queryByText('Tracked commission')).toBeNull();
  });
});
