import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HomePage from '@/app/page';
import { HomeBackgroundVideoClient } from '@/features/home/components/HomeBackgroundVideoClient';
import { homeFixture } from '@/features/home/fixtures/home.fixture';

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    preload: _preload,
    ...props
  }: React.ComponentProps<'img'> & { fill?: boolean; preload?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Home Page', () => {
  it('renders the cinematic hero and fixture-backed featured events', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { level: 1, name: 'THE C1RCLE' })).toBeInTheDocument();
    expect(screen.getByText('Discover Life Offline')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore events' })).toHaveAttribute(
      'href',
      '/explore',
    );
    expect(screen.getByRole('heading', { name: 'Discover Offline' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Featured Drops' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Featured drops carousel' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('moves through featured drops with the carousel controls', () => {
    render(<HomePage />);

    const carousel = screen.getByRole('region', { name: 'Featured drops carousel' });
    expect(
      within(carousel).getByRole('heading', { level: 3, name: 'Neon Nights' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next featured drop' }));
    expect(
      within(carousel).getByRole('heading', { level: 3, name: 'Rooftop Jazz' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Previous featured drop' }));
    expect(
      within(carousel).getByRole('heading', { level: 3, name: 'Neon Nights' }),
    ).toBeInTheDocument();

    fireEvent.pointerDown(carousel, { clientX: 200 });
    fireEvent.pointerUp(carousel, { clientX: 100 });
    expect(
      within(carousel).getByRole('heading', { level: 3, name: 'Rooftop Jazz' }),
    ).toBeInTheDocument();
  });

  it('does not auto-advance featured drops when reduced motion is requested', () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(<HomePage />);
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    const carousel = screen.getByRole('region', { name: 'Featured drops carousel' });
    expect(
      within(carousel).getByRole('heading', { level: 3, name: 'Neon Nights' }),
    ).toBeInTheDocument();
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

    render(<HomeBackgroundVideoClient src={homeFixture.hero.videoSrc} />);

    expect(screen.queryByTestId('home-background-video')).not.toBeInTheDocument();
  });

  it('keeps fixture content isolated from backend authority', () => {
    expect(JSON.stringify(homeFixture)).not.toMatch(
      /firebase|firestore|razorpay|paymentSuccess|checkoutSuccess|api\//i,
    );
  });
});
