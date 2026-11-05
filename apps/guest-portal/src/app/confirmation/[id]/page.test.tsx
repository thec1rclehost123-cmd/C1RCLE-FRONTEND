import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmationView } from '@/features/booking/components/ConfirmationView';
import {
  bookingConfirmationFixtures,
  findBookingEventFixture,
} from '@/features/booking/fixtures/booking.fixture';

vi.mock('next/image', () => ({
  default: ({
    alt,
    preload: _preload,
    fill: _fill,
    unoptimized: _unoptimized,
    priority: _priority,
    ...props
  }: React.ComponentProps<'img'> & {
    preload?: boolean;
    fill?: boolean;
    unoptimized?: boolean;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

describe('ConfirmationView', () => {
  it('uses existing artwork fallback for a valid confirmation without a poster', () => {
    const confirmation = bookingConfirmationFixtures[0];
    if (!confirmation) throw new Error('Missing fixture');
    const event = findBookingEventFixture(confirmation.eventId);
    if (!event) throw new Error('Missing event');
    const { container } = render(
      <ConfirmationView confirmation={confirmation} event={{ ...event, image: '' }} />,
    );
    for (const image of container.querySelectorAll('img'))
      expect(image.getAttribute('src')).toBeTruthy();
  });

  it('renders booking confirmation header, details, and navigation CTAs', () => {
    const confirmation = bookingConfirmationFixtures[0];
    expect(confirmation).toBeDefined();
    if (!confirmation) return;

    const event = findBookingEventFixture(confirmation.eventId);
    expect(event).toBeDefined();
    if (!event) return;

    render(<ConfirmationView confirmation={confirmation} event={event} />);
    expect(screen.getByRole('heading', { name: /on the list\./i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Neon Nights' })).toBeInTheDocument();
    expect(screen.getByText('View in My Tickets')).toBeInTheDocument();
    expect(screen.getByText('Explore More Events')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText(/total paid/i)).toBeInTheDocument();
    expect(
      screen.getByText('Your booking details are available in My Tickets.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(/receipt is sent by email/i)).not.toBeInTheDocument();
  });

  it('does not present a failed payment as a confirmed ticket', () => {
    const confirmation = bookingConfirmationFixtures[0];
    expect(confirmation).toBeDefined();
    if (!confirmation) return;
    const event = findBookingEventFixture(confirmation.eventId);
    expect(event).toBeDefined();
    if (!event) return;

    render(<ConfirmationView confirmation={{ ...confirmation, status: 'failed' }} event={event} />);

    expect(screen.getByRole('heading', { name: 'Payment failed' })).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.queryByText('View in My Tickets')).not.toBeInTheDocument();
    expect(screen.queryByText('Confirmed')).not.toBeInTheDocument();
  });

  it('keeps a captured pending booking processing without ticket access', () => {
    const confirmation = bookingConfirmationFixtures[0];
    if (!confirmation) throw new Error('Missing fixture');
    const event = findBookingEventFixture(confirmation.eventId);
    if (!event) throw new Error('Missing event');
    render(
      <ConfirmationView
        confirmation={{ ...confirmation, status: 'paid', fulfillmentState: 'pending' }}
        event={event}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Booking processing' })).toBeInTheDocument();
    expect(
      screen.getByText(/Payment received. Your booking is still processing/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Confirmed')).not.toBeInTheDocument();
    expect(screen.queryByText('View in My Tickets')).not.toBeInTheDocument();
  });

  it('renders original server receipt paise and policy facts without recomputing fees', () => {
    const confirmation = bookingConfirmationFixtures[0];
    if (!confirmation) throw new Error('Missing fixture');
    const event = findBookingEventFixture(confirmation.eventId);
    if (!event) throw new Error('Missing event');
    render(
      <ConfirmationView
        confirmation={{
          ...confirmation,
          receiptFacts: {
            version: 'm4-paid-receipt-v1',
            orderId: confirmation.id,
            bookingReference: confirmation.bookingReference,
            currency: 'INR',
            subtotalPaise: 10000,
            discountPaise: 0,
            discountedSubtotalPaise: 10000,
            admissionPaise: 10000,
            coverPaise: 0,
            addOnPaise: 0,
            platformFeePaise: 501,
            paymentFeePaise: 252,
            feeTaxPaise: 135,
            grandTotalPaise: 10888,
            providerOrderId: 'order_test_reference',
            providerPaymentId: 'pay_test_reference',
            paidAt: '2026-11-04T00:00:00Z',
            bookingFeePolicyVersion: 'test-original-v1',
            accountingPolicyVersion: 'accounting-original-v1',
          },
        }}
        event={event}
      />,
    );
    expect(screen.getByRole('region', { name: 'Original payment receipt' })).toHaveTextContent(
      '₹5.01',
    );
    expect(screen.getByText('Payment reference: pay_test_reference')).toBeInTheDocument();
    expect(screen.getByText('Original fee policy: test-original-v1')).toBeInTheDocument();
    expect(screen.getByText('₹108.88')).toBeInTheDocument();
  });

  it('shows all admissions refunded with the actual retained balance instead of Confirmed', () => {
    const confirmation = bookingConfirmationFixtures[0];
    if (!confirmation) throw new Error('Missing fixture');
    const event = findBookingEventFixture(confirmation.eventId);
    if (!event) throw new Error('Missing event');
    render(
      <ConfirmationView
        confirmation={{
          ...confirmation,
          status: 'paid',
          fulfillmentState: 'complete',
          admissionRefundState: 'all',
          refundedPaise: 10000,
          total: { amountPaise: 10888, currency: 'INR' },
        }}
        event={event}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Admissions refunded' })).toBeInTheDocument();
    expect(screen.queryByText('Confirmed')).not.toBeInTheDocument();
    expect(screen.queryByText('View in My Tickets')).not.toBeInTheDocument();
    expect(screen.getByText('Refunded to date')).toBeInTheDocument();
    expect(screen.getByText('Amount retained')).toBeInTheDocument();
    expect(screen.getByText('₹8.88')).toBeInTheDocument();
    expect(
      screen.queryByText('Your booking details are available in My Tickets.'),
    ).not.toBeInTheDocument();
  });
  it('explains a partial admission refund and retains access only to unaffected admissions', () => {
    const confirmation = bookingConfirmationFixtures[0];
    if (!confirmation) throw new Error('Missing fixture');
    const event = findBookingEventFixture(confirmation.eventId);
    if (!event) throw new Error('Missing event');
    render(
      <ConfirmationView
        confirmation={{
          ...confirmation,
          status: 'paid',
          admissionRefundState: 'partial',
          refundedPaise: 5000,
        }}
        event={event}
      />,
    );
    expect(screen.getByText('Partially refunded')).toBeInTheDocument();
    expect(screen.getByText(/Unrefunded admissions remain available/)).toBeInTheDocument();
    expect(screen.getByText('View in My Tickets')).toBeInTheDocument();
    expect(screen.queryByText('Confirmed')).not.toBeInTheDocument();
  });

  it('keeps fixture confirmations isolated from backend authority', () => {
    const serialized = JSON.stringify(bookingConfirmationFixtures);
    expect(bookingConfirmationFixtures).toHaveLength(6);
    expect(serialized).not.toMatch(
      /firebase|firestore|razorpay|paymentSuccess|ticketJwt|qrPayload/i,
    );
  });
});
