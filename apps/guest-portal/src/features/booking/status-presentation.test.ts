import { describe, expect, it } from 'vitest';

import { getOrderStatusPresentation } from './status-presentation';

describe('getOrderStatusPresentation', () => {
  it('only grants ticket access to paid orders', () => {
    expect(getOrderStatusPresentation('paid').ticketAccess).toBe(true);
    for (const status of [
      'pending',
      'awaiting_payment',
      'expired',
      'cancelled',
      'failed',
      'refund_requested',
      'refunded',
    ] as const) {
      expect(getOrderStatusPresentation(status).ticketAccess).toBe(false);
    }
  });

  it('does not present a failed payment as confirmed', () => {
    expect(getOrderStatusPresentation('failed')).toMatchObject({
      heading: 'Payment failed',
      label: 'Failed',
      tone: 'danger',
    });
  });
  it('does not confirm a financially paid order after every original admission was refunded', () => {
    expect(getOrderStatusPresentation('paid', 'complete', 'all')).toMatchObject({
      heading: 'Admissions refunded',
      label: 'Admissions refunded',
      ticketAccess: false,
    });
  });
  it('retains access to unaffected admissions while clearly reporting a partial admission refund', () => {
    expect(getOrderStatusPresentation('paid', 'complete', 'partial')).toMatchObject({
      label: 'Partially refunded',
      ticketAccess: true,
    });
  });
});
