import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HomeFeaturedEventsCarousel } from './HomeFeaturedEventsCarousel';

import type { ExploreEvent } from '@/features/explore/types/explore.types';

vi.mock('@/features/explore/components/EventCardArtwork', () => ({ EventCardArtwork: () => null }));

const events: ExploreEvent[] = Array.from({ length: 5 }, (_, index) => ({
  id: String(index),
  slug: `event-${String(index)}`,
  title: `Event ${String(index)}`,
  category: 'Music',
  image: '/poster.webp',
  startsAt: '2026-12-01T18:00:00Z',
  venueId: null,
  venueSlug: null,
  venue: 'Venue',
  city: 'Pune',
  cityKey: 'pune',
  price: null,
  isFree: true,
  availability: 'available',
  availableQuantity: 10,
}));
let frameCallback: FrameRequestCallback | undefined;
let reducedMotion = false;

beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: reducedMotion,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {
        /* No resizing in this test. */
      }
      disconnect() {
        /* No native observer resources. */
      }
    },
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(private callback: IntersectionObserverCallback) {}
      observe() {
        this.callback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          this as unknown as IntersectionObserver,
        );
      }
      disconnect() {
        /* No native observer resources. */
      }
    },
  );
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  reducedMotion = false;
  frameCallback = undefined;
});

describe('HomeFeaturedEventsCarousel', () => {
  it('moves continuously between animation frames and keeps event destinations', () => {
    render(<HomeFeaturedEventsCarousel events={events} />);
    const card = screen.getByRole('link', { name: /View Event 0/ });
    expect(card).toHaveAttribute('href', '/event/event-0');
    act(() => {
      frameCallback?.(100);
    });
    const firstTransform = card.style.transform;
    act(() => {
      frameCallback?.(116);
    });
    expect(card.style.transform).not.toBe(firstTransform);
    expect(card.style.transform).toContain('rotateY');
    fireEvent.mouseEnter(screen.getByRole('region'));
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it('matches the live speed of 42 pixels per second', () => {
    render(<HomeFeaturedEventsCarousel events={events} />);
    const card = screen.getByRole('link', { name: /View Event 2/ });
    act(() => {
      frameCallback?.(0);
      frameCallback?.(1000);
    });
    // JSDOM has zero stage width: the live sizing clamps to 130px, radius 221px.
    const expectedX = Math.sin(-42 / 221) * 221;
    const actualX = Number(/translateX\(([-\d.]+)px\)/.exec(card.style.transform)?.[1]);
    expect(actualX).toBeCloseTo(expectedX, 3);
  });

  it('repeats the real event sequence to keep the loop populated', () => {
    const { container } = render(<HomeFeaturedEventsCarousel events={events} />);
    const copies = container.querySelectorAll('a[href="/event/event-0"]');
    expect(copies).toHaveLength(3);
    expect(copies[0]).toHaveAttribute('aria-hidden', 'true');
    expect(copies[1]).toHaveAttribute('aria-hidden', 'false');
    expect(copies[2]).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps all events accessible without animation for reduced motion', () => {
    reducedMotion = true;
    render(<HomeFeaturedEventsCarousel events={events} />);
    expect(screen.getByRole('region')).not.toHaveAttribute('data-animated');
    expect(screen.getAllByRole('link')).toHaveLength(5);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('keeps the carousel static and accessible when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { container } = render(<HomeFeaturedEventsCarousel events={events} />);
    const copies = container.querySelectorAll('a[href="/event/event-0"]');
    expect(copies).toHaveLength(3);
    expect(copies[0]).toHaveAttribute('aria-hidden', 'true');
    expect(copies[1]).toHaveAttribute('aria-hidden', 'false');
    expect(copies[2]).toHaveAttribute('aria-hidden', 'true');
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('uses a scrollable row for a small event feed', () => {
    render(<HomeFeaturedEventsCarousel events={events.slice(0, 1)} />);
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });
});
