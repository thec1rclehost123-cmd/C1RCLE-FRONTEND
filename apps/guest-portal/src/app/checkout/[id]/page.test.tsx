import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import { CheckoutView } from '@/features/booking/components/CheckoutView';
import { bookingEventFixtures } from '@/features/booking/fixtures/booking.fixture';

import CheckoutPage from './page';

import type { BookingEventFixture } from '@/features/booking/types/booking.types';
import type { EventDto, PublicTicketTierDto, VenueDto } from '@c1rcle/contracts';

vi.mock('next/navigation', async (importOriginal) => {
  const actual: Record<string, unknown> = await (
    importOriginal as () => Promise<Record<string, unknown>>
  )();
  return {
    ...actual,
    notFound: () => {
      throw new Error('NEXT_NOT_FOUND');
    },
    useRouter: () => ({ push: mockPush }),
    useSearchParams: () => new URLSearchParams(),
  };
});

const mockGet = vi.fn();
const mockPost = vi.fn<(...args: readonly unknown[]) => Promise<unknown>>();
const mockPush = vi.fn();

vi.mock('@c1rcle/api-client', () => ({
  createApiClient: () => ({ get: mockGet }),
  ApiClientError: class extends Error {
    code: string;
    status: number | undefined;
    constructor(init: { code: string; message: string; status: number }) {
      super(init.message);
      this.code = init.code;
      this.status = init.status;
    }
  },
  isApiClientError: (value: unknown) =>
    typeof value === 'object' && value !== null && 'code' in value,
}));

vi.mock('@/lib/bff/bff-client', () => ({
  bffClient: { post: (...args: unknown[]) => mockPost(...args) },
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

describe('CheckoutView', () => {
  it('resolves all six fixture event checkouts', () => {
    expect(bookingEventFixtures).toHaveLength(6);
    expect(bookingEventFixtures.every((event) => event.ticketTiers.length > 0)).toBe(true);
  });

  it('selects tickets and reviews the order without an attendee form', () => {
    const event = bookingEventFixtures[0];
    expect(event).toBeDefined();
    if (!event) return;

    render(<CheckoutView event={event} initialTierId="gallery-pass" />);
    expect(screen.getByRole('heading', { name: 'Select tickets' })).toBeInTheDocument();

    const increaseBtn = screen.getByRole('button', { name: 'Increase Gallery Pass count' });
    expect(increaseBtn).toBeInTheDocument();

    const reviewButton = screen.getByRole('button', { name: 'Review order →' });
    expect(reviewButton).toBeEnabled();
    fireEvent.click(reviewButton);
    expect(screen.queryByLabelText('Full Name')).not.toBeInTheDocument();

    expect(screen.getByText('Checkout unavailable')).toBeInTheDocument();
  });

  it('does not invent a fee or payable total before a server quote', () => {
    const event = bookingEventFixtures[1];
    expect(event).toBeDefined();
    if (!event) return;

    render(<CheckoutView event={event} initialTierId="gallery-pass" />);
    fireEvent.click(screen.getByRole('button', { name: 'Review order →' }));
    expect(screen.getByText('Fees and taxes')).toBeInTheDocument();
    expect(screen.queryByText('Fees (estimate)')).not.toBeInTheDocument();
    expect(screen.queryByText('₹40')).not.toBeInTheDocument();
  });

  it('does not invent a paid confirmation before the authoritative checkout flow', () => {
    const event = bookingEventFixtures[0];
    expect(event).toBeDefined();
    if (!event) return;

    render(<CheckoutView event={event} initialTierId="gallery-pass" />);
    fireEvent.click(screen.getByRole('button', { name: 'Review order →' }));

    expect(screen.queryByRole('button', { name: /Confirm RSVP/ })).not.toBeInTheDocument();
    expect(screen.getByText('Checkout unavailable')).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });
});

const FREE_EVENT_BASE = bookingEventFixtures[0];
if (!FREE_EVENT_BASE) throw new Error('missing booking fixture');
const FREE_EVENT: BookingEventFixture = {
  ...FREE_EVENT_BASE,
  id: 'rsvp-night',
  eventId: 'evt_rsvp_night',
  ticketTiers: [
    {
      id: 'tier_rsvp_1',
      name: 'RSVP Entry',
      description: 'Free entry',
      price: { amountPaise: 0, currency: 'INR' as const },
      maximumQuantity: 1,
    },
  ],
};

function reachRsvpStep() {
  render(<CheckoutView event={FREE_EVENT} />);
  fireEvent.click(screen.getByRole('button', { name: 'Review order →' }));
}

describe('CheckoutView RSVP', () => {
  beforeEach(() => {
    mockPost.mockClear();
    mockPush.mockClear();
  });

  it('posts a real RSVP for free events and navigates to the confirmation', async () => {
    mockPost.mockResolvedValue({ order: { id: 'RSVP-abc123' } });
    reachRsvpStep();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm RSVP' }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith({
        path: '/api/rsvp',
        body: { eventId: 'evt_rsvp_night', tierId: 'tier_rsvp_1' },
        headers: {},
        schema: expect.anything() as unknown,
      });
      expect(mockPush).toHaveBeenCalledWith('/confirmation/RSVP-abc123');
    });
  });

  it('forwards the guest.c1rcle.csrf cookie as x-csrf-token header', async () => {
    document.cookie = 'guest.c1rcle.csrf=test-csrf-token-123; path=/';
    mockPost.mockResolvedValue({ order: { id: 'RSVP-csrf-test' } });
    reachRsvpStep();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm RSVP' }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith({
        path: '/api/rsvp',
        body: { eventId: 'evt_rsvp_night', tierId: 'tier_rsvp_1' },
        headers: { 'x-csrf-token': 'test-csrf-token-123' },
        schema: expect.anything() as unknown,
      });
    });
    document.cookie = 'guest.c1rcle.csrf=; path=/; max-age=0';
  });

  it('shows the already-on-the-list state on a 409 duplicate', async () => {
    mockPost.mockRejectedValue(
      new ApiClientError({
        code: 'conflict',
        message: 'dup',
        status: 409,
        requestId: 'test-request' as never,
        fieldErrors: {},
      }),
    );
    reachRsvpStep();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm RSVP' }));

    await waitFor(() => {
      expect(screen.getByText(/already on the list/)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

const REAL_EVENT: EventDto = {
  id: 'evt_real_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'real-night',
  title: 'Real Night',
  summary: 'A real gathering.',
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

function mockCheckoutFeed() {
  mockGet.mockImplementation(({ path }: { path: string }) => {
    if (path === '/api/v2/public/events/real-night') {
      return Promise.resolve(REAL_EVENT);
    }
    if (path === '/api/v2/public/venues/by-id/ven_1') {
      return Promise.resolve(REAL_VENUE);
    }
    if (path === '/api/v2/public/events/real-night/tiers') {
      return Promise.resolve({ items: [] });
    }
    return Promise.reject(new Error(`unexpected path ${path}`));
  });
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it('renders a real published event through the fixture checkout UI', async () => {
    mockCheckoutFeed();
    render(await CheckoutPage({ params: Promise.resolve({ id: 'real-night' }) }));

    expect(screen.getByRole('heading', { name: 'Select tickets' })).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === 'Skyline Social · Pune'),
    ).toBeInTheDocument();
  });

  it('shows an empty selector when the event lists no tiers', async () => {
    mockCheckoutFeed();
    render(await CheckoutPage({ params: Promise.resolve({ id: 'real-night' }) }));

    expect(
      screen.getByText('Tickets are not available for this event right now.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review order →' })).toBeDisabled();
  });

  it('shows an explicit unavailable state when the authoritative tier read fails', async () => {
    mockGet.mockImplementation(({ path }: { path: string }) => {
      if (path === '/api/v2/public/events/real-night') {
        return Promise.resolve(REAL_EVENT);
      }
      if (path === '/api/v2/public/venues/by-id/ven_1') {
        return Promise.resolve(REAL_VENUE);
      }
      return Promise.reject(new Error('tiers down'));
    });
    render(await CheckoutPage({ params: Promise.resolve({ id: 'real-night' }) }));

    expect(
      screen.getByRole('heading', { name: 'Checkout temporarily unavailable' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'General Admission' })).not.toBeInTheDocument();
  });

  it('renders real tier ids from the public tiers listing', async () => {
    const realTiers: PublicTicketTierDto[] = [
      {
        id: 'tier_rsvp_1',
        eventId: 'evt_real_1',
        name: 'RSVP Entry',
        description: 'Free entry',
        priceInPaise: 0,
        currency: 'INR',
        availableQuantity: 40,
      },
    ];
    mockGet.mockImplementation(({ path }: { path: string }) => {
      if (path === '/api/v2/public/events/real-night') {
        return Promise.resolve(REAL_EVENT);
      }
      if (path === '/api/v2/public/venues/by-id/ven_1') {
        return Promise.resolve(REAL_VENUE);
      }
      if (path === '/api/v2/public/events/real-night/tiers') {
        return Promise.resolve({ items: realTiers });
      }
      return Promise.reject(new Error(`unexpected path ${path}`));
    });
    render(await CheckoutPage({ params: Promise.resolve({ id: 'real-night' }) }));

    expect(screen.getByText('RSVP Entry')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'General Admission' })).not.toBeInTheDocument();
  });

  it('does not resolve fixture slugs without backend authority', async () => {
    mockGet.mockRejectedValue(
      new ApiClientError({ code: 'not_found', message: 'missing', status: 404 } as never),
    );
    await expect(CheckoutPage({ params: Promise.resolve({ id: 'neon-nights' }) })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
    expect(mockGet).toHaveBeenCalled();
  });

  it('does not misreport a gateway failure as a missing event', async () => {
    mockGet.mockRejectedValue(new Error('gateway down'));
    render(await CheckoutPage({ params: Promise.resolve({ id: 'real-night' }) }));
    expect(
      screen.getByRole('heading', { name: 'Checkout temporarily unavailable' }),
    ).toBeInTheDocument();
  });
});
