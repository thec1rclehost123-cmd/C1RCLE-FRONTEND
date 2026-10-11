import { describe, expect, it, vi } from 'vitest';

import { runPaidCheckout } from './paid-checkout';

import type { PaidCheckoutDeps, PaidCheckoutInput } from './paid-checkout';
import type { RazorpayOutcome } from './razorpay-checkout';

const hold = (grandTotalPaise = 118_000) => ({
  holdId: 'hold_1',
  expiresAt: '2026-10-11T18:00:00.000Z',
  status: 'active' as const,
  convertedOrderId: null,
  pricing: {
    lines: [],
    subtotalPaise: 100_000,
    discountPaise: 0,
    discountedSubtotalPaise: 100_000,
    platformFeePaise: 10_000,
    paymentFeePaise: 2_000,
    gstPaise: 6_000,
    grandTotalPaise,
    appliedPromoCode: null,
    currency: 'INR',
  },
});

const paid: RazorpayOutcome = {
  kind: 'paid',
  paymentId: 'pay_1',
  orderId: 'order_1',
  signature: 'sig_1',
};

function deps(overrides: Partial<PaidCheckoutDeps> = {}): PaidCheckoutDeps {
  return {
    createHold: vi.fn().mockResolvedValue(hold()),
    createAttempt: vi
      .fn()
      .mockResolvedValue({ paymentIntentId: 'order_1', amountPaise: 118_000, keyId: 'rzp_test_x' }),
    openCheckout: vi.fn().mockResolvedValue(paid),
    verify: vi.fn().mockResolvedValue({ order: { id: 'ord_9' }, entitlements: [] }),
    waitForTickets: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

const input: PaidCheckoutInput = {
  eventId: 'evt_1',
  eventTitle: 'Sky Night',
  lines: [{ tierId: 'tier_1', quantity: 2 }],
  expectedTotalPaise: 118_000,
  idempotencyKey: 'attempt-key',
};

describe('runPaidCheckout', () => {
  it('holds, creates the order, opens the widget, verifies, and returns the order id', async () => {
    const d = deps();

    const result = await runPaidCheckout(d, input);

    expect(result).toEqual({ kind: 'confirmed', orderId: 'ord_9' });
    expect(d.createHold).toHaveBeenCalledWith({
      eventId: 'evt_1',
      lines: [{ tierId: 'tier_1', quantity: 2 }],
      idempotencyKey: 'attempt-key-hold',
    });
    expect(d.createAttempt).toHaveBeenCalledWith({
      holdId: 'hold_1',
      idempotencyKey: 'attempt-key-attempt',
    });
    expect(d.openCheckout).toHaveBeenCalledWith({
      keyId: 'rzp_test_x',
      orderId: 'order_1',
      amountPaise: 118_000,
      title: 'C1RCLE',
      description: 'Sky Night',
    });
  });

  it('verifies with the ids the widget returned, not ones the client invented', async () => {
    const d = deps({
      openCheckout: vi.fn().mockResolvedValue({
        kind: 'paid',
        paymentId: 'pay_W',
        orderId: 'order_W',
        signature: 'sig_W',
      }),
    });

    await runPaidCheckout(d, input);

    expect(d.verify).toHaveBeenCalledWith({
      paymentId: 'pay_W',
      holdId: 'hold_1',
      paymentIntentId: 'order_W',
      signature: 'sig_W',
      idempotencyKey: 'attempt-key-verify',
    });
  });

  it('stops before creating a payment when the held price differs from the price shown', async () => {
    const d = deps({ createHold: vi.fn().mockResolvedValue(hold(130_000)) });

    const result = await runPaidCheckout(d, input);

    expect(result).toEqual({ kind: 'price_changed', grandTotalPaise: 130_000 });
    expect(d.createAttempt).not.toHaveBeenCalled();
    expect(d.openCheckout).not.toHaveBeenCalled();
  });

  it('reports payments as unavailable when the server cannot take them (503)', async () => {
    const d = deps({ createAttempt: vi.fn().mockRejectedValue({ status: 503, code: 'server' }) });

    expect(await runPaidCheckout(d, input)).toEqual({ kind: 'unavailable' });
    expect(d.openCheckout).not.toHaveBeenCalled();
  });

  it('never opens the widget without a publishable key', async () => {
    const d = deps({
      createAttempt: vi
        .fn()
        .mockResolvedValue({ paymentIntentId: 'order_1', amountPaise: 118_000 }),
    });

    expect(await runPaidCheckout(d, input)).toEqual({ kind: 'unavailable' });
    expect(d.openCheckout).not.toHaveBeenCalled();
  });

  it('explains a sold-out conflict, and a generic failure, without leaking details', async () => {
    const conflict = deps({
      createHold: vi.fn().mockRejectedValue({ status: 409, code: 'conflict' }),
    });
    expect(await runPaidCheckout(conflict, input)).toEqual({
      kind: 'error',
      message: 'Those tickets are no longer available. Go back and choose again.',
    });

    const boom = deps({ createHold: vi.fn().mockRejectedValue(new Error('SQL exploded')) });
    const result = await runPaidCheckout(boom, input);
    expect(result).toEqual({
      kind: 'error',
      message: 'We could not start your payment. Please try again.',
    });
  });

  it('treats closing the widget as a cancellation and keeps the failure reason', async () => {
    const closed = deps({ openCheckout: vi.fn().mockResolvedValue({ kind: 'dismissed' }) });
    expect(await runPaidCheckout(closed, input)).toEqual({ kind: 'cancelled' });
    expect(closed.verify).not.toHaveBeenCalled();

    const declined = deps({
      openCheckout: vi.fn().mockResolvedValue({ kind: 'dismissed', lastFailure: 'Card declined' }),
    });
    expect(await runPaidCheckout(declined, input)).toEqual({
      kind: 'cancelled',
      reason: 'Card declined',
    });
  });

  it('reports a widget that cannot load as an error, not a cancellation', async () => {
    const d = deps({ openCheckout: vi.fn().mockRejectedValue(new Error('script blocked')) });

    expect(await runPaidCheckout(d, input)).toEqual({
      kind: 'error',
      message: 'The payment window could not be opened. Please try again.',
    });
  });

  it('after a paid but unconfirmed payment, says "processing" and waits for the webhook', async () => {
    const d = deps({
      verify: vi.fn().mockRejectedValue(new Error('timeout')),
      waitForTickets: vi.fn().mockResolvedValue(true),
    });

    expect(await runPaidCheckout(d, input)).toEqual({ kind: 'processing', ticketsReady: true });
    expect(d.waitForTickets).toHaveBeenCalledWith('evt_1');
  });

  it('never reports a failure once the buyer has paid, even if the tickets never appear', async () => {
    const d = deps({
      verify: vi.fn().mockRejectedValue({ status: 400, code: 'validation' }),
      waitForTickets: vi.fn().mockResolvedValue(false),
    });

    expect(await runPaidCheckout(d, input)).toEqual({ kind: 'processing', ticketsReady: false });
  });

  it('passes the buyer’s details to the widget only as prefill', async () => {
    const d = deps();

    await runPaidCheckout(d, { ...input, prefill: { name: 'A Buyer', email: 'b@example.com' } });

    expect(d.openCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ prefill: { name: 'A Buyer', email: 'b@example.com' } }),
    );
  });
});
