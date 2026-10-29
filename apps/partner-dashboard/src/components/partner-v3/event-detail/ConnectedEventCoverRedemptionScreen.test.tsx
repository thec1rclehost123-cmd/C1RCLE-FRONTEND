import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedEventCoverRedemptionScreen } from './ConnectedEventCoverRedemptionScreen';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock('@/lib/api/client', () => ({ apiClient: mocks }));

describe('ConnectedEventCoverRedemptionScreen', () => {
  beforeEach(() => vi.clearAllMocks());

  it('collects the ticket, terminal and Guest-confirmed purchase details without claiming activation', () => {
    render(
      <ConnectedEventCoverRedemptionScreen
        studio="venue"
        eventId="evt_1"
        eventTitle="Sky Night"
        organizationId="venue_org_1"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Venue cover redemption' })).toBeInTheDocument();
    expect(screen.getByLabelText('Ticket entitlement ID')).toBeRequired();
    expect(screen.getByLabelText('Venue terminal ID')).toBeRequired();
    expect(screen.getByLabelText('Cover to use (₹)')).toBeRequired();
    expect(screen.getByRole('button', { name: 'Request Guest confirmation' })).toBeInTheDocument();
    expect(screen.getByText(/Each redemption is linked to one Guest ticket/)).toBeInTheDocument();
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('recovers a committed challenge after an ambiguous create response', async () => {
    vi.spyOn(crypto.subtle, 'digest').mockResolvedValue(new Uint8Array(32).fill(0xab).buffer);
    mocks.post.mockRejectedValueOnce(new Error('connection lost after write'));
    mocks.get.mockResolvedValueOnce({
      id: `COV-CH-${'ab'.repeat(16)}`,
      entitlementId: 'ent_1',
      eventId: 'evt_1',
      amountPaise: 1000,
      grossSpendPaise: 1500,
      categories: ['food'],
      status: 'pending',
      expiresAt: '2026-11-01T20:00:00.000Z',
    });
    render(
      <ConnectedEventCoverRedemptionScreen
        studio="venue"
        eventId="evt_1"
        eventTitle="Sky Night"
        organizationId="venue_org_1"
      />,
    );
    fireEvent.change(screen.getByLabelText('Ticket entitlement ID'), {
      target: { value: 'ent_1' },
    });
    fireEvent.change(screen.getByLabelText('Venue terminal ID'), {
      target: { value: 'terminal_1' },
    });
    fireEvent.change(screen.getByLabelText('Cover to use (₹)'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Purchase total (₹)'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Product categories'), { target: { value: 'food' } });
    fireEvent.change(screen.getByLabelText('Receipt reference'), {
      target: { value: 'receipt_1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Request Guest confirmation' }));

    await waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith(
        expect.objectContaining({
          path: `/api/v2/event-cover/redemption-challenges/COV-CH-${'ab'.repeat(16)}`,
          headers: { 'x-organization-id': 'venue_org_1' },
        }),
      );
    });
    expect(await screen.findByText('Confirmation: pending')).toBeInTheDocument();
    expect(
      await screen.findByText(/Recovered the existing Guest confirmation request/),
    ).toBeInTheDocument();
  });
});
