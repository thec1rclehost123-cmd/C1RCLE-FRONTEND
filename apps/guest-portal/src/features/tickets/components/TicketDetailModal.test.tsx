import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TicketDetailModal } from './TicketDetailModal';

import type { UserTicketItem } from '../types/tickets.types';

const mockBffGet = vi.fn<(...args: readonly unknown[]) => Promise<unknown>>();

vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { get: (...args: unknown[]) => mockBffGet(...args) },
}));

const CODE = {
  qrPayload: 'ENT-rsvp-1:1791800000:deadbeefdeadbeef',
  expiresAt: '2026-12-10T12:00:30.000Z',
  refreshIntervalSec: 30,
};

const TICKET: UserTicketItem = {
  id: 'ENT-rsvp-1',
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
};

function renderModal(ticket: UserTicketItem | null, onClose = vi.fn()) {
  render(<TicketDetailModal ticket={ticket} onClose={onClose} />);
  return onClose;
}

describe('TicketDetailModal entry code', () => {
  beforeEach(() => {
    mockBffGet.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches the holder's rotating code and renders it as a scannable QR", async () => {
    mockBffGet.mockResolvedValue(CODE);
    renderModal(TICKET);

    expect(
      await screen.findByRole('img', { name: 'Entry code for RSVP Night' }),
    ).toBeInTheDocument();
    expect(mockBffGet).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/tickets/ENT-rsvp-1/qr' }),
    );
    expect(screen.getByText(/Refreshes every 30s/)).toBeInTheDocument();
    expect(screen.queryByText(/unavailable/i)).not.toBeInTheDocument();
  });

  it('re-fetches on the interval the gateway asks for', async () => {
    vi.useFakeTimers();
    mockBffGet.mockResolvedValue(CODE);
    renderModal(TICKET);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockBffGet).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_000);
    });
    expect(mockBffGet).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(mockBffGet).toHaveBeenCalledTimes(2);
  });

  it('stops refreshing once the pass is closed', async () => {
    vi.useFakeTimers();
    mockBffGet.mockResolvedValue(CODE);
    const { unmount } = render(<TicketDetailModal ticket={TICKET} onClose={vi.fn()} />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockBffGet).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(mockBffGet).toHaveBeenCalledTimes(1);
  });

  it('says the code is unavailable instead of showing a placeholder id', async () => {
    mockBffGet.mockRejectedValue(new Error('gateway down'));
    renderModal(TICKET);

    expect(await screen.findByText(/unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /entry code/i })).not.toBeInTheDocument();

    mockBffGet.mockResolvedValue(CODE);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('img', { name: 'Entry code for RSVP Night' }),
    ).toBeInTheDocument();
    expect(mockBffGet).toHaveBeenCalledTimes(2);
  });

  it('requests no code for a pass that can no longer admit anyone', () => {
    mockBffGet.mockResolvedValue(CODE);
    renderModal({ ...TICKET, status: 'used' });

    expect(screen.getByText('This pass has already been used at the door.')).toBeInTheDocument();
    expect(mockBffGet).not.toHaveBeenCalled();
    expect(screen.queryByRole('img', { name: /entry code/i })).not.toBeInTheDocument();
    expect(screen.getByText('CHECKED IN')).toBeInTheDocument();
  });

  it('renders nothing when no pass is selected', () => {
    renderModal(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockBffGet).not.toHaveBeenCalled();
  });
});
