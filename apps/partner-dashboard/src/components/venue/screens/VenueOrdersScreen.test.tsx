import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { VenueOrdersScreen } from './VenueOrdersScreen';

const mocks = vi.hoisted(() => ({ permissions: [] as string[] }));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    BackIcon: Icon,
    OrderIcon: Icon,
    RowActionsIcon: Icon,
    SearchIcon: Icon,
    SortableIcon: Icon,
  };
});

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({ grantedPermissions: mocks.permissions }),
}));

describe('VenueOrdersScreen', () => {
  it('searches venue-wide orders by customer or order number', async () => {
    const user = userEvent.setup();
    render(<VenueOrdersScreen />);

    await user.type(screen.getByRole('searchbox', { name: 'Search orders' }), '250706');

    const table = screen.getByRole('table');
    expect(within(table).getByText('Kabir Shah')).toBeInTheDocument();
    expect(within(table).queryByText('Shelby Adams')).not.toBeInTheDocument();
    expect(screen.getByText('1 shown')).toBeInTheDocument();
  });

  it('filters by payment status and sorts by ticket quantity', async () => {
    const user = userEvent.setup();
    render(<VenueOrdersScreen />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Filter by status' }), 'Paid');
    expect(screen.queryByText('Kabir Shah')).not.toBeInTheDocument();
    expect(screen.queryByText('Arjun Kapoor')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Tickets/ }));
    const firstDataRow = screen.getAllByRole('row')[1];
    expect(firstDataRow).toHaveTextContent('Riya Mehta');
    expect(firstDataRow).toHaveTextContent('4');
  });

  it('protects orders with the same finance permission as the Finance screen', () => {
    mocks.permissions = ['VIEW_EVENTS'];
    render(<VenueOrdersScreen />);

    expect(screen.getByRole('alert')).toHaveTextContent('Orders unavailable');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    mocks.permissions = [];
  });
});
