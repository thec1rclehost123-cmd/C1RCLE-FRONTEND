import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { MANAGEMENT, TICKET } from '../fixtures/ticket-management.test-fixtures';

import { UserTicketCard } from './UserTicketCard';

it('labels a postponed event without a green active credential indicator', () => {
  const ticket = {
    ...TICKET,
    status: 'postponed' as const,
    startsAt: null,
    endsAt: null,
    date: 'New date to be announced',
    time: '',
    management: {
      ...MANAGEMENT,
      eventStatus: 'postponed' as const,
      startsAt: null,
      endsAt: null,
      canPresent: false,
      canTransfer: false,
    },
  };
  render(<UserTicketCard ticket={ticket} onSelect={vi.fn()} onAddToCalendar={vi.fn()} />);
  expect(screen.getByText('Postponed', { exact: true })).toBeInTheDocument();
  expect(screen.queryByLabelText('Active ticket')).not.toBeInTheDocument();
});
