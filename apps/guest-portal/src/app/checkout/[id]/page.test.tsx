import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';


import { CheckoutView } from '@/features/booking/components/CheckoutView';
import { bookingEventFixtures } from '@/features/booking/fixtures/booking.fixture';

import CheckoutPage from './page';

import type { EventDto, VenueDto } from '@c1rcle/contracts';

vi.mock('next/navigation', async (importOriginal) => {
  const actual: Record<string, unknown> = await (
    importOriginal as () => Promise<Record<string, unknown>>
  )();
  return {
    ...actual,
    notFound: () => {
      throw new Error('NEXT_NOT_FOUND');
    },
    useSearchParams: () => new URLSearchParams(),
  };
});

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
    expect(screen.getByRole('heading', { name: 'General Admission' })).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === 'Skyline Social · Pune'),
    ).toBeInTheDocument();
  });

  it('keeps fixture slugs on their exact legacy behavior', async () => {
    render(await CheckoutPage({ params: Promise.resolve({ id: 'neon-nights' }) }));

    expect(screen.getByRole('heading', { name: 'Select tickets' })).toBeInTheDocument();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('not-founds unknown slugs without fixtures', async () => {
    mockGet.mockRejectedValue(new Error('gateway down'));
    await expect(
      CheckoutPage({ params: Promise.resolve({ id: 'no-such-event' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
