import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EventDetailView } from '@/features/event-detail/components/EventDetailView';
import {
  eventDetailFixtures,
  findEventDetailFixture,
} from '@/features/event-detail/fixtures/event-detail.fixture';

import EventDetailPage from './page';

import type { BookingEventFixture } from '@/features/booking/types/booking.types';
import type { EventPublicDetailDto, PublicTicketTierDto } from '@c1rcle/contracts';

vi.mock('@/features/booking/components/CheckoutView', () => ({
  CheckoutView: ({ event, onClose }: { event: BookingEventFixture; onClose: () => void }) => (
    <section aria-label="Checkout flow">
      <h2>Select tickets</h2>
      <p>{event.title}</p>
      {event.ticketTiers.map((tier) => (
        <p key={tier.id}>{tier.name}</p>
      ))}
      <button type="button" onClick={onClose}>
        Back to event
      </button>
    </section>
  ),
}));

function bookingEventFor(event: (typeof eventDetailFixtures)[number]): BookingEventFixture {
  return {
    id: event.slug,
    eventId: event.id,
    title: event.title,
    category: event.category,
    image: event.image,
    accentTone: event.accentTone,
    startsAt: event.startsAt,
    venue: event.venue,
    address: event.address,
    city: event.city,
    doorNote: event.doorNote,
    purchasable: false,
    ticketTiers: event.ticketTiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      price: { amountPaise: tier.price?.amountPaise ?? 0, currency: 'INR' },
      maximumQuantity: tier.availableQuantity ?? 1,
    })),
  };
}

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => ({ get: mockGet }),
  isApiClientError: (error: unknown) =>
    typeof error === 'object' && error !== null && 'status' in error,
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

    render(<EventDetailView event={event} checkoutEvent={bookingEventFor(event)} />);

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
    expect(screen.queryByLabelText('Verified host')).not.toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Get tickets · From ₹800' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Get tickets · From ₹800' }));
    expect(screen.getByRole('dialog', { name: 'Checkout for Techno Bunker' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Select tickets' })).toBeInTheDocument();
  });

  it('opens checkout over the event and returns to the same event when closed', () => {
    const event = eventDetailFixtures[0];
    expect(event).toBeDefined();
    if (!event) return;

    render(<EventDetailView event={event} checkoutEvent={bookingEventFor(event)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Get tickets · From ₹800' }));
    expect(screen.getByRole('dialog', { name: 'Checkout for Neon Nights' })).toBeInTheDocument();
    expect(screen.getByText('Gallery Pass')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to event' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Get tickets · From ₹800' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([
    ['paused', 'Ticket sales paused'],
    ['cancelled', 'Event cancelled'],
    ['completed', 'Event completed'],
  ] as const)('renders the %s lifecycle without purchase controls', (lifecycle, heading) => {
    const baseEvent = eventDetailFixtures[0];
    expect(baseEvent).toBeDefined();
    if (!baseEvent) return;

    render(
      <EventDetailView
        event={{ ...baseEvent, lifecycle }}
        checkoutEvent={bookingEventFor(baseEvent)}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Get on the list' })).not.toBeInTheDocument();
  });

  it('keeps presentation accents precomputed and excludes backend authority', () => {
    const serialized = JSON.stringify(eventDetailFixtures);
    expect(eventDetailFixtures.every((event) => event.accentTone.length > 0)).toBe(true);
    expect(serialized).not.toMatch(/firebase|firestore|razorpay|checkoutSuccess|paymentSuccess/i);
  });
});

const REAL_EVENT: EventPublicDetailDto = {
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
  visibilityMode: 'public',
  addressDisclosure: 'public',
  isPublic: true,
  tags: ['Music'],
  startingPricePaise: 99900,
  isFree: false,
  cancellationReason: null,
  version: 1,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  venue: {
    id: 'ven_1',
    name: 'Skyline Social',
    slug: 'skyline-social',
    photoUrl: null,
    address: { city: 'Pune', country: 'India' },
  },
  organizer: { id: 'org_1', name: 'Seed Host', slug: 'seed-host' },
};

const REAL_TIERS: PublicTicketTierDto[] = [
  {
    id: 'tier_real',
    eventId: REAL_EVENT.id,
    name: 'Early Entry',
    description: '',
    priceInPaise: 99_900,
    currency: 'INR',
    availableQuantity: 8,
  },
];

function mockDetail(event: EventPublicDetailDto | null, tiers = REAL_TIERS) {
  mockGet.mockImplementation(({ path }: { path: string }) => {
    if (path.startsWith('/api/v2/public/events/') && !path.endsWith('/tiers')) {
      return event
        ? Promise.resolve(event)
        : Promise.reject(Object.assign(new Error('event not found'), { status: 404 }));
    }
    if (path.endsWith('/tiers')) {
      return Promise.resolve({ items: tiers });
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
      '/venue/skyline-social',
    );
    expect(screen.getByRole('link', { name: 'View host Seed Host' })).toHaveAttribute(
      'href',
      '/host/seed-host',
    );
    expect(screen.queryByText('Fixture preview')).not.toBeInTheDocument();
    // No guestlist data exists for real events yet — the section is skipped.
    expect(screen.queryByRole('region', { name: 'Guest list preview' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Get tickets · From ₹999' }));
    expect(screen.getByRole('dialog', { name: 'Checkout for Real Night' })).toBeInTheDocument();
    expect(screen.getByText('Early Entry')).toBeInTheDocument();
  });

  it('falls back honestly when venue and host lookups miss', async () => {
    mockGet.mockImplementation(({ path }: { path: string }) => {
      if (path === '/api/v2/public/events/real-night') {
        return Promise.resolve({ ...REAL_EVENT, venueId: null, venue: null, organizer: null });
      }
      if (path === '/api/v2/public/events/real-night/tiers') {
        return Promise.resolve({ items: REAL_TIERS });
      }
      return Promise.reject(new Error('not found'));
    });
    render(await EventDetailPage({ params: Promise.resolve({ eventId: 'real-night' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Real Night' })).toBeInTheDocument();
    expect(screen.getByText('Venue TBA · Location unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Venue TBA/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Host details unavailable')).not.toBeInTheDocument();
  });

  it('shows the same generic access form for private and unknown slugs', async () => {
    mockDetail(null);
    render(await EventDetailPage({ params: Promise.resolve({ eventId: 'no-such-event' }) }));
    expect(screen.getByRole('heading', { name: 'Private event access' })).toBeInTheDocument();
    expect(screen.getByLabelText('Have an event or private ticket code?')).toBeInTheDocument();
  });
});
