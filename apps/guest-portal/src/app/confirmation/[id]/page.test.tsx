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

  it('keeps fixture confirmations isolated from backend authority', () => {
    const serialized = JSON.stringify(bookingConfirmationFixtures);
    expect(bookingConfirmationFixtures).toHaveLength(6);
    expect(serialized).not.toMatch(
      /firebase|firestore|razorpay|paymentSuccess|ticketJwt|qrPayload/i,
    );
  });
});
