import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConnectedEventGuestsScreen } from './ConnectedEventGuestsScreen';

import type { DoorGuest } from '@c1rcle/contracts';

const guest = (overrides: Partial<DoorGuest>): DoorGuest => ({
  id: 'entitlement_1',
  name: 'Ticket holder',
  ticketType: 'General',
  entryType: 'general',
  quantity: 1,
  source: 'online',
  ownershipStatus: 'purchaser',
  status: 'not_entered',
  enteredAt: null,
  scansUsed: 0,
  scansAllowed: 1,
  ...overrides,
});

describe('ConnectedEventGuestsScreen', () => {
  it('shows ownership custody for purchaser-held, assigned, unassigned and door-sale records', () => {
    render(
      <ConnectedEventGuestsScreen
        studio="host"
        eventId="event_1"
        eventTitle="Night Event"
        truncated={false}
        guests={[
          guest({ ownershipStatus: 'purchaser' }),
          guest({ id: 'entitlement_2', ownershipStatus: 'assigned' }),
          guest({ id: 'entitlement_3', name: '', ownershipStatus: 'unassigned' }),
          guest({ id: 'door_sale_1', source: 'door', ownershipStatus: null }),
        ]}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Custody' })).toBeInTheDocument();
    expect(screen.getByText('Purchaser')).toBeInTheDocument();
    expect(screen.getByText('Assigned attendee')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Unassigned ticket')).toBeInTheDocument();
    expect(screen.getByText('Door sale')).toBeInTheDocument();
  });

  it('warns when the server reports the roster was truncated', () => {
    render(
      <ConnectedEventGuestsScreen
        studio="venue"
        eventId="event_1"
        eventTitle="Night Event"
        guests={[]}
        truncated
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('This roster is incomplete');
    expect(screen.getByText('Showing 0 matching records; more may exist.')).toBeInTheDocument();
  });
});
