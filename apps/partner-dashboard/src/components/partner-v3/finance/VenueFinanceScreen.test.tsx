import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { VenueFinanceScreen } from './VenueFinanceScreen';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/venue/finance',
  useRouter: () => ({ replace }),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    BankIcon: Icon,
    ChevronDownIcon: Icon,
    ChevronUpIcon: Icon,
    NextIcon: Icon,
    NotificationIcon: Icon,
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

describe('VenueFinanceScreen', () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it('renders the Balance & payouts view from the Venue fixture', async () => {
    const data = await fixturePartnerDataSource.getVenueFinance();
    render(<VenueFinanceScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument();
    expect(screen.getByText('Available balance')).toBeInTheDocument();
    expect(screen.getAllByText('₹4,86,200')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Payout history' })).toBeInTheDocument();
    expect(screen.getByText(/Neon Nights \+ 2 events/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Withdraw/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Request payout/ })).toBeDisabled();
  });

  it('filters Orders by status and keeps row actions read-only', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueFinance();
    render(<VenueFinanceScreen data={data} view="orders" />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Priya Kapoor')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Pending' }));
    expect(screen.getByText('Karan Shah')).toBeInTheDocument();
    expect(screen.queryByText('Priya Kapoor')).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/finance?view=orders&status=pending', { scroll: false });

    await user.click(screen.getByRole('button', { name: 'Open actions for order #8821' }));
    expect(screen.getByRole('menuitem', { name: 'Refund' })).toBeDisabled();
  });

  it('renders the read-only Bank & cards view', async () => {
    const data = await fixturePartnerDataSource.getVenueFinance();
    render(<VenueFinanceScreen data={data} view="bank" />);

    expect(screen.getByRole('heading', { name: 'Bank account' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Payment card' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('HDFC0001234')).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Save bank details' })).toBeDisabled();
  });
});
