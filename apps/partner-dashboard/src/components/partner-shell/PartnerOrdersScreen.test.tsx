import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PartnerOrdersScreen } from './PartnerOrdersScreen';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    BackIcon: Icon,
    OrderIcon: Icon,
    RowActionsIcon: Icon,
    SearchIcon: Icon,
  };
});

const rows = [
  {
    id: 'order-1',
    event: 'Neon Nights',
    createdAt: '4 minutes ago',
    ticketCount: 2,
    source: 'Instagram',
    total: '₹1,600',
    status: 'Confirmed',
  },
  {
    id: 'order-2',
    event: 'Bassline Nights',
    createdAt: '18 minutes ago',
    ticketCount: 3,
    source: 'Bio link',
    attributedEarnings: '₹720',
    status: 'Refunded',
  },
] as const;

describe('PartnerOrdersScreen', () => {
  it('renders the host table without promoter-only source or earnings columns', () => {
    render(
      <PartnerOrdersScreen
        backHref="/host/finance"
        subtitle="Orders from your hosted events."
        scopeLabel="Hosted orders"
        rows={rows}
        kind="host"
      />,
    );

    const table = screen.getByRole('table');
    expect(within(table).getByText('Total')).toBeInTheDocument();
    expect(within(table).queryByText('Source')).not.toBeInTheDocument();
    expect(within(table).queryByText('Attributed earnings')).not.toBeInTheDocument();
  });

  it('filters promoter-scoped orders by source and status', async () => {
    const user = userEvent.setup();
    render(
      <PartnerOrdersScreen
        backHref="/promoter/finance"
        subtitle="Orders attributed to your promoter links."
        scopeLabel="Attributed orders"
        rows={rows}
        kind="promoter"
      />,
    );

    await user.type(screen.getByRole('searchbox', { name: 'Search orders' }), 'Instagram');
    expect(screen.getByText('1 shown')).toBeInTheDocument();
    expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    expect(screen.queryByText('Bassline Nights')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: 'Search orders' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'Refunded');
    expect(screen.getByText('Bassline Nights')).toBeInTheDocument();
    expect(screen.queryByText('Neon Nights')).not.toBeInTheDocument();
  });
});
