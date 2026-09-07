import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { buildVenueEventDetailRecord, venueEventDetailFixture } from '../event-detail-model';

import { EventSalesChart } from './EventSalesChart';

const chart = buildVenueEventDetailRecord(venueEventDetailFixture).sales?.chart;

describe('EventSalesChart', () => {
  it('keeps one accessible chart and toggles its measure', async () => {
    const user = userEvent.setup();
    if (!chart) throw new Error('Fixture sales chart is required');
    render(<EventSalesChart chart={chart} />);

    expect(screen.getByRole('button', { name: 'Sales' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: chart.salesSummary })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tickets' }));
    expect(screen.getByRole('button', { name: 'Tickets' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: chart.ticketsSummary })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: chart.salesSummary })).not.toBeInTheDocument();
  });
});
