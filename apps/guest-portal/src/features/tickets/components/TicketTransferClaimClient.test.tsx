import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TicketTransferClaimClient } from './TicketTransferClaimClient';

const { mockPost, mockReplace, mockUseSession } = vi.hoisted(() => ({
  mockPost: vi.fn<(...args: readonly unknown[]) => Promise<unknown>>(),
  mockReplace: vi.fn(),
  mockUseSession: vi.fn<() => { isAuthenticated: boolean; isLoading: boolean }>(),
}));

vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { post: (...args: unknown[]) => mockPost(...args) },
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
vi.mock('@c1rcle/auth', () => ({ useSession: () => mockUseSession() }));

const ACCEPTED = {
  transfer: {
    id: 'TRF-test-1',
    entitlementId: 'ENT-test-1',
    eventId: 'EVT-test-1',
    status: 'accepted',
    expiresAt: '2026-12-10T12:00:00.000Z',
    acceptedAt: '2026-12-10T11:05:00.000Z',
    resolvedAt: '2026-12-10T11:05:00.000Z',
    version: 2,
    createdAt: '2026-12-10T11:00:00.000Z',
    updatedAt: '2026-12-10T11:05:00.000Z',
  },
  entitlement: { id: 'ENT-test-1' },
};

describe('TicketTransferClaimClient', () => {
  it('requires sign-in before showing an explicit accept action', () => {
    mockUseSession.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(<TicketTransferClaimClient transferId="TRF-test-1" />);

    expect(screen.getByRole('link', { name: 'Sign in to continue' })).toHaveAttribute(
      'href',
      '/login?next=%2Fticket-transfer%2FTRF-test-1',
    );
    expect(screen.queryByRole('button', { name: 'Accept ticket' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Decline invitation' })).not.toBeInTheDocument();
  });

  it('accepts only after an explicit click and reports QR rotation', async () => {
    mockUseSession.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockPost.mockResolvedValue(ACCEPTED);
    render(<TicketTransferClaimClient transferId="TRF-test-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept ticket' }));

    expect(await screen.findByText(/previous entry code has been replaced/i)).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/ticket-transfers/TRF-test-1/accept',
        body: {},
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'View my tickets' }));
    expect(mockReplace).toHaveBeenCalledWith('/tickets');
  });

  it('does not reveal whether a transfer id exists when email binding fails', async () => {
    mockUseSession.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockPost.mockRejectedValue(new Error('not found'));
    render(<TicketTransferClaimClient transferId="TRF-test-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept ticket' }));

    expect(
      await screen.findByText(
        'This invitation is unavailable or does not match your verified account.',
      ),
    ).toBeInTheDocument();
  });

  it('lets the authenticated invited recipient decline while leaving ownership unchanged', async () => {
    mockUseSession.mockReturnValue({ isAuthenticated: true, isLoading: false });
    mockPost.mockResolvedValue({
      transfer: { ...ACCEPTED.transfer, status: 'declined', acceptedAt: null },
    });
    render(<TicketTransferClaimClient transferId="TRF-test-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'Decline invitation' }));

    expect(await screen.findByText(/ticket stays with its current holder/i)).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/ticket-transfers/TRF-test-1/decline',
        body: {},
      }),
    );
  });
});
