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

    expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getAllByText('27')[0]).toBeInTheDocument();
    expect(screen.getAllByText('4')[0]).toBeInTheDocument();
    expect(screen.getAllByText('₹1,235')[0]).toBeInTheDocument();
    expect(screen.getByText(/first 1,000 referral links/i)).toBeInTheDocument();
    expect(screen.getByText('Gross · before refunds')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4 conversions from 27 clicks' })).toBeInTheDocument();
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

    expect(screen.getAllByText('0', { selector: 'strong' })).toHaveLength(5);
    expect(screen.getByRole('img', { name: '0 conversions from 0 clicks' })).toBeInTheDocument();
    expect(screen.queryByText(/first 1,000 referral links/i)).not.toBeInTheDocument();
  });
});
