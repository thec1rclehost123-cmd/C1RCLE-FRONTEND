import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HomePage, { revalidate } from '@/app/page';
import { HomeBackgroundVideoClient } from '@/features/home/components/HomeBackgroundVideoClient';
import { homeFixture } from '@/features/home/fixtures/home.fixture';

import type { ExploreEvent } from '@/features/explore/types/explore.types';

const discovery = vi.hoisted(() => ({ events: [] as ExploreEvent[], error: false }));

vi.mock('@/features/explore/explore-data', () => ({
  loadExploreEvents: vi.fn(() =>
    discovery.error ? Promise.reject(new Error('gateway down')) : Promise.resolve(discovery.events),
  ),
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    preload: _preload,
    unoptimized: _unoptimized,
    ...props
  }: React.ComponentProps<'img'> & {
    fill?: boolean;
    preload?: boolean;
    unoptimized?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const EVENT: ExploreEvent = {
  id: 'evt_1',
  slug: 'real-night',
  title: 'Real Night',
  category: 'Music',
  image: '/real-night.webp',
  startsAt: '2026-10-18T14:30:00.000Z',
  venueId: 'ven_1',
  venueSlug: 'skyline-social',
  venue: 'Skyline Social',
  city: 'Pune',
  cityKey: 'pune',
  price: { amountPaise: 99_900, currency: 'INR' },
  availability: 'available',
  availableQuantity: 20,
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  discovery.events = [];
  discovery.error = false;
});

describe('Home Page', () => {
  it('does not cache discovery content across event visibility changes', () => {
    expect(revalidate).toBe(0);
  });

  it('opens with the video hero and connected discovery rail', async () => {
    discovery.events = [EVENT];
    render(await HomePage());

    expect(screen.getByRole('heading', { level: 1, name: 'THE C1RCLE' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enter the C1RCLE' })).toHaveAttribute(
      'href',
      '/explore',
    );
    expect(screen.getByRole('heading', { name: 'Featured Events' })).toBeInTheDocument();
    expect(screen.getByText('UPCOMING EVENTS')).toBeInTheDocument();
    expect(
      screen.queryByText('Explore upcoming events from C1RCLE venues and hosts.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/happening around you|your city's culture/i)).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: /^View Real Night\./ })
        .some((link) => link.getAttribute('href') === '/event/real-night'),
    ).toBe(true);
    expect(screen.queryByText('Neon Nights')).not.toBeInTheDocument();
  });

  it('places aligned discovery rails and genre templates after venue browsing', async () => {
    discovery.events = [EVENT, { ...EVENT, id: 'evt_free', slug: 'free-night', isFree: true }];
    render(await HomePage());

    const momentsHeading = screen.getByRole('heading', { name: 'moments we live for' });
    const venueHeading = screen.getByRole('heading', { name: 'Browse by Venue' });
    const forYouHeading = screen.getByRole('heading', { name: 'For You' });
    const freeHeading = screen.getByRole('heading', { name: 'Free Events' });
    const genreHeading = screen.getByRole('heading', { name: 'Browse by Genre' });
    const eventsHeading = screen.getByRole('heading', { name: 'Featured Events' });
    const exploreVenue = screen.getByRole('link', {
      name: 'Explore events at Skyline Social, Pune',
    });

    expect(
      eventsHeading.compareDocumentPosition(venueHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      venueHeading.compareDocumentPosition(forYouHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      forYouHeading.compareDocumentPosition(freeHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      freeHeading.compareDocumentPosition(genreHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      genreHeading.compareDocumentPosition(momentsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Explore House Parties events' })).toHaveAttribute(
      'href',
      '/explore?category=House%20Parties',
    );
    expect(
      screen
        .getAllByRole('link', { name: /^View Real Night\./ })
        .some((link) => link.getAttribute('href') === '/event/real-night'),
    ).toBe(true);
    expect(exploreVenue).toHaveAttribute('href', '/venue/skyline-social');
  });

  it('shows an intentional empty state without fixture events', async () => {
    render(await HomePage());

    expect(screen.getByRole('heading', { name: 'Nothing published yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore events' })).toHaveAttribute(
      'href',
      '/explore',
    );
    expect(screen.queryByText('Neon Nights')).not.toBeInTheDocument();
  });

  it('distinguishes an unavailable feed from an empty feed', async () => {
    discovery.error = true;
    render(await HomePage());

    expect(
      screen.getByRole('heading', { name: 'Events temporarily unavailable' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Nothing published yet' }),
    ).not.toBeInTheDocument();
  });

  it('keeps the background static when reduced motion is requested', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(
      <HomeBackgroundVideoClient
        desktopSrc={homeFixture.hero.desktopVideoSrc}
        mobileSrc={homeFixture.hero.mobileVideoSrc}
      />,
    );

    expect(screen.queryByTestId('home-background-video')).not.toBeInTheDocument();
  });

  it('loads the responsive background video after the initial poster paint', () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(
      <HomeBackgroundVideoClient
        desktopSrc={homeFixture.hero.desktopVideoSrc}
        mobileSrc={homeFixture.hero.mobileVideoSrc}
      />,
    );

    expect(screen.queryByTestId('home-background-video')).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    const video = screen.getByTestId('home-background-video');
    const sources = video.querySelectorAll('source');
    expect(video).toHaveAttribute('preload', 'none');
    expect(sources[0]).toHaveAttribute('src', homeFixture.hero.mobileVideoSrc);
    expect(sources[1]).toHaveAttribute('src', homeFixture.hero.desktopVideoSrc);
  });
});
