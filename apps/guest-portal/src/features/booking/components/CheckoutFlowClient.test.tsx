import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CheckoutView } from './CheckoutView';

import type { PaidCheckoutDeps } from '../payment/paid-checkout';
import type { BookingEventFixture } from '../types/booking.types';

const mocks = vi.hoisted(() => {
  const push = vi.fn();
  return {
    push,
    router: { push },
    fetchQuote: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    pollPaymentRecovery: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    clearPaymentRecovery: vi.fn<() => Promise<void>>(),
    deps: {} as PaidCheckoutDeps,
  };
});

vi.mock('@c1rcle/auth', () => ({
  useSession: () => ({ user: { displayName: 'A Buyer', email: 'b@example.com' } }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mocks.router,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/lib/bff/bff-client', () => ({ bffClient: { post: vi.fn(), get: vi.fn() } }));

vi.mock('../payment/checkout-api', () => ({
  fetchQuote: (...args: unknown[]) => mocks.fetchQuote(...args),
  pollPaymentRecovery: (...args: unknown[]) => mocks.pollPaymentRecovery(...args),
  clearPaymentRecovery: () => mocks.clearPaymentRecovery(),
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
  fireEvent.click(screen.getByRole('button', { name: 'Review order →' }));
  expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();
}

beforeEach(() => {
  mocks.push.mockReset();
  mocks.fetchQuote.mockReset().mockResolvedValue(quote());
  mocks.pollPaymentRecovery.mockReset().mockResolvedValue(null);
  mocks.clearPaymentRecovery.mockReset().mockResolvedValue(undefined);
  mocks.deps = deps();
});

describe('paid checkout step', () => {
  it('recovers a fulfilled payment after refresh without creating a new hold or attempt', async () => {
    mocks.pollPaymentRecovery.mockImplementation((_eventId, onStatus) => {
      const status = {
        holdId: 'hold_1',
        eventId: 'evt_1',
        status: 'fulfilled',
        orderId: 'ord_recovered',
        expiresAt: '2026-10-15T20:00:00.000Z',
        updatedAt: '2026-10-15T19:59:00.000Z',
      };
      (onStatus as (value: typeof status) => void)(status);
      return Promise.resolve(status);
    });

    render(<CheckoutView event={LIVE_EVENT} initialTierId="tier_1" />);

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith('/confirmation/ord_recovered');
    });
    expect(mocks.deps.createHold).not.toHaveBeenCalled();
    expect(mocks.deps.createAttempt).not.toHaveBeenCalled();
    expect(mocks.clearPaymentRecovery).toHaveBeenCalledTimes(1);
  });

  it('keeps a timed-out recovered payment in a safe processing state', async () => {
    mocks.pollPaymentRecovery.mockImplementation((_eventId, onStatus) => {
      const status = {
        holdId: 'hold_1',
        eventId: 'evt_1',
        status: 'processing',
        orderId: null,
        expiresAt: '2026-10-15T20:00:00.000Z',
        updatedAt: '2026-10-15T19:59:00.000Z',
      };
      (onStatus as (value: typeof status) => void)(status);
      return Promise.resolve(status);
    });

    toPaymentStep();

    expect(await screen.findByText(/safely refresh and check again/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Pay/ })).toBeDisabled();
    expect(mocks.deps.createHold).not.toHaveBeenCalled();
    expect(mocks.deps.createAttempt).not.toHaveBeenCalled();
  });

  it('prices the selection on the server and shows its fees and GST, not an estimate', async () => {
    toPaymentStep();

    expect(await screen.findByRole('button', { name: 'Pay ₹1,180' })).toBeEnabled();
    expect(mocks.fetchQuote).toHaveBeenCalledWith({
      eventId: 'evt_1',
      lines: [{ tierId: 'tier_1', quantity: 1 }],
    });
    expect(screen.getByText('Fees and taxes')).toBeInTheDocument();
    expect(screen.getByText('GST on fees')).toBeInTheDocument();
    expect(screen.queryByText('Fees (estimate)')).not.toBeInTheDocument();
  });

  it('re-prices with an entered promo and shows authoritative application', async () => {
    mocks.fetchQuote.mockResolvedValueOnce(quote()).mockResolvedValueOnce({
      ...quote(100_000),
      discountPaise: 18_000,
      appliedPromoCode: 'NIGHT',
    });
    toPaymentStep();

    await screen.findByRole('button', { name: 'Pay ₹1,180' });
    fireEvent.change(screen.getByPlaceholderText('Enter code'), { target: { value: 'NIGHT' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(await screen.findByText('Promo NIGHT applied.')).toBeInTheDocument();
    expect(mocks.fetchQuote).toHaveBeenLastCalledWith({
      eventId: 'evt_1',
      lines: [{ tierId: 'tier_1', quantity: 1 }],
      promoCode: 'NIGHT',
    });
  });

  it('explains that a failed promo quote must be removed or corrected before payment', async () => {
    mocks.fetchQuote
      .mockResolvedValueOnce(quote())
      .mockRejectedValueOnce(new Error('invalid promo'));
    toPaymentStep();

    await screen.findByRole('button', { name: 'Pay ₹1,180' });
    fireEvent.change(screen.getByPlaceholderText('Enter code'), { target: { value: 'NOT-VALID' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(
      await screen.findByText(/promo could not be applied.*clear the code.*retry/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay securely' })).toBeDisabled();
    expect(mocks.deps.createHold).not.toHaveBeenCalled();
    expect(mocks.deps.createAttempt).not.toHaveBeenCalled();
  });

  it('keeps Pay disabled until the quote arrives', () => {
    mocks.fetchQuote.mockReturnValue(new Promise(() => undefined));
    toPaymentStep();

    expect(screen.getByRole('button', { name: 'Pay securely' })).toBeDisabled();
    expect(screen.getByText('Calculating your total…')).toBeInTheDocument();
    expect(screen.queryByText('₹1,050')).not.toBeInTheDocument();
    expect(screen.queryByText('Fees (estimate)')).not.toBeInTheDocument();
  });

  it('pays through the widget and goes to the real confirmation for the verified order', async () => {
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180' }));

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
    expect(mocks.deps.createHold).toHaveBeenCalledWith(
      expect.objectContaining({
        attendee: { name: 'A Buyer', email: 'b@example.com' },
      }),
    );
  });

  it('uses one idempotency key per attempt, so retrying replays the same hold', async () => {
    mocks.deps = deps({ openCheckout: vi.fn().mockResolvedValue({ kind: 'dismissed' }) });
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180' }));
    await screen.findByText(/Payment cancelled/);
    fireEvent.click(screen.getByRole('button', { name: 'Pay ₹1,180' }));
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

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Card declined');
    expect(screen.getByRole('button', { name: 'Pay ₹1,180' })).toBeEnabled();
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

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The price changed to ₹1,300');
    expect(await screen.findByRole('button', { name: 'Pay ₹1,300' })).toBeEnabled();
    expect(mocks.deps.openCheckout).not.toHaveBeenCalled();
  });

  it('tells a buyer who paid but is not yet confirmed that they have not been charged twice', async () => {
    mocks.deps = deps({ verify: vi.fn().mockRejectedValue(new Error('timeout')) });
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180' }));

    expect(await screen.findByText(/Checkout in progress/)).toHaveTextContent('contact support');
    expect(screen.getByRole('link', { name: 'My Tickets' })).toHaveAttribute('href', '/tickets');
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('tells a buyer whose late payment was refunded that they were refunded, not that it is processing', async () => {
    const message =
      'Your payment arrived after the reservation expired and the tickets are no longer available. It has been refunded in full.';
    mocks.deps = deps({
      verify: vi.fn().mockRejectedValue(Object.assign(new Error(message), { status: 409 })),
    });
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('It has been refunded in full');
    expect(screen.queryByText(/Checkout in progress/)).not.toBeInTheDocument();
    expect(mocks.deps.waitForTickets).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('sends the buyer to My Tickets when the webhook confirmed while waiting', async () => {
    mocks.deps = deps({
      verify: vi.fn().mockRejectedValue(new Error('timeout')),
      waitForTickets: vi.fn().mockResolvedValue(true),
    });
    toPaymentStep();

    fireEvent.click(await screen.findByRole('button', { name: 'Pay ₹1,180' }));

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith('/tickets');
    });
  });

  it('says so, and offers no payment, when the quote cannot be fetched', async () => {
    mocks.fetchQuote.mockRejectedValue(new Error('401'));
    toPaymentStep();

    expect(await screen.findByText(/could not price your order/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay securely' })).toBeDisabled();
  });

  it('never offers payment or a synthetic confirmation for an unavailable event', () => {
    toPaymentStep({ ...LIVE_EVENT, purchasable: false });

    expect(screen.getByText('Tickets unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Pay/ })).not.toBeInTheDocument();
    expect(mocks.fetchQuote).not.toHaveBeenCalled();
    expect(screen.getByText('Checkout unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Complete Payment →' })).not.toBeInTheDocument();
  });
});
