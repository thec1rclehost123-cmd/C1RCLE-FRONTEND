import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CheckoutView } from './CheckoutView';

import type { PaidCheckoutDeps } from '../payment/paid-checkout';
import type { BookingEventFixture } from '../types/booking.types';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  fetchQuote: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  deps: {} as PaidCheckoutDeps,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/bff/bff-client', () => ({ bffClient: { post: vi.fn(), get: vi.fn() } }));

vi.mock('../payment/checkout-api', () => ({
  fetchQuote: (...args: unknown[]) => mocks.fetchQuote(...args),
  get paidCheckoutDeps() {
    return mocks.deps;
  },
}));

const quote = (grandTotalPaise = 118_000) => ({
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
});

const LIVE_EVENT: BookingEventFixture = {
  id: 'sky-night',
  eventId: 'evt_1',
  title: 'Sky Night',
  category: 'Music',
  image: 'https://example.com/poster.jpg',
  accentTone: 'purple',
  startsAt: '2026-09-18T19:30:00.000Z',
  venue: 'Skyline Social',
  address: 'Pune',
  city: 'Pune',
  doorNote: 'Entry rules are set by the host.',
  purchasable: true,
  ticketTiers: [
    {
      id: 'tier_1',
      name: 'General',
      description: 'Entry',
      price: { amountPaise: 100_000, currency: 'INR' },
      maximumQuantity: 4,
    },
  ],
};

function deps(overrides: Partial<PaidCheckoutDeps> = {}): PaidCheckoutDeps {
  return {
    createHold: vi.fn().mockResolvedValue({
      holdId: 'hold_1',
      expiresAt: '2026-10-11T18:00:00.000Z',
      status: 'active',
      convertedOrderId: null,
      pricing: quote(),
    }),
    createAttempt: vi
      .fn()
      .mockResolvedValue({ paymentIntentId: 'order_1', amountPaise: 118_000, keyId: 'rzp_test_x' }),
    openCheckout: vi
      .fn()
      .mockResolvedValue({ kind: 'paid', paymentId: 'pay_1', orderId: 'order_1', signature: 's' }),
    verify: vi.fn().mockResolvedValue({ order: { id: 'ord_9' }, entitlements: [] }),
    waitForTickets: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

function toPaymentStep(event: BookingEventFixture = LIVE_EVENT) {
  render(<CheckoutView event={event} initialTierId="tier_1" />);
  fireEvent.click(screen.getByRole('button', { name: 'Continue to details →' }));
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'A Buyer' } });
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'b@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: 'Proceed to payment →' }));
}

beforeEach(() => {
  mocks.push.mockReset();
  mocks.fetchQuote.mockReset().mockResolvedValue(quote());
  mocks.deps = deps();
});

describe('paid checkout step', () => {
  it('prices the selection on the server and shows its fees and GST, not an estimate', async () => {
    toPaymentStep();

    expect(await screen.findByRole('button', { name: 'Pay ₹1,180 →' })).toBeEnabled();
    expect(mocks.fetchQuote).toHaveBeenCalledWith({
      eventId: 'evt_1',
      lines: [{ tierId: 'tier_1', quantity: 1 }],
    });
    expect(screen.getByText('Fees')).toBeInTheDocument();
    expect(screen.getByText('GST on fees')).toBeInTheDocument();
    expect(screen.queryByText('Fees (estimate)')).not.toBeInTheDocument();
  });

  it('keeps Pay disabled until the quote arrives', () => {
    mocks.fetchQuote.mockReturnValue(new Promise(() => undefined));
    toPaymentStep();

    expect(screen.getByRole('button', { name: 'Pay →' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Calculating your total');
  });

  it('pays through the widget and goes to the real confirmation for the verified order', async () => {
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180 →' }));

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith('/confirmation/ord_9');
    });
    expect(mocks.deps.openCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        keyId: 'rzp_test_x',
        orderId: 'order_1',
        amountPaise: 118_000,
        prefill: { name: 'A Buyer', email: 'b@example.com' },
      }),
    );
  });

  it('uses one idempotency key per attempt, so retrying replays the same hold', async () => {
    mocks.deps = deps({ openCheckout: vi.fn().mockResolvedValue({ kind: 'dismissed' }) });
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180 →' }));
    await screen.findByText(/Payment cancelled/);
    fireEvent.click(screen.getByRole('button', { name: 'Pay ₹1,180 →' }));
    await waitFor(() => {
      expect(mocks.deps.createHold).toHaveBeenCalledTimes(2);
    });

    const [first, second] = vi.mocked(mocks.deps.createHold).mock.calls;
    expect(first?.[0].idempotencyKey).toBe(second?.[0].idempotencyKey);
  });

  it('shows the reason and lets the buyer retry after a cancelled or declined payment', async () => {
    mocks.deps = deps({
      openCheckout: vi.fn().mockResolvedValue({ kind: 'dismissed', lastFailure: 'Card declined' }),
    });
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180 →' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Card declined');
    expect(screen.getByRole('button', { name: 'Pay ₹1,180 →' })).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('re-quotes and asks again when the held price differs from the one shown', async () => {
    mocks.deps = deps({
      createHold: vi.fn().mockResolvedValue({
        holdId: 'hold_1',
        expiresAt: '2026-10-11T18:00:00.000Z',
        status: 'active',
        convertedOrderId: null,
        pricing: quote(130_000),
      }),
    });
    mocks.fetchQuote.mockResolvedValueOnce(quote(118_000)).mockResolvedValueOnce(quote(130_000));
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180 →' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The price changed to ₹1,300');
    expect(await screen.findByRole('button', { name: 'Pay ₹1,300 →' })).toBeEnabled();
    expect(mocks.deps.openCheckout).not.toHaveBeenCalled();
  });

  it('tells a buyer who paid but is not yet confirmed that they have not been charged twice', async () => {
    mocks.deps = deps({ verify: vi.fn().mockRejectedValue(new Error('timeout')) });
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180 →' }));

    expect(await screen.findByText(/Payment received/)).toHaveTextContent('not be charged again');
    expect(screen.getByRole('link', { name: 'My Tickets' })).toHaveAttribute('href', '/tickets');
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('sends the buyer to My Tickets when the webhook confirmed while waiting', async () => {
    mocks.deps = deps({
      verify: vi.fn().mockRejectedValue(new Error('timeout')),
      waitForTickets: vi.fn().mockResolvedValue(true),
    });
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180 →' }));

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith('/tickets');
    });
  });

  it('says so, and offers no payment, when the quote cannot be fetched', async () => {
    mocks.fetchQuote.mockRejectedValue(new Error('401'));
    toPaymentStep();

    expect(await screen.findByRole('alert')).toHaveTextContent('could not price your order');
    expect(screen.getByRole('button', { name: 'Pay →' })).toBeDisabled();
  });

  it('never offers real payment for an event that is only a preview', () => {
    toPaymentStep({ ...LIVE_EVENT, purchasable: false });

    expect(screen.getByText('Preview only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Pay/ })).not.toBeInTheDocument();
    expect(mocks.fetchQuote).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Complete Payment →' })).toHaveAttribute(
      'href',
      '/confirmation/preview-sky-night',
    );
  });
});
