import { describe, expect, it, vi } from 'vitest';

import { pollAuthoritativePaymentStatus } from './payment-recovery-poll';

import type { PaymentRecoveryResponse } from '@c1rcle/contracts';

const status = (
  state: PaymentRecoveryResponse['status'],
  orderId: string | null = null,
): PaymentRecoveryResponse => ({
  holdId: 'hold_1',
  eventId: 'evt_1',
  status: state,
  orderId,
  expiresAt: '2026-10-15T20:00:00.000Z',
  updatedAt: '2026-10-15T19:59:00.000Z',
});

describe('pollAuthoritativePaymentStatus', () => {
  it('stops on fulfilment after a webhook updates backend state', async () => {
    const read = vi
      .fn<() => Promise<PaymentRecoveryResponse | null>>()
      .mockResolvedValueOnce(status('processing'))
      .mockResolvedValueOnce(status('fulfilled', 'ord_1'));
    const pause = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollAuthoritativePaymentStatus({ read, pause }, 'evt_1', vi.fn()),
    ).resolves.toEqual(status('fulfilled', 'ord_1'));
    expect(read).toHaveBeenCalledTimes(2);
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('returns the last safe processing state after its bounded timeout', async () => {
    const read = vi.fn().mockResolvedValue(status('processing'));
    const pause = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollAuthoritativePaymentStatus({ read, pause }, 'evt_1', vi.fn(), 3),
    ).resolves.toEqual(status('processing'));
    expect(read).toHaveBeenCalledTimes(3);
    expect(pause).toHaveBeenCalledTimes(2);
  });

  it('reconciles one captured payment after the read-only status reports processing', async () => {
    const read = vi
      .fn<() => Promise<PaymentRecoveryResponse | null>>()
      .mockResolvedValueOnce(status('processing'))
      .mockResolvedValueOnce(status('fulfilled', 'ord_1'));
    const reconcile = vi.fn().mockResolvedValue(status('fulfilled', 'ord_1'));
    const pause = vi.fn().mockResolvedValue(undefined);

    await expect(
      pollAuthoritativePaymentStatus({ read, reconcile, pause }, 'evt_1', vi.fn()),
    ).resolves.toEqual(status('fulfilled', 'ord_1'));
    expect(reconcile).toHaveBeenCalledTimes(1);
    expect(read).toHaveBeenCalledTimes(1);
    expect(pause).not.toHaveBeenCalled();
  });

  it.each(['failed', 'cancelled', 'expired', 'refunded', 'requires_support'] as const)(
    'stops immediately on terminal state %s',
    async (terminal) => {
      const read = vi.fn().mockResolvedValue(status(terminal));
      const pause = vi.fn().mockResolvedValue(undefined);

      await expect(
        pollAuthoritativePaymentStatus({ read, pause }, 'evt_1', vi.fn()),
      ).resolves.toEqual(status(terminal));
      expect(read).toHaveBeenCalledTimes(1);
      expect(pause).not.toHaveBeenCalled();
    },
  );
});
