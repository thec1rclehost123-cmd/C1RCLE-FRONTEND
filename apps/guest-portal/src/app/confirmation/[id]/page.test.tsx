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
    ...props
  }: React.ComponentProps<'img'> & { preload?: boolean; fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

describe('ConfirmationView', () => {
  it('renders a clearly labelled non-scannable pass preview', () => {
    const confirmation = bookingConfirmationFixtures[0];
    expect(confirmation).toBeDefined();
    if (!confirmation) return;

    const event = findBookingEventFixture(confirmation.eventId);
    expect(event).toBeDefined();
    if (!event) return;

    render(<ConfirmationView confirmation={confirmation} event={event} />);
    expect(screen.getByRole('heading', { name: /You're on.*the list\./i })).toBeInTheDocument();
    expect(screen.getByText('Not a QR code')).toBeInTheDocument();
    expect(screen.getByText('Non-scannable visual placeholder')).toBeInTheDocument();
    expect(screen.getByText(/no payment processed · no ticket issued/i)).toBeInTheDocument();
  });

  it('keeps fixture confirmations isolated from backend authority', () => {
    const serialized = JSON.stringify(bookingConfirmationFixtures);
    expect(bookingConfirmationFixtures).toHaveLength(6);
    expect(serialized).not.toMatch(
      /firebase|firestore|razorpay|paymentSuccess|ticketJwt|qrPayload/i,
    );
  });
});
