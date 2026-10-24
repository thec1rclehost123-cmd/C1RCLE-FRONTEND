import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ExploreDiscoveryClient } from './ExploreDiscoveryClient';

vi.mock('next/navigation', () => ({ usePathname: () => '/explore' }));

const event = {
  id: 'evt_blue',
  slug: 'blue-room',
  title: 'Blue Room',
  category: 'House',
  image: '/blue-room.jpg',
  startsAt: '2026-10-26T14:30:00.000Z',
  venue: 'Blue Room',
  city: 'Pune',
  cityKey: 'pune',
  venueId: null,
  venueSlug: null,
  price: { amountPaise: 10_000, currency: 'INR' as const },
  availability: 'available' as const,
  availableQuantity: 3,
};

describe('ExploreDiscoveryClient URL state', () => {
  it('keeps deep-link search filtering while exposing only the visible filter controls', async () => {
    render(
      <ExploreDiscoveryClient
        events={[event]}
        cities={[
          { label: 'All Cities', value: '' },
          { label: 'Pune', value: 'pune' },
        ]}
        initialFilters={{ search: 'blue', city: '', category: '', date: 'any', sort: 'soonest' }}
      />,
    );

    expect(screen.getByRole('heading', { name: /what's on in all cities/i })).toBeInTheDocument();
    expect(screen.queryByText('Explore events', { selector: 'p' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View Blue Room/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Coming up' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'This weekend' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Free experiences' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Browse by venue' })).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'City' }), { target: { value: 'pune' } });

    await waitFor(() => {
      expect(window.location.pathname).toBe('/explore');
      expect(new URLSearchParams(window.location.search).get('q')).toBe('blue');
      expect(new URLSearchParams(window.location.search).get('city')).toBe('pune');
    });
  });
});
