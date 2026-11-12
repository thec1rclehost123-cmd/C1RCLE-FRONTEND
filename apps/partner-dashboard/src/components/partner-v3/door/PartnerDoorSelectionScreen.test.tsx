import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PartnerDoorSelectionScreen } from './PartnerDoorSelectionScreen';

import type { PartnerEventsData } from '@/data/partner-data-source';
import type { ComponentProps } from 'react';

const data: PartnerEventsData = {
  dataStatus: 'api',
  pendingRequestCount: null,
  nextCursor: null,
  events: [
    {
      id: 'published-event',
      name: 'Published event',
      tag: 'Music',
      status: 'Live',
      party: 'venue',
      venue: 'The Hall',
      host: 'Host',
      hostInitials: 'H',
      dateLabel: '12 Nov',
      timeLabel: '8:00 pm',
      dayLabel: '12',
      monthLabel: 'NOV',
      priceLabel: '₹500',
      sold: 12,
      capacity: 100,
      revenueLabel: 'Unavailable',
      artwork: { type: 'gradient', value: 'orange' },
    },
    {
      id: 'draft-event',
      name: 'Draft event',
      tag: 'Music',
      status: 'Draft',
      party: 'venue',
      venue: 'The Hall',
      host: 'Host',
      hostInitials: 'H',
      dateLabel: '13 Nov',
      timeLabel: '8:00 pm',
      dayLabel: '13',
      monthLabel: 'NOV',
      priceLabel: '₹500',
      sold: 0,
      capacity: 100,
      revenueLabel: 'Unavailable',
      artwork: { type: 'gradient', value: 'orange' },
    },
  ],
};

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: ComponentProps<'a'>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('PartnerDoorSelectionScreen', () => {
  it('links published event rows to their existing Door Mode route', () => {
    render(<PartnerDoorSelectionScreen data={data} />);

    expect(screen.getByRole('link', { name: /Published event/ })).toHaveAttribute(
      'href',
      '/partner/venue/events/published-event/door',
    );
    expect(screen.queryByText('Draft event')).not.toBeInTheDocument();
  });

  it('provides a useful empty state when no published event is available', () => {
    render(<PartnerDoorSelectionScreen data={{ ...data, events: [] }} />);

    expect(screen.getByText('No upcoming published events')).toBeInTheDocument();
  });
});
