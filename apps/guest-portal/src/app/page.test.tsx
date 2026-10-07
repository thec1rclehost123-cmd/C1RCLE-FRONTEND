import { act, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HomePage from '@/app/page';
import { HomeBackgroundVideoClient } from '@/features/home/components/HomeBackgroundVideoClient';
import { homeFixture } from '@/features/home/fixtures/home.fixture';

const seoMocks = vi.hoisted(() => ({
  production: false,
  events: [] as { id: string; slug: string; title: string; summary: string }[],
}));

vi.mock('@/lib/seo/site', () => ({
  absoluteUrl: (path: string) => `http://localhost:3000${path}`,
  isProductionSeo: () => seoMocks.production,
}));

vi.mock('@/lib/seo/public-data', () => ({
  getPublicEventsForSitemap: vi.fn(() => Promise.resolve(seoMocks.events)),
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

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  seoMocks.production = false;
  seoMocks.events = [];
});

describe('Home Page', () => {
  it('renders the hero section and featured drops section', async () => {
    render(await HomePage());

    expect(screen.getByRole('heading', { level: 1, name: 'THE C1RCLE' })).toBeInTheDocument();
    expect(
      screen.getByText(/Discover the right nights, book entry, run guestlists/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enter the C1RCLE' })).toHaveAttribute(
      'href',
      '/explore',
    );
    expect(screen.getByRole('heading', { name: 'Featured Drops' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Featured drops carousel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Discover Offline' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Neon Nights/i })).toHaveAttribute(
      'href',
      '/event/neon-nights',
    );
    expect(screen.queryByText(/Run the Room/i)).not.toBeInTheDocument();
  });

  it('renders the curved featured-drop rail with linked event posters', async () => {
    render(await HomePage());

    const carousel = screen.getByRole('region', { name: 'Featured drops carousel' });
    const velvetDrop = within(carousel).getByRole('link', { name: /Velvet Nights/i });
    const eclipseDrop = within(carousel).getByRole('link', { name: /Eclipse/i });

    expect(velvetDrop).toHaveAttribute('href', '/explore');
    expect(eclipseDrop).toHaveAttribute('href', '/explore');
    expect(velvetDrop.style.transform).toContain('rotateY');
    expect(screen.queryByRole('button', { name: /featured drop/i })).not.toBeInTheDocument();
  });

  it('does not auto-advance featured drops when reduced motion is requested', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(await HomePage());
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    const carousel = screen.getByRole('region', { name: 'Featured drops carousel' });
    expect(within(carousel).getByRole('link', { name: /Velvet Nights/i })).toBeInTheDocument();
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

  it('keeps fixture content isolated from backend authority', () => {
    expect(JSON.stringify(homeFixture)).not.toMatch(
      /firebase|firestore|razorpay|paymentSuccess|checkoutSuccess|api\//i,
    );
  });

  it('never renders fixture event inventory in the production homepage', async () => {
    seoMocks.production = true;
    seoMocks.events = [
      {
        id: 'authoritative-event',
        slug: 'authoritative-event',
        title: 'Authoritative Event',
        summary: 'Published by the public events service.',
      },
    ];

    render(await HomePage());

    expect(screen.getByRole('heading', { name: 'Authoritative Event' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Featured Drops' })).not.toBeInTheDocument();
    expect(screen.queryByText('Neon Nights')).not.toBeInTheDocument();
  });
});
