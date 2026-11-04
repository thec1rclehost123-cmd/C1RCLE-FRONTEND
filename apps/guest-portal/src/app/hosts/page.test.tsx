import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import HostsPage from './page';

const { loadExploreEvents } = vi.hoisted(() => ({ loadExploreEvents: vi.fn() }));

vi.mock('@/features/explore/explore-data', () => ({ loadExploreEvents }));

vi.mock('next/image', () => ({
  default: ({ alt, fill: _fill, ...props }: React.ComponentProps<'img'> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const event = {
  id: 'event-1',
  slug: 'late-night',
  title: 'Late Night Sessions',
  category: 'Live Music',
  image: 'https://images.example.test/event.jpg',
  startsAt: '2026-11-01T20:00:00.000Z',
  venueId: 'venue-1',
  venueSlug: 'the-loft',
  venue: 'The Loft',
  city: 'Pune',
  cityKey: 'pune',
  price: null,
  availability: 'available' as const,
  availableQuantity: 8,
};

describe('HostsPage', () => {
  it('builds the venue directory from real public events and keeps host data honest', async () => {
    loadExploreEvents.mockResolvedValue([event, { ...event, id: 'event-2', slug: 'after-hours' }]);

    render(await HostsPage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Discover Hosts & Venues' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Search hosts and venues' })).toHaveAttribute(
      'href',
      '/search',
    );
    expect(
      screen.getByRole('link', { name: /The Loft, Pune\. 2 upcoming events/i }),
    ).toHaveAttribute('href', '/venue/the-loft');

    fireEvent.click(screen.getByRole('tab', { name: 'Hosts' }));
    expect(screen.getByText('No public hosts are available yet.')).toBeInTheDocument();
    expect(screen.queryByText(/TABLES AVAILABLE/i)).not.toBeInTheDocument();
  });

  it('shows a retry-friendly feed state instead of inventing venues when discovery fails', async () => {
    loadExploreEvents.mockRejectedValue(new Error('offline'));

    render(await HostsPage());

    expect(
      screen.getByText('We couldn’t load the public event feed. Please try again in a moment.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /upcoming events/i })).not.toBeInTheDocument();
  });
});
