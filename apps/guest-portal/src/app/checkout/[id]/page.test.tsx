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

  it('supports the local three-step preview without payment authority', () => {
    const event = bookingEventFixtures[0];
    expect(event).toBeDefined();
    if (!event) return;

    render(<CheckoutView event={event} initialTierId="gallery-pass" />);
    expect(screen.getByRole('heading', { name: 'Select tickets' })).toBeInTheDocument();
    expect(screen.queryByText(/UI preview · fixture data/i)).not.toBeInTheDocument();

    const quantity = screen.getByLabelText('Gallery Pass quantity');
    fireEvent.click(screen.getByRole('button', { name: 'Add one Gallery Pass' }));
    expect(quantity).toHaveTextContent('2');
    expect(quantity.querySelector('.checkout-number-roll')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Preview Guest' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'fixture email' },
    });
    const reviewButton = screen.getByRole('button', { name: 'Review payment UI' });
    expect(reviewButton).toBeEnabled();
    fireEvent.click(reviewButton);
    fireEvent.click(screen.getByRole('button', { name: 'UPI' }));

    expect(
      screen.getByText(
        'These controls do not initiate payment, reserve inventory, or create an order.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open confirmation UI preview' })).toHaveAttribute(
      'href',
      '/confirmation/preview-neon-nights',
    );
  });

  it('keeps fixture pricing explicitly non-authoritative', () => {
    const event = bookingEventFixtures[1];
    expect(event).toBeDefined();
    if (!event) return;

    render(<CheckoutView event={event} initialTierId="gallery-pass" />);
    expect(screen.getByText('Illustrative fees · not authoritative')).toBeInTheDocument();
    expect(screen.queryByText(/no payment will be processed/i)).not.toBeInTheDocument();
  });
});
