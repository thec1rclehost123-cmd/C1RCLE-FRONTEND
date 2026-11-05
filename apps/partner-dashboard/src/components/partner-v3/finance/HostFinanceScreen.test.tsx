import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { HostFinanceScreen } from './HostFinanceScreen';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/host/finance',
  useRouter: () => ({ replace }),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    BankIcon: Icon,
    ChevronDownIcon: Icon,
    ChevronUpIcon: Icon,
    NextIcon: Icon,
    RequestPayoutIcon: Icon,
    RowActionsIcon: Icon,
    SearchIcon: Icon,
    ScheduledPayoutIcon: Icon,
    SettingsIcon: Icon,
    SortableIcon: Icon,
    TrendUpIcon: Icon,
  };
});

describe('HostFinanceScreen', () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it('renders the Host lavender Finance composition from the typed fixture', async () => {
    const data = await fixturePartnerDataSource.getHostFinance();
    render(<HostFinanceScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument();
    expect(screen.getByText('Settlement eligible')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bank & cards' })).toHaveAttribute(
      'href',
      '/partner/host/finance?view=bank',
    );
    expect(screen.getByRole('button', { name: 'Request payout' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Request payout/ })).toBeDisabled();
  });

  it('explains the approved staged schedule and preserves server balances without treating eligibility as payment', async () => {
    const fixture = await fixturePartnerDataSource.getHostFinance();
    render(
      <HostFinanceScreen
        data={{
          ...fixture,
          availableBalance: '₹75,000.01',
          pendingBalance: { ...fixture.pendingBalance, value: '₹25,000' },
          heldBalance: {
            ...fixture.heldBalance,
            value: '₹1,200',
            detail: 'pending refunds · disputes · provider verification · reconciliation',
          },
          payoutRequest: {
            organizationId: 'host-org',
            availablePaise: 7_500_001,
            bankAccountId: 'bank-one',
            payoutsEnabled: false,
          },
        }}
      />,
    );
    expect(screen.getByText('₹75,000.01')).toBeInTheDocument();
    const policy = screen.getByRole('region', { name: 'Host settlement policy' });
    expect(policy).toHaveTextContent('up to 75% at 24 hours after the event’s effective end');
    expect(policy).toHaveTextContent('remaining 25% at 72 hours');
    expect(policy).toHaveTextContent('Eligibility does not automatically send a payout');
    expect(policy).toHaveTextContent('Payout requests are currently disabled');
    expect(
      screen.getByText('pending refunds · disputes · provider verification · reconciliation'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request payout' })).toBeDisabled();
  });

  it('does not label a legacy-transition balance as eligible when the server cannot establish settlement', async () => {
    const data = await fixturePartnerDataSource.getHostFinance();
    render(
      <HostFinanceScreen
        data={{
          ...data,
          availableBalance: '₹99,999',
          settlementUnavailableReason: 'Financial review is required for historical balances.',
        }}
      />,
    );
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('₹99,999')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Financial review is required for historical balances.',
    );
  });

  it('keeps Host order actions read-only while preserving URL-backed filtering', async () => {
    const data = await fixturePartnerDataSource.getHostFinance();
    render(<HostFinanceScreen data={data} view="orders" />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Karan Shah')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open actions for order #8821' }),
    ).toBeInTheDocument();
  });
});
