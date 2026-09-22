import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';


import { EventDetailView } from '@/features/event-detail/components/EventDetailView';
import {
  eventDetailFixtures,
  findEventDetailFixture,
} from '@/features/event-detail/fixtures/event-detail.fixture';

import EventDetailPage from './page';

import type { EventDto, HostPublicDto, VenueDto } from '@c1rcle/contracts';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const mockGet = vi.fn();

vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => ({ get: mockGet }),
}));

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

describe('EventDetailView', () => {
  it('resolves every Explore destination fixture', () => {
    for (const event of eventDetailFixtures) {
      expect(findEventDetailFixture(event.slug)?.id).toBe(event.id);
    }
    expect(findEventDetailFixture('missing-event')).toBeUndefined();
  });

  it('renders the screenshot-led event detail structure', () => {
    const event = eventDetailFixtures[2];
    expect(event).toBeDefined();
    if (!event) return;

    render(<EventDetailView event={event} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Techno Bunker' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Event poster' })).toBeInTheDocument();
    expect(screen.getByText('About the event')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View host High Spirits Collective' })).toHaveAttribute(
      'href',
      '/host/high-spirits-collective',
    );
    expect(screen.getByRole('link', { name: 'Sector 9 · Bengaluru' })).toHaveAttribute(
      'href',
      '/venue/sector-9',
    );
    expect(screen.getByLabelText('Verified host')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Riya and 155 others going' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Guest list preview' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View Riya profile' })[0]).toHaveAttribute(
      'href',
      '/profile/riya',
    );
    fireEvent.click(screen.getByRole('button', { name: 'View all guests' }));
    expect(
      screen.getByRole('dialog', { name: 'Get the app to view the guestlist and more' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get THE C1RCLE app' })).toHaveAttribute(
      'href',
      '/app',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close guest list preview' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sector 9' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get tickets' })).toHaveAttribute(
      'href',
      '/checkout/techno-bunker',
    );
    expect(screen.getByRole('link', { name: 'Buy tickets from ₹800' })).toHaveAttribute(
      'href',
      '/checkout/techno-bunker',
    );
  });

  it('allows local tier highlighting and links into fixture checkout', () => {
    const event = eventDetailFixtures[0];
    expect(event).toBeDefined();
    if (!event) return;

    render(<EventDetailView event={event} />);
    const tier = screen.getByRole('button', { name: /Gallery Pass/i });
    fireEvent.click(tier);

    expect(tier).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: 'Continue to checkout preview' })).toHaveAttribute(
      'href',
      '/checkout/neon-nights?tier=gallery-pass',
    );
    expect(screen.queryByRole('button', { name: /Checkout unavailable/i })).not.toBeInTheDocument();
  });

  it.each([
    ['paused', 'Ticket sales paused'],
    ['cancelled', 'Event cancelled'],
    ['completed', 'Event completed'],
  ] as const)('renders the %s lifecycle without purchase controls', (lifecycle, heading) => {
    const baseEvent = eventDetailFixtures[0];
    expect(baseEvent).toBeDefined();
    if (!baseEvent) return;

    render(<EventDetailView event={{ ...baseEvent, lifecycle }} />);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Get on the list' })).not.toBeInTheDocument();
  });

  it('keeps presentation accents precomputed and excludes backend authority', () => {
    const serialized = JSON.stringify(eventDetailFixtures);
    expect(eventDetailFixtures.every((event) => event.accentTone.length > 0)).toBe(true);
    expect(serialized).not.toMatch(/firebase|firestore|razorpay|checkoutSuccess|paymentSuccess/i);
  });
});

const REAL_EVENT: EventDto = {
  id: 'evt_real_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'real-night',
  title: 'Real Night',
  summary: 'A real gathering.',
  description: 'Doors at 7pm.',
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

const REAL_VENUE: VenueDto = {
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

const REAL_HOST: HostPublicDto = { id: 'org_1', name: 'Seed Host', slug: 'seed-host' };

function mockDetail(event: EventDto | null) {
  mockGet.mockImplementation(({ path }: { path: string }) => {
    if (path === '/api/v2/public/events/real-night') {
      return event ? Promise.resolve(event) : Promise.reject(new Error('not found'));
    }
    if (path === '/api/v2/public/venues/by-id/ven_1') {
      return Promise.resolve(REAL_VENUE);
    }
    if (path === '/api/v2/public/hosts/by-id/org_1') {
      return Promise.resolve(REAL_HOST);
    }
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('EventDetailPage', () => {
  it('renders a real published event with resolved venue and host', async () => {
    mockDetail(REAL_EVENT);
    render(await EventDetailPage({ params: Promise.resolve({ eventId: 'real-night' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Real Night' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skyline Social · Pune' })).toHaveAttribute(
      'href',
      '/venue/ven_1',
    );
    expect(screen.getByRole('link', { name: 'View host Seed Host' })).toHaveAttribute(
      'href',
      '/host/seed-host',
    );
    expect(screen.getByRole('button', { name: /General Admission/i })).toBeInTheDocument();
    expect(screen.getByText('Live pricing')).toBeInTheDocument();
    expect(screen.queryByText('Fixture preview')).not.toBeInTheDocument();
    // No guestlist data exists for real events yet — the section is skipped.
    expect(screen.queryByRole('region', { name: 'Guest list preview' })).not.toBeInTheDocument();
  });

  it('falls back honestly when venue and host lookups miss', async () => {
    mockGet.mockImplementation(({ path }: { path: string }) => {
      if (path === '/api/v2/public/events/real-night') {
        return Promise.resolve({ ...REAL_EVENT, venueId: null });
      }
      return Promise.reject(new Error('not found'));
    });
    render(await EventDetailPage({ params: Promise.resolve({ eventId: 'real-night' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Real Night' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Venue TBA · India' })).toHaveAttribute(
      'href',
      '/venue/venue-tba',
    );
  });

  it('not-founds unknown or unpublished slugs without fixtures', async () => {
    mockDetail(null);
    await expect(
      EventDetailPage({ params: Promise.resolve({ eventId: 'no-such-event' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
