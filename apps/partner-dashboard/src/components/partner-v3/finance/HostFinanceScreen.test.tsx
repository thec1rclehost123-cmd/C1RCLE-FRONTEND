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
    WithdrawIcon: Icon,
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
    expect(screen.getByText('Available balance')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bank & cards' })).toHaveAttribute(
      'href',
      '/partner/host/finance?view=bank',
    );
    expect(screen.getByRole('button', { name: /Withdraw/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Request payout/ })).toBeDisabled();
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
