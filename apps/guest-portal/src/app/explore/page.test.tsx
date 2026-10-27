import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ExplorePage from './page';

import type { EventDto, VenueDto } from '@c1rcle/contracts';

const EVENT: EventDto = {
  id: 'evt_real_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'real-night',
  title: 'Real Night',
  summary: '',
  description: '',
  imageUrl: 'https://example.com/poster.jpg',
  startAt: '2026-09-18T19:30:00.000Z',
  endAt: null,
  status: 'published',
  isPublic: true,
  tags: ['Music'],
  startingPricePaise: 99900,
  isFree: false,
  cancellationReason: null,
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const VENUE: VenueDto = {
  id: 'ven_1',
  organizationId: 'org_1',
  name: 'Skyline Social',
  slug: 'skyline-social',
  status: 'active',
  description: '',
  capacity: null,
  city: 'Pune',
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const FREE_EVENT: EventDto = {
  ...EVENT,
  id: 'evt_real_2',
  slug: 'free-jam',
  title: 'Free Jam',
  venueId: null,
  tags: [],
  imageUrl: null,
  isFree: true,
  startingPricePaise: null,
};

const mockGet = vi.fn();
const replace = vi.fn();

vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => ({ get: mockGet }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/explore',
  useRouter: () => ({ replace }),
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    preload: _preload,
    fill: _fill,
    unoptimized: _unoptimized,
    ...props
  }: React.ComponentProps<'img'> & {
    preload?: boolean;
    fill?: boolean;
    unoptimized?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

function mockFeed(items: EventDto[], venues: VenueDto[] = [VENUE]) {
  mockGet.mockImplementation(({ path }: { path: string }) => {
    if (path === '/api/v2/public/discovery') {
      return Promise.resolve({ items });
    }
    const venue = venues.find(
      (candidate) => path === `/api/v2/public/venues/by-id/${candidate.id}`,
    );
    if (venue) return Promise.resolve(venue);
    const tierEvent = items.find(
      (candidate) => path === `/api/v2/public/events/${candidate.slug}/tiers`,
    );
    if (tierEvent) {
      return Promise.resolve({
        items: [
          {
            id: `tier_${tierEvent.id}`,
            eventId: tierEvent.id,
            name: 'General',
            description: '',
            priceInPaise: tierEvent.startingPricePaise ?? 0,
            currency: 'INR',
            availableQuantity: 10,
          },
        ],
      });
    }
    return Promise.reject(new Error('not found'));
  });
}

describe('ExplorePage', () => {
  it('renders real published events with resolved venues', async () => {
    mockFeed([EVENT, FREE_EVENT]);
    render(await ExplorePage());

    expect(screen.getByRole('heading', { level: 1, name: 'Real Night' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Real Night featured poster' })).toBeInTheDocument();
    expect(screen.getByText('2 events found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^View Free Jam\b/ })).toBeInTheDocument();
    // Venue name + city come from the venue lookup, not the event.
    expect(screen.getAllByText('Skyline Social, Pune').length).toBeGreaterThan(0);
    // Event without a venue renders the honest fallback, not a dummy.
    expect(screen.getAllByText('Venue TBA, Location unavailable').length).toBeGreaterThan(0);
  });

  it('searches and filters real events without fixtures', async () => {
    mockFeed([EVENT, FREE_EVENT]);
    render(await ExplorePage({ searchParams: Promise.resolve({ q: 'jam' }) }));

    expect(screen.getByText('1 event found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^View Free Jam\b/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^View Real Night\b/ })).not.toBeInTheDocument();
  });

  it('derives city options from real venues', async () => {
    mockFeed([EVENT, FREE_EVENT]);
    render(await ExplorePage());

    const citySelect = screen.getByLabelText('City');
    expect(citySelect).toHaveTextContent('All Cities');
    expect(citySelect).toHaveTextContent('Pune');
    expect(citySelect).not.toHaveTextContent('Mumbai');
  });

  it('routes API failures to the retryable route error boundary', async () => {
    mockGet.mockRejectedValue(new Error('gateway down'));
    await expect(ExplorePage()).rejects.toThrow('gateway down');
  });

  it('sorts real events by soonest and price', async () => {
    const later = {
      ...EVENT,
      id: 'evt_later',
      slug: 'later-night',
      title: 'Later Night',
      startAt: '2026-09-25T21:00:00.000Z',
      startingPricePaise: 50000,
    };
    const earlier = {
      ...EVENT,
      id: 'evt_earlier',
      slug: 'earlier-night',
      title: 'Earlier Night',
      startAt: '2026-09-18T19:30:00.000Z',
      startingPricePaise: 99900,
    };
    mockFeed([later, earlier]);
    render(await ExplorePage());

    const cardNames = () =>
      screen
        .getAllByRole('link', { name: /View (Later|Earlier) Night/ })
        .map((link) => link.getAttribute('aria-label'));

    // The default ranking is the authoritative soonest-starting order.
    expect(cardNames()[0]).toMatch(/^View Earlier Night\b/);

    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'soonest' } });
    expect(cardNames()[0]).toMatch(/^View Earlier Night\b/);

    fireEvent.change(screen.getByLabelText('Sort'), { target: { value: 'price-low' } });
    expect(cardNames()[0]).toMatch(/^View Later Night\b/);
  });

  it('filters real events by city option', async () => {
    const mumbaiVenue = { ...VENUE, id: 'ven_m', name: 'Glass House', city: 'Mumbai' };
    const mumbaiEvent = {
      ...EVENT,
      id: 'evt_m',
      slug: 'mumbai-night',
      title: 'Mumbai Night',
      venueId: 'ven_m',
    };
    mockFeed([EVENT, mumbaiEvent], [VENUE, mumbaiVenue]);
    render(await ExplorePage());
    expect(screen.getByText('2 events found')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'mumbai' } });
    expect(screen.getByText('1 event found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^View Mumbai Night\b/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^View Real Night\b/ })).not.toBeInTheDocument();
  });

  it('filters real events by today', async () => {
    const dateParts = new Intl.DateTimeFormat('en', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
    })
      .formatToParts(new Date())
      .reduce<Record<string, string>>((parts, { type, value }) => {
        parts[type] = value;
        return parts;
      }, {});
    const { year, month, day } = dateParts;
    if (!year || !month || !day) throw new Error('Could not resolve the current India date');
    const indiaNoonUtc = new Date(`${year}-${month}-${day}T06:30:00.000Z`);
    const todayEvent = {
      ...EVENT,
      id: 'evt_t',
      slug: 'today-night',
      title: 'Today Night',
      startAt: indiaNoonUtc.toISOString(),
    };
    const oldEvent = { ...EVENT, startAt: '2026-03-10T12:00:00.000Z' };
    mockFeed([todayEvent, oldEvent]);
    render(await ExplorePage());

    fireEvent.change(screen.getByLabelText('Date'), { target: { value: 'today' } });
    expect(screen.getByText('1 event found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^View Today Night\b/ })).toBeInTheDocument();
  });
});
