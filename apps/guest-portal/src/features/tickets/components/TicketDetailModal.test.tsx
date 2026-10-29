import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TicketDetailModal } from './TicketDetailModal';

import type { UserTicketItem } from '../types/tickets.types';

const { mockBffGet, mockBffPost } = vi.hoisted(() => ({
  mockBffGet: vi.fn<(...args: readonly unknown[]) => Promise<unknown>>(),
  mockBffPost: vi.fn<(...args: readonly unknown[]) => Promise<unknown>>(),
}));

vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: {
    get: (...args: unknown[]) => mockBffGet(...args),
    post: (...args: unknown[]) => mockBffPost(...args),
  },
}));

const CODE = {
  qrPayload: 'ENT-rsvp-1:1791800000:deadbeefdeadbeef',
  expiresAt: '2026-12-10T12:00:30.000Z',
  refreshIntervalSec: 30,
};

const TRANSFER = {
  id: 'TRF-test-1',
  entitlementId: 'ENT-rsvp-1',
  eventId: 'EVT-test-1',
  status: 'pending',
  expiresAt: '2026-12-10T12:00:00.000Z',
  acceptedAt: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-12-10T11:00:00.000Z',
  updatedAt: '2026-12-10T11:00:00.000Z',
} as const;

const TICKET: UserTicketItem = {
  id: 'ENT-rsvp-1',
  eventId: 'EVT-test-1',
  orderId: 'ord_rsvp_1',
  eventTitle: 'RSVP Night',
  date: 'Saturday, Aug 16, 2026',
  time: '10:00 PM IST',
  venueName: 'BAYVIEW CLUB',
  city: 'MUMBAI',
  posterUrl: '/c1rcle-logo.webp',
  tierName: 'VIP ACCESS',
  isVip: true,
  ticketCount: 2,
  status: 'active',
  bookingReference: null,
  holderName: 'Guest',
};

function renderModal(ticket: UserTicketItem | null, onClose = vi.fn()) {
  render(<TicketDetailModal ticket={ticket} onClose={onClose} />);
  return onClose;
}

function mockTicketReads(qrResponse: unknown = CODE, transfers: unknown = []) {
  mockBffGet.mockImplementation((input: unknown) => {
    const path = (input as { path: string }).path;
    const response = path.endsWith('/qr') ? qrResponse : transfers;
    return response instanceof Error ? Promise.reject(response) : Promise.resolve(response);
  });
}

function qrRequestCount() {
  return mockBffGet.mock.calls.filter(([input]) => (input as { path: string }).path.endsWith('/qr'))
    .length;
}

describe('TicketDetailModal entry code', () => {
  it('shows add-on entitlements and their current redemption state', () => {
    renderModal({
      ...TICKET,
      ticketAddons: [
        { id: 'TAE-1', name: 'Parking pass', kind: 'parking', status: 'active' },
        { id: 'TAE-2', name: 'Cloakroom', kind: 'cloakroom', status: 'redeemed' },
      ],
    });

    expect(screen.getByRole('region', { name: 'Ticket extras' })).toBeInTheDocument();
    expect(screen.getByText('Parking pass')).toBeInTheDocument();
    expect(screen.getByText('Cloakroom')).toBeInTheDocument();
    expect(screen.getByText('redeemed')).toBeInTheDocument();
  });

  beforeEach(() => {
    mockBffGet.mockReset();
    mockBffPost.mockReset();
    mockTicketReads();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches the holder's rotating code and renders it as a scannable QR", async () => {
    mockTicketReads();
    renderModal(TICKET);

    expect(
      await screen.findByRole('img', { name: 'Entry code for RSVP Night' }),
    ).toBeInTheDocument();
    expect(mockBffGet).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/tickets/ENT-rsvp-1/qr' }),
    );
    expect(screen.getByText(/Refreshes every 30s/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upgrade ticket' })).toHaveAttribute(
      'href',
      '/checkout/EVT-test-1?upgradeFromEntitlementId=ENT-rsvp-1',
    );
    expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
  });

  it('keeps an unassigned group unit out of admission until its invited holder claims it', async () => {
    mockTicketReads();
    renderModal({ ...TICKET, holderName: 'Unassigned · in your custody', custody: 'unassigned' });

    expect(
      await screen.findByText(/This ticket is unassigned and cannot be used yet/),
    ).toBeInTheDocument();
    expect(qrRequestCount()).toBe(0);
    expect(screen.queryByRole('link', { name: 'Upgrade ticket' })).not.toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Invite an attendee to claim this ticket' }),
    ).toBeInTheDocument();
  });

  it('re-fetches on the interval the gateway asks for', async () => {
    vi.useFakeTimers();
    mockTicketReads();
    renderModal(TICKET);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(qrRequestCount()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_000);
    });
    expect(qrRequestCount()).toBe(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(qrRequestCount()).toBe(2);
  });

  it('stops refreshing once the pass is closed', async () => {
    vi.useFakeTimers();
    mockTicketReads();
    const { unmount } = render(<TicketDetailModal ticket={TICKET} onClose={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(qrRequestCount()).toBe(1);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(qrRequestCount()).toBe(1);
  });

  it('says the code is unavailable instead of showing a placeholder id', async () => {
    mockTicketReads(new Error('gateway down'));
    renderModal(TICKET);

    expect(await screen.findByText(/unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /entry code/i })).not.toBeInTheDocument();

    mockTicketReads();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('img', { name: 'Entry code for RSVP Night' }),
    ).toBeInTheDocument();
    expect(qrRequestCount()).toBe(2);
  });

  it('requests no code for a pass that can no longer admit anyone', () => {
    mockTicketReads();
    renderModal({ ...TICKET, status: 'used' });

    expect(screen.getByText('This ticket has already been used.')).toBeInTheDocument();
    expect(mockBffGet).not.toHaveBeenCalled();
    expect(screen.queryByRole('img', { name: /entry code/i })).not.toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
  });

  it('renders nothing when no pass is selected', () => {
    renderModal(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockBffGet).not.toHaveBeenCalled();
  });

  it('creates a verified-email transfer invitation and reports delivery as unconfirmed', async () => {
    mockTicketReads();
    mockBffPost.mockResolvedValue(TRANSFER);
    renderModal(TICKET);

    fireEvent.change(await screen.findByRole('textbox', { name: 'Recipient email' }), {
      target: { value: 'guest@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer link' }));

    expect(await screen.findByText('Transfer pending')).toBeInTheDocument();
    expect(screen.getByText(/Email delivery cannot be confirmed here/)).toBeInTheDocument();
    expect(mockBffPost).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/tickets/ENT-rsvp-1/transfers',
        body: { recipientEmail: 'guest@example.test' },
      }),
    );
    expect(
      screen.getByRole('link', { name: 'Reopen or share the invitation link' }),
    ).toHaveAttribute('href', `${window.location.origin}/ticket-transfer/TRF-test-1`);
  });

  it('lets the sender cancel the pending transfer and keeps the ticket with them', async () => {
    mockTicketReads();
    mockBffPost
      .mockResolvedValueOnce(TRANSFER)
      .mockResolvedValueOnce({ transfer: { ...TRANSFER, status: 'cancelled' } });
    renderModal(TICKET);

    fireEvent.change(await screen.findByRole('textbox', { name: 'Recipient email' }), {
      target: { value: 'guest@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create transfer link' }));
    expect(await screen.findByText('Transfer pending')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel pending transfer' }));

    expect(
      await screen.findByText('The pending transfer was cancelled. Your ticket remains with you.'),
    ).toBeInTheDocument();
    expect(mockBffPost).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: '/api/ticket-transfers/TRF-test-1/cancel',
        body: {},
      }),
    );
  });

  it('restores a pending invite link after reopening the ticket details', async () => {
    mockTicketReads(CODE, [TRANSFER]);
    renderModal(TICKET);

    expect(await screen.findByText('Transfer pending')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Reopen or share the invitation link' }),
    ).toHaveAttribute('href', `${window.location.origin}/ticket-transfer/TRF-test-1`);
    expect(screen.queryByRole('textbox', { name: 'Recipient email' })).not.toBeInTheDocument();
  });

  it('requests an idempotent resend without claiming email delivery succeeded', async () => {
    mockTicketReads(CODE, [TRANSFER]);
    mockBffPost.mockResolvedValue({ requested: true });
    renderModal(TICKET);

    fireEvent.click(await screen.findByRole('button', { name: 'Resend invitation' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/Email delivery is not confirmed/i);
    const resendInput = mockBffPost.mock.calls
      .map((call) => call[0])
      .find((input) => {
        if (typeof input !== 'object' || input === null || !('path' in input)) return false;
        return input.path === '/api/ticket-transfers/TRF-test-1/resend';
      });
    if (typeof resendInput !== 'object' || resendInput === null || !('headers' in resendInput)) {
      throw new Error('expected a resend request');
    }
    expect(resendInput.headers).toHaveProperty('idempotency-key');
    expect(typeof resendInput.headers['idempotency-key']).toBe('string');
  });

  it('copies the email-bound invitation link for manual delivery', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    mockTicketReads(CODE, [TRANSFER]);
    renderModal(TICKET);

    fireEvent.click(await screen.findByRole('button', { name: 'Copy invitation link' }));

    expect(writeText).toHaveBeenCalledWith(
      `${window.location.origin}/ticket-transfer/${TRANSFER.id}`,
    );
    expect(await screen.findByRole('status')).toHaveTextContent(/invitation link copied/i);
  });
});
