import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PromoterFinanceScreen } from './PromoterFinanceScreen';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AddIcon: Icon,
    ChevronDownIcon: Icon,
    CreditCardIcon: Icon,
    RefreshIcon: Icon,
    WalletIcon: Icon,
  };
});

describe('PromoterFinanceScreen', () => {
  it('renders the wallet, settings, and empty payout states from the fixture', async () => {
    const data = await fixturePartnerDataSource.getPromoterFinance();
    render(<PromoterFinanceScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Finance' })).toBeInTheDocument();
    expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
    expect(screen.getAllByText('₹0')).toHaveLength(4);
    expect(screen.getByText('Withdrawals unavailable during launch verification')).toBeInTheDocument();
    expect(screen.getByText('No earnings yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Add Bank Account' })).toBeDisabled();
  });
});
