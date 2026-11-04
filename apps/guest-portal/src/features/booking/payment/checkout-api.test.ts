import { afterEach, describe, expect, it, vi } from 'vitest';

import { bffClient } from '@/lib/bff/bff-client';

import { paidCheckoutDeps } from './checkout-api';

vi.mock('@/lib/bff/bff-client', () => ({ bffClient: { get: vi.fn() } }));

afterEach(() => vi.useRealTimers());

describe('payment fulfillment recovery', () => {
  it.each([
    ['pending', 'hold_current', false],
    ['fulfilled', 'hold_old', false],
    ['fulfilled', 'hold_current', true],
  ])('checks %s against %s rather than an older event ticket', async (status, holdId, expected) => {
    vi.useFakeTimers();
    vi.mocked(bffClient.get).mockImplementation(({ path }) => {
      if (path === '/api/wallet/tickets') return Promise.resolve({ items: [{ eventId: 'evt_1' }] });
      return Promise.resolve({
        holdId,
        eventId: 'evt_1',
        status,
        orderId: status === 'fulfilled' ? 'order_current' : null,
      });
    });
    const result = paidCheckoutDeps.waitForTickets('evt_1', 'hold_current');
    await vi.runAllTimersAsync();
    expect(await result).toBe(expected);
  });
});
