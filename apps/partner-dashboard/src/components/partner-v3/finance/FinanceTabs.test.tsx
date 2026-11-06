import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FinanceTabs } from './FinanceTabs';

describe('Promoter finance tabs', () => {
  it('omits purchaser orders and keeps only commission/payout and own bank views', () => {
    render(
      <FinanceTabs
        baseHref="/partner/promoter/finance"
        activeView="payouts"
        promoterScope
      />,
    );

    expect(screen.getByRole('link', { name: 'Balance & payouts' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bank & cards' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Orders' })).not.toBeInTheDocument();
  });
});
