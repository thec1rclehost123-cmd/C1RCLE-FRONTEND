import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { exploreFixture } from '@/features/explore/fixtures/explore.fixture';

import ExplorePage from './page';

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

describe('ExplorePage', () => {
  it('renders the featured experience and fixture-backed event grid', async () => {
    render(await ExplorePage());

    expect(
      screen.getByRole('heading', { level: 1, name: 'Discover Events and Experiences' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Neon Nights' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Neon Nights featured poster' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /What's on in All Cities/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('6 events found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Sunday Soul/i })).toBeInTheDocument();
    expect(screen.getByLabelText('184 people interested')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pause featured events/i }),
    ).not.toBeInTheDocument();
  });

  it('searches and filters fixtures without backend behavior', async () => {
    render(await ExplorePage());

    fireEvent.change(screen.getByPlaceholderText('Events, venues, artists, cities'), {
      target: { value: 'jazz' },
    });

    expect(screen.getByText('1 event found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Rooftop Jazz event poster/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Neon Nights event poster/i }),
    ).not.toBeInTheDocument();
  });

  it('shows an honest empty state and restores fixtures', async () => {
    render(await ExplorePage());

    fireEvent.change(screen.getByPlaceholderText('Events, venues, artists, cities'), {
      target: { value: 'not-a-real-fixture' },
    });

    expect(screen.getByText('No events found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('6 events found')).toBeInTheDocument();
  });

  it('changes featured events with accessible carousel controls', async () => {
    render(await ExplorePage());

    fireEvent.click(screen.getByRole('button', { name: 'Next featured event' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Rooftop Jazz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show Rooftop Jazz' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('does not auto-rotate when reduced motion is requested', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    render(await ExplorePage());
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Neon Nights' })).toBeInTheDocument();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('keeps fixture money as paise and does not expose backend fields', () => {
    expect(exploreFixture.events[0]?.price?.amountPaise).toBe(149900);
    expect(JSON.stringify(exploreFixture)).not.toMatch(/api|firebase|firestore|razorpay/i);
  });
});
