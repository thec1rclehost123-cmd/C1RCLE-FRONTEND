import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { buildVenueEventDetailRecord, venueEventDetailFixture } from '../event-detail-model';

import { EventOrdersTable } from './EventOrdersTable';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return { ExportIcon: Icon, SearchIcon: Icon };
});

const orders = buildVenueEventDetailRecord(venueEventDetailFixture).sales?.orders;

describe('EventOrdersTable', () => {
  it('filters recent orders by guest, ticket, and status', async () => {
    const user = userEvent.setup();
    if (!orders) throw new Error('Fixture orders are required');
    render(<EventOrdersTable orders={orders} />);

    await user.type(screen.getByPlaceholderText('Search orders...'), 'refunded');
    expect(screen.getByText('Pooja Shah')).toBeInTheDocument();
    expect(screen.queryByText('Rohit Mehta')).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search orders...'));
    await user.type(screen.getByPlaceholderText('Search orders...'), 'Couple Pass');
    expect(screen.getByText('Rohit Mehta')).toBeInTheDocument();
    expect(screen.getByText('Neha Kapoor')).toBeInTheDocument();
    expect(screen.queryByText('Sneha Iyer')).not.toBeInTheDocument();
  });
});
