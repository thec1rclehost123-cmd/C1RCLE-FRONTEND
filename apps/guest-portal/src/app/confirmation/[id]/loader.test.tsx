import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ConfirmationPage from './page';

import type { OrderDto } from '@c1rcle/contracts';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));
vi.mock('@c1rcle/api-client', () => ({ createApiClient: () => ({ get: mocks.get }) }));
vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({ getAll: () => [{ name: 'session', value: 'synthetic-owner-session' }] }),
}));
vi.mock('next/navigation', () => ({ notFound: mocks.notFound }));
const order: OrderDto = {
  id: 'order-compensated',
  bookingReference: 'C1-00000-00000-00000-00000',
  eventId: 'event-private',
  organizationId: 'host',
  userId: 'owner',
  status: 'refund_requested',
  fulfillmentState: 'pending',
  lines: [
    {
      tierId: 'tier-original',
      tierName: 'Admission',
      quantity: 1,
      unitPricePaise: 10000,
      subtotalPaise: 10000,
    },
  ],
  currency: 'INR',
  subtotalPaise: 10000,
  discountPaise: 0,
  discountedSubtotalPaise: 10000,
  platformFeePaise: 500,
  paymentFeePaise: 250,
  gstPaise: 135,
  grandTotalPaise: 10885,
  appliedPromoCode: null,
  paymentIntentId: 'order_test_original',
  paymentId: 'pay_test_original',
  paidAt: '2026-11-04T00:00:00Z',
  reservationExpiresAt: '2026-11-04T00:10:00Z',
  failureReason: null,
  eventCancellation: null,
  refundedPaise: 0,
  version: 2,
  createdAt: '2026-11-04T00:00:00Z',
  updatedAt: '2026-11-04T00:00:00Z',
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockReset();
});
describe('owner financial confirmation when public event details are unavailable', () => {
  it('renders refund pending for the authenticated owner despite public event 404 and absent cancellation metadata', async () => {
    mocks.get
      .mockResolvedValueOnce(order)
      .mockRejectedValueOnce(new Error('public event not found'));
    render(await ConfirmationPage({ params: Promise.resolve({ id: order.id }) }));
    expect(screen.getByRole('heading', { name: 'Refund processing' })).toBeInTheDocument();
    expect(screen.getByText('Refund pending')).toBeInTheDocument();
    expect(screen.getByText('Your booking')).toBeInTheDocument();
    expect(screen.getByText(/Event details are unavailable/)).toBeInTheDocument();
    expect(screen.queryByText('Date & Time')).not.toBeInTheDocument();
    expect(screen.queryByText('Venue')).not.toBeInTheDocument();
    expect(screen.queryByText('View in My Tickets')).not.toBeInTheDocument();
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.get).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: `/api/v2/orders/${order.id}`,
        headers: { cookie: 'session=synthetic-owner-session' },
      }),
    );
    expect(mocks.get).toHaveBeenCalledTimes(2);
  });
  it('keeps a rejected buyer-scoped order read as 404 and never probes private event details', async () => {
    mocks.get.mockRejectedValueOnce(new Error('not found'));
    await expect(
      ConfirmationPage({ params: Promise.resolve({ id: 'another-buyers-order' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
    expect(mocks.get).toHaveBeenCalledTimes(1);
  });
});
