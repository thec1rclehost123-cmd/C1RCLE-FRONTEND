import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { UserTicketCard } from './UserTicketCard';
import { UserTicketsView } from './UserTicketsView';

import type { UserTicketItem } from '../types/tickets.types';

const ticket: UserTicketItem = {
  id: 'entitlement_test',
  eventId: 'event_test',
  orderId: 'order_test',
  bookingReference: null,
  holderName: 'Test Guest',
  eventTitle: 'Event details unavailable',
  date: '',
  time: '',
  venueName: 'Venue unavailable',
  city: '',
  posterUrl: '/c1rcle-logo.webp',
  tierName: 'General',
  ticketCount: 1,
  status: 'unavailable',
};

it('shows unresolved passes separately without claiming there are no current passes', () => {
  render(
    <UserTicketsView
      wallet={{ upcomingTickets: [], pastTickets: [], unavailableTickets: [ticket] }}
    />,
  );
  expect(screen.getByRole('region', { name: 'Passes awaiting event details' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Refresh event details' })).toBeInTheDocument();
  expect(screen.queryByText('NO CURRENT PASSES YET')).not.toBeInTheDocument();
  expect(screen.queryByText('Past', { exact: true })).not.toBeInTheDocument();
});

it('preserves the authoritative refund status in History', () => {
  render(
    <UserTicketCard
      ticket={{ ...ticket, status: 'refunded' }}
      isPast
      onSelect={vi.fn()}
      onAddToCalendar={vi.fn()}
    />,
  );
  expect(screen.getByText('refunded')).toBeInTheDocument();
  expect(screen.queryByText('Past', { exact: true })).not.toBeInTheDocument();
});
