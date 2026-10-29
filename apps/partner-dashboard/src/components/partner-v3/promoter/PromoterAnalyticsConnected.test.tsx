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
          grossAttributedTicketRevenuePaise: 123_450,
          hasMoreLinks: true,
        }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Campaign analytics' })).toBeInTheDocument();
    expect(screen.getByText('27')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('₹1,234.50')).toBeInTheDocument();
    expect(screen.getByText(/first 1,000 referral links/i)).toBeInTheDocument();
    expect(
      screen.getByText(/does not represent net commission or payout balance/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/daily breakdown is not available/i)).toBeInTheDocument();
  });

  it('does not describe empty data as campaign activity', () => {
    render(
      <PromoterAnalyticsConnected
        summary={{
          linkCount: 0,
          clicks: 0,
          conversions: 0,
          grossAttributedTicketRevenuePaise: 0,
          hasMoreLinks: false,
        }}
      />,
    );

    expect(screen.getAllByText('0', { selector: 'dd' })).toHaveLength(3);
    expect(screen.queryByText(/first 1,000 referral links/i)).not.toBeInTheDocument();
  });
});
