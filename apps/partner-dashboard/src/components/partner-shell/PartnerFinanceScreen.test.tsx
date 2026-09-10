import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PartnerFinanceScreen } from './PartnerFinanceScreen';

import type { ReactNode } from 'react';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    readonly children: ReactNode;
    readonly href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    BankIcon: Icon,
    CalendarIcon: Icon,
    CheckIcon: Icon,
    OrderIcon: Icon,
    SearchIcon: Icon,
    SettingsIcon: Icon,
    TimeIcon: Icon,
  };
});

const baseProps = {
  subtitle: 'Your commissions and payouts.',
  available: '₹18,000',
  availableDetail: 'Eligible for payout',
  pending: '₹4,200',
  nextPayout: 'Fri, 25 Jul',
  ordersHref: '/promoter/finance/orders',
} as const;

describe('PartnerFinanceScreen', () => {
  it('preserves the shared payout hierarchy and Orders entry point', () => {
    render(
      <PartnerFinanceScreen
        {...baseProps}
        account={{
          display: 'HDFC Bank ••4421',
          bankName: 'HDFC Bank',
          maskedAccount: '••4421',
          accountHolder: 'Rhea Kapoor',
          status: 'Verified',
          manageHref: '/promoter/settings?tab=payout',
        }}
        history={[]}
      />,
    );

    expect(screen.getByText('HDFC Bank')).toBeInTheDocument();
    expect(screen.getByText('••4421')).toBeInTheDocument();
    expect(screen.getByText('Rhea Kapoor')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage/i })).toHaveAttribute(
      'href',
      '/promoter/settings?tab=payout',
    );
    expect(screen.getByRole('link', { name: /orders/i })).toHaveAttribute(
      'href',
      '/promoter/finance/orders',
    );
  });

  it('filters payout history and omits unsupported Event context', async () => {
    const user = userEvent.setup();
    render(
      <PartnerFinanceScreen
        {...baseProps}
        account={{ display: 'Payout account' }}
        history={[
          { id: 'pay-1', date: '11 Jul 2026', status: 'Paid', amount: '₹32,800' },
          { id: 'pay-2', date: '27 Jun 2026', status: 'Paid', amount: '₹21,400' },
        ]}
      />,
    );

    expect(screen.queryByText('Event')).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Search history'), '27 Jun');
    expect(screen.getByText('27 Jun 2026')).toBeInTheDocument();
    expect(screen.queryByText('11 Jul 2026')).not.toBeInTheDocument();
  });

  it('renders authoritative event context without changing the shared structure', () => {
    render(
      <PartnerFinanceScreen
        {...baseProps}
        account={{ display: 'Payout account' }}
        history={[
          {
            id: 'pay-1',
            date: '11 Jul 2026',
            event: 'Neon Nights',
            status: 'Paid',
            amount: '₹32,800',
          },
        ]}
        secondarySections={[
          {
            title: 'Campaign earnings',
            columns: ['Event', 'Earnings'],
            rows: [
              {
                id: 'campaign-1',
                cells: [{ value: 'Neon Nights' }, { value: '₹7,560', emphasis: true }],
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getAllByText('Event')).toHaveLength(2);
    expect(screen.getAllByText('Neon Nights')).toHaveLength(2);
    expect(screen.getByRole('table', { name: 'Campaign earnings' })).toBeInTheDocument();
  });
});
