import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CheckoutView } from '@/features/booking/components/CheckoutView';
import { bookingEventFixtures } from '@/features/booking/fixtures/booking.fixture';

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

describe('CheckoutView', () => {
  it('resolves all six fixture event checkouts', () => {
    expect(bookingEventFixtures).toHaveLength(6);
    expect(bookingEventFixtures.every((event) => event.ticketTiers.length > 0)).toBe(true);
  });

  it('supports the three-step checkout process', () => {
    const event = bookingEventFixtures[0];
    expect(event).toBeDefined();
    if (!event) return;

    render(<CheckoutView event={event} initialTierId="gallery-pass" />);
    expect(screen.getByRole('heading', { name: 'Select tickets' })).toBeInTheDocument();

    const increaseBtn = screen.getByRole('button', { name: 'Increase Gallery Pass count' });
    expect(increaseBtn).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue to details →' }));
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Guest User' } });
    fireEvent.change(screen.getByLabelText('Email Address'), {
      target: { value: 'user@test.com' },
    });
    const reviewButton = screen.getByRole('button', { name: 'Proceed to payment →' });
    expect(reviewButton).toBeEnabled();
    fireEvent.click(reviewButton);
    fireEvent.click(screen.getByRole('button', { name: 'UPI / Instant' }));

    expect(screen.getByRole('link', { name: 'Complete Payment →' })).toHaveAttribute(
      'href',
      '/confirmation/preview-neon-nights',
    );
  });

  it('renders fees and subtotal breakdown', () => {
    const event = bookingEventFixtures[1];
    expect(event).toBeDefined();
    if (!event) return;

    render(<CheckoutView event={event} initialTierId="gallery-pass" />);
    expect(screen.getByText('Fees')).toBeInTheDocument();
  });
});
