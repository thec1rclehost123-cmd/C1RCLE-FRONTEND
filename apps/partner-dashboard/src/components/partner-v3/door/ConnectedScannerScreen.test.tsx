import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedScannerScreen } from './ConnectedScannerScreen';

const mockBffPost = vi.fn<(...args: readonly unknown[]) => Promise<unknown>>();

vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { post: (options: unknown) => mockBffPost(options) },
}));

const startShift = {
  sessionId: 'sess_1',
  sessionToken: 'scanner-secret',
  sessionExpiresAt: '2026-10-28T22:00:00.000Z',
  event: {
    id: 'evt_1',
    title: 'Night Out',
    slug: 'night-out',
    venueId: 'venue_1',
    startAt: '2026-10-28T20:00:00.000Z',
    endAt: null,
    status: 'published',
    capacity: 100,
  },
  permissions: { canScan: true, canDoorEntry: true, canWalkIn: false, canCharge: false },
  gate: 'Front',
  tiers: [],
  stats: {
    eventId: 'evt_1',
    occupancy: { inside: 0, capacity: 100, remaining: 100, prebooked: 0, doorEntries: 0 },
    byEntryType: {},
    scans: {
      total: 0,
      consumed: 0,
      denied: 0,
      pending: 0,
      revoked: 0,
      expired: 0,
      cancelled: 0,
      overridden: 0,
    },
    doorSales: { count: 0, grossPaise: 0 },
    coverWallet: {
      activeWallets: 0,
      totalBalancePaise: 0,
      totalCreditsPaise: 0,
      totalDebitsPaise: 0,
    },
    generatedAt: '2026-10-28T19:00:00.000Z',
  },
  device: { deviceId: 'device_1', deviceName: 'Door device' },
};

describe('ConnectedScannerScreen', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockBffPost.mockReset();
  });

  it('requires the operator to verify each holder before restricted admission', async () => {
    mockBffPost
      .mockResolvedValueOnce(startShift)
      .mockResolvedValueOnce({
        status: 'valid',
        denyReason: null,
        denyMessage: null,
        entitlement: {
          id: 'ent_1',
          tierId: 'tier_1',
          tierName: 'Student',
          holderName: 'Guest',
          scansUsed: 0,
          scansAllowed: 1,
          status: 'valid',
          eligibilityPolicy: { audienceType: 'STUDENT', minAge: null, maxAge: null },
        },
      })
      .mockRejectedValueOnce(new Error('Temporary scanner failure.'))
      .mockResolvedValueOnce({ status: 'consumed', checkInId: 'scan_1' });

    render(
      <ConnectedScannerScreen
        studio="venue"
        eventId="evt_1"
        organizationId="org_1"
        eventTitle="Night Out"
      />,
    );

    fireEvent.change(screen.getByLabelText('Event door code'), { target: { value: 'DOORCODE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start scanner shift' }));
    await screen.findByText(/Scanner shift active/);
    fireEvent.change(screen.getByLabelText('Ticket QR payload'), {
      target: { value: 'ticket-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check ticket' }));
    await screen.findByText(/Eligibility check: STUDENT/);

    const admit = screen.getByRole('button', { name: 'Admit ticket' });
    expect(admit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(admit);
    await screen.findByRole('alert');
    fireEvent.click(admit);
    await screen.findByText('Admission recorded');

    await waitFor(() => {
      expect(mockBffPost).toHaveBeenCalledTimes(4);
    });
    const firstAttempt = mockBffPost.mock.calls[2]?.[0] as {
      body: Record<string, unknown>;
    };
    const retry = mockBffPost.mock.calls[3]?.[0] as {
      body: Record<string, unknown>;
    };
    expect(firstAttempt.body).toMatchObject({
      operation: 'scan',
      eligibilityVerified: true,
    });
    expect(retry.body['idempotencyKey']).toBe(firstAttempt.body['idempotencyKey']);
  });

  it('redeems an active ticket extra through the scanner session', async () => {
    mockBffPost
      .mockResolvedValueOnce(startShift)
      .mockResolvedValueOnce({
        status: 'valid',
        denyReason: null,
        denyMessage: null,
        entitlement: {
          id: 'ent_1',
          tierId: 'tier_1',
          tierName: 'General',
          holderName: 'Guest',
          scansUsed: 0,
          scansAllowed: 1,
          status: 'valid',
          ticketAddons: [
            {
              id: 'addon_ent_1',
              addonId: 'addon_1',
              name: 'Parking',
              kind: 'parking',
              unitPricePaise: 500,
              status: 'active',
              createdAt: '2026-10-28T19:00:00.000Z',
              redeemedAt: null,
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        entitlementId: 'ent_1',
        addon: {
          id: 'addon_ent_1',
          addonId: 'addon_1',
          name: 'Parking',
          kind: 'parking',
          unitPricePaise: 500,
          status: 'redeemed',
          createdAt: '2026-10-28T19:00:00.000Z',
          redeemedAt: '2026-10-28T19:30:00.000Z',
        },
      });

    render(
      <ConnectedScannerScreen
        studio="venue"
        eventId="evt_1"
        organizationId="org_1"
        eventTitle="Night Out"
      />,
    );

    fireEvent.change(screen.getByLabelText('Event door code'), { target: { value: 'DOORCODE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start scanner shift' }));
    await screen.findByText(/Scanner shift active/);
    fireEvent.change(screen.getByLabelText('Ticket QR payload'), {
      target: { value: 'ticket-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check ticket' }));
    await screen.findByText('Parking · active');
    fireEvent.click(screen.getByRole('button', { name: 'Redeem extra' }));
    await screen.findByText('Parking · redeemed');

    const redemption = mockBffPost.mock.calls[2]?.[0] as {
      body: Record<string, unknown>;
      path: string;
      retries: number;
    };
    expect(redemption).toMatchObject({
      path: '/api/bff/door',
      retries: 0,
      body: {
        operation: 'redeemAddon',
        eventId: 'evt_1',
        entitlementId: 'ent_1',
        addonEntitlementId: 'addon_ent_1',
      },
    });
    expect(redemption.body['idempotencyKey']).toBeTruthy();
  });
});
