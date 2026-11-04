import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ExploreHeroCarouselClient } from './ExploreHeroCarouselClient';

const event = {
  id: 'evt_test',
  slug: 'test-event',
  title: 'Test event',
  category: 'Events',
  image: '/test-poster.jpg',
  startsAt: '2026-10-26T14:30:00.000Z',
  venue: 'Test venue',
  city: 'Pune',
  cityKey: 'pune',
  venueId: null,
  venueSlug: null,
  price: { amountPaise: 10_000, currency: 'INR' as const },
  availability: 'available' as const,
  availableQuantity: 3,
};

describe('ExploreHeroCarouselClient', () => {
  it('does not invent attendee interest or profile avatars', () => {
    const { container } = render(<ExploreHeroCarouselClient events={[event]} />);

    expect(screen.getByRole('heading', { name: 'Test event' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Test event poster' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get tickets' })).toHaveAttribute(
      'href',
      '/event/test-event',
    );
    expect(container.querySelector('.explore-hero-ambient')).toHaveClass('fixed', 'inset-0');
    expect(screen.queryByText(/interested/i)).not.toBeInTheDocument();
    expect(container.querySelector('[aria-label*="people interested"]')).toBeNull();
  });
});
