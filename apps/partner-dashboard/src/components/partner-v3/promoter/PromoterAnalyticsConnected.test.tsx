import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PromoterAnalyticsConnected } from './PromoterAnalyticsConnected';

describe('PromoterAnalyticsConnected', () => {
  it('renders the backend totals and makes their limits explicit', () => {
    render(
      <PromoterAnalyticsConnected
        summary={{
          linkCount: 1_000,
          clicks: 27,
          conversions: 4,
          historicalRsvpConversions: 2,
          activeRsvpCount: 1,
          grossAttributedTicketRevenuePaise: 123_450,
          grossAttributedTicketSalesPaise: 123_450,
          refundedAttributedTicketSalesPaise: 10_000,
          netAttributedTicketSalesPaise: 113_450,
          refundValueComplete: true,
          recordedCommissionPaise: 12_000,
          reversedCommissionPaise: 1_000,
          complete: false,
          hasMoreLinks: true,
          hasMoreOrders: true,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(
      screen.getByText('Gross attributed sales').parentElement?.querySelector('strong'),
    ).toHaveAttribute('data-tone', 'positive');
    expect(
      screen.getByText('Refunded value').parentElement?.querySelector('strong'),
    ).toHaveAttribute('data-tone', 'negative');
    expect(screen.getAllByText('27')[0]).toBeInTheDocument();
    expect(screen.getAllByText('4')[0]).toBeInTheDocument();
    expect(screen.getByText('₹1,135')).toBeInTheDocument();
    expect(screen.getByText(/first 1,000 links and attributed orders/i)).toBeInTheDocument();
    expect(screen.getByText(/1 active of\s+2 historical acquisitions/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4 conversions from 27 clicks' })).toBeInTheDocument();
  });

  it('does not describe empty data as campaign activity', () => {
    render(
      <PromoterAnalyticsConnected
        summary={{
          linkCount: 0,
          clicks: 0,
          conversions: 0,
          historicalRsvpConversions: 0,
          activeRsvpCount: 0,
          grossAttributedTicketRevenuePaise: 0,
          grossAttributedTicketSalesPaise: 0,
          refundedAttributedTicketSalesPaise: 0,
          netAttributedTicketSalesPaise: 0,
          refundValueComplete: true,
          recordedCommissionPaise: 0,
          reversedCommissionPaise: null,
          complete: true,
          hasMoreLinks: false,
          hasMoreOrders: false,
        }}
      />,
    );

    expect(screen.getAllByText('0', { selector: 'strong' })).toHaveLength(5);
    expect(screen.getByRole('img', { name: '0 conversions from 0 clicks' })).toBeInTheDocument();
    expect(screen.queryByText(/first 1,000 links and attributed orders/i)).not.toBeInTheDocument();
  });
});
