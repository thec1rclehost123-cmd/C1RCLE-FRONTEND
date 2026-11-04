import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EventListRow } from './EventListRow';

import type { PartnerEventRecord } from '@/data/partner-data-source';

const event: PartnerEventRecord = {
  id: 'evt_m3',
  name: 'M3 event',
  tag: 'Event',
  status: 'Live',
  party: 'venue',
  venue: 'M3 venue',
  host: 'M3 host',
  hostInitials: 'MH',
  dateLabel: '27 Oct',
  timeLabel: '8:00 pm',
  dayLabel: '27',
  monthLabel: 'OCT',
  priceLabel: '₹100',
  sold: 0,
  capacity: null,
  salesCountComplete: true,
  revenueLabel: 'Revenue unavailable',
  artwork: { type: 'gradient', value: 'placeholder' },
};

describe('EventListRow', () => {
  it('keeps issued tickets separate from unconfigured room capacity', () => {
    render(<EventListRow event={event} href="/event/evt_m3" editHref="/events/create" />);

    expect(screen.getByText('0 tickets issued')).toBeVisible();
    expect(screen.getByText('Room capacity not configured')).toBeVisible();
    expect(screen.queryByText('0 / Capacity not set')).not.toBeInTheDocument();
  });

  it('labels a configured room capacity separately from issued tickets', () => {
    render(
      <EventListRow
        event={{ ...event, sold: 1, capacity: 2 }}
        href="/event/evt_m3"
        editHref="/events/create"
      />,
    );

    expect(screen.getByText('1 ticket issued')).toBeVisible();
    expect(screen.getByText('Room capacity: 2')).toBeVisible();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows unavailable and bounded sales honestly', () => {
    const { rerender } = render(
      <EventListRow
        event={{ ...event, sold: null, salesCountComplete: false }}
        href="/event/evt_m3"
        editHref="/events/create"
      />,
    );

    expect(screen.getByText('Sales unavailable')).toBeVisible();

    rerender(
      <EventListRow
        event={{ ...event, sold: 2, salesCountComplete: false }}
        href="/event/evt_m3"
        editHref="/events/create"
      />,
    );
    expect(screen.getByText('≥ 2 tickets issued')).toBeVisible();
    expect(
      screen.getByText('Room capacity not configured · Sales count is a lower bound'),
    ).toBeVisible();
  });
});
