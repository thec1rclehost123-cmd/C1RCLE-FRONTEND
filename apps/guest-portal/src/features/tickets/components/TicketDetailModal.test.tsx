import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CODE, MANAGEMENT, TICKET } from '../fixtures/ticket-management.test-fixtures';

import { TicketDetailModal } from './TicketDetailModal';

import type { UserTicketItem } from '../types/tickets.types';

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));
vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { get: (...args: unknown[]) => mockGet(...args) },
}));

function renderModal(
  ticket: UserTicketItem | null,
  view: 'details' | 'qr' | 'booking' = 'details',
) {
  return render(<TicketDetailModal ticket={ticket} initialView={view} onClose={vi.fn()} />);
}
function qrCount() {
  return mockGet.mock.calls.filter(([input]) => (input as { path: string }).path.endsWith('/qr'))
    .length;
}
beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockImplementation((input: unknown) =>
    Promise.resolve((input as { path: string }).path.endsWith('/qr') ? CODE : MANAGEMENT),
  );
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Ticket details and progressive entry codes', () => {
  it('keeps ticket details flat and requests no entry credential until asked', async () => {
    renderModal(TICKET);
    expect(await screen.findByText('You · Guest')).toBeInTheDocument();
    expect(qrCount()).toBe(0);
    expect(screen.queryByRole('link', { name: 'Upgrade ticket' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show entry code' }));
    expect(
      await screen.findByRole('img', { name: 'Entry code for RSVP Night' }),
    ).toBeInTheDocument();
    expect(qrCount()).toBe(1);
  });
  it('shows extras and their authoritative redemption state', async () => {
    renderModal({
      ...TICKET,
      ticketAddons: [{ id: 'extra-1', name: 'Parking', kind: 'parking', status: 'redeemed' }],
    });
    expect(screen.getByRole('region', { name: 'Ticket extras' })).toBeInTheDocument();
    expect(screen.getByText('redeemed')).toBeInTheDocument();
    await screen.findByText('You · Guest');
  });
  it('hides entry and transfer actions for an unassigned unit until a verified claim', async () => {
    mockGet.mockResolvedValue({
      ...MANAGEMENT,
      ownership: 'unassigned',
      holderName: null,
      canPresent: false,
    });
    renderModal({ ...TICKET, holderName: 'Unassigned', custody: 'unassigned' });
    expect(await screen.findByRole('button', { name: 'Invite attendee' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show entry code' })).not.toBeInTheDocument();
    expect(qrCount()).toBe(0);
  });
  it('refreshes the rotating credential on the server interval', async () => {
    vi.useFakeTimers();
    renderModal(TICKET, 'qr');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(qrCount()).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(29000);
    });
    expect(qrCount()).toBe(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(qrCount()).toBe(2);
  });
  it('stops credential refresh when closed', async () => {
    vi.useFakeTimers();
    const { unmount } = renderModal(TICKET, 'qr');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(qrCount()).toBe(1);
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60000);
    });
    expect(qrCount()).toBe(1);
  });
  it('retries a failed QR read without fabricating an entry code', async () => {
    mockGet.mockImplementation((input: unknown) =>
      (input as { path: string }).path.endsWith('/qr')
        ? Promise.reject(new Error('offline'))
        : Promise.resolve(MANAGEMENT),
    );
    renderModal(TICKET, 'qr');
    expect(await screen.findByText('Entry code unavailable.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Entry code/ })).not.toBeInTheDocument();
    mockGet.mockImplementation((input: unknown) =>
      Promise.resolve((input as { path: string }).path.endsWith('/qr') ? CODE : MANAGEMENT),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('img', { name: 'Entry code for RSVP Night' }),
    ).toBeInTheDocument();
  });
  it('does not expose another holder’s QR or transfer action', async () => {
    mockGet.mockResolvedValue({
      ...MANAGEMENT,
      ownership: 'transferred',
      holderName: 'Recipient',
      canPresent: false,
      canTransfer: false,
      transferUnavailableReason: 'Only the current holder can transfer this ticket.',
    });
    renderModal({
      ...TICKET,
      management: {
        ...MANAGEMENT,
        ownership: 'transferred',
        canPresent: false,
        canTransfer: false,
      },
    });
    expect(await screen.findByText('Recipient')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show entry code' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Transfer ticket' })).not.toBeInTheDocument();
    expect(qrCount()).toBe(0);
  });
  it('keeps free RSVP transfer controls unavailable', async () => {
    mockGet.mockResolvedValue({
      ...MANAGEMENT,
      unitKind: 'free_rsvp',
      canTransfer: false,
      transferUnavailableReason: 'Free RSVPs cannot be transferred.',
    });
    renderModal(TICKET);
    expect(await screen.findByText('Free RSVPs cannot be transferred.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Transfer ticket' })).not.toBeInTheDocument();
  });
  it('renders nothing when no ticket is selected', () => {
    renderModal(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });
  it('switches individual tickets through the booking roster while preserving distinct QR requests', async () => {
    const second = { ...TICKET, id: 'ENT-second', tierName: 'General Admission', ticketCount: 1 };
    function BookingDialog() {
      const [selected, select] = React.useState(TICKET);
      const [view, setView] = React.useState<'booking' | 'details'>('booking');
      return (
        <TicketDetailModal
          key={selected.id}
          ticket={selected}
          initialView={view}
          bookingTickets={[TICKET, second]}
          onSelectTicket={(item) => {
            setView('details');
            select(item);
          }}
          onClose={vi.fn()}
        />
      );
    }
    render(<BookingDialog />);
    fireEvent.click(screen.getByRole('button', { name: /General Admission · Ticket 2/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Show entry code' }));
    await screen.findByRole('img', { name: 'Entry code for RSVP Night' });
    expect(mockGet).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/tickets/ENT-second/qr' }),
    );
  });
});

it('fails closed when fresh management cannot be read, even with a previously active ticket', async () => {
  mockGet.mockRejectedValue(new Error('Management unavailable'));
  renderModal({ ...TICKET, management: MANAGEMENT }, 'qr');
  await act(async () => {
    await Promise.resolve();
  });
  expect(qrCount()).toBe(0);
  expect(screen.queryByRole('img', { name: /Entry code/ })).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Entry code unavailable');
});
it('shows the authoritative 24-hour reason and never calls the credential endpoint before availability', async () => {
  mockGet.mockResolvedValue({
    ...MANAGEMENT,
    canPresent: false,
    qrUnavailableReason: 'Your QR becomes available 24 hours before the event starts.',
  });
  renderModal(TICKET, 'qr');
  expect(
    await screen.findByText('Your QR becomes available 24 hours before the event starts.'),
  ).toBeInTheDocument();
  expect(qrCount()).toBe(0);
});
it('keeps used and refunded tickets out of credential issuance', async () => {
  mockGet.mockResolvedValue({
    ...MANAGEMENT,
    status: 'used',
    canPresent: false,
    qrUnavailableReason: 'This ticket has already been used.',
  });
  renderModal({ ...TICKET, status: 'used' }, 'qr');
  expect(await screen.findByText('This ticket has already been used.')).toBeInTheDocument();
  expect(qrCount()).toBe(0);
});
it('preserves the authoritative event title including date-like suffixes', async () => {
  const title = 'NYE-20261231-VIP';
  mockGet.mockResolvedValue({ ...MANAGEMENT, eventTitle: title });
  renderModal({ ...TICKET, eventTitle: title });
  expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
  await screen.findByText('You · Guest');
});
it('does not retain an old ticket credential while a different ticket is loading', async () => {
  const { rerender } = renderModal(TICKET, 'qr');
  await screen.findByRole('img', { name: 'Entry code for RSVP Night' });
  mockGet.mockImplementation(() => new Promise(() => undefined));
  rerender(
    <TicketDetailModal
      ticket={{ ...TICKET, id: 'ENT-second', eventTitle: 'Second Event' }}
      initialView="qr"
      onClose={vi.fn()}
    />,
  );
  expect(screen.queryByRole('img', { name: /Entry code/ })).not.toBeInTheDocument();
});

it('shows authoritative postponement and clears cached dates without fetching credentials', async () => {
  mockGet.mockResolvedValue({
    ...MANAGEMENT,
    eventStatus: 'postponed',
    startsAt: null,
    endsAt: null,
    canPresent: false,
    canTransfer: false,
    qrUnavailableReason: 'Event postponed',
  });
  renderModal(TICKET);
  expect(await screen.findByText('Postponed', { exact: true })).toBeInTheDocument();
  expect(screen.getByText('New date to be announced', { exact: true })).toBeInTheDocument();
  expect(screen.queryByText(TICKET.date, { exact: true })).not.toBeInTheDocument();
  expect(screen.queryByText('Active', { exact: true })).not.toBeInTheDocument();
  expect(qrCount()).toBe(0);
});
