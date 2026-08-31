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

// ExplorePage is now an async Server Component (it awaits
// `getExploreRepository().getExploreData()`, fixture-backed today — see
// `src/features/explore/lib/index.ts`). Next's own docs
// (`node_modules/next/dist/docs/01-app/02-guides/testing/index.md`,
// "Async Server Components") say unit-testing tools don't fully support
// `async` Server Components and recommend E2E for them instead. The
// `render(await ExplorePage())` call below is the common workaround: it
// invokes the async function directly to resolve the element tree first,
// then hands already-resolved JSX to `render()`, sidestepping React DOM's
// lack of async-component support rather than fighting it.
async function renderExplorePage() {
  render(await ExplorePage());
}

describe('ExplorePage', () => {
  it('renders the featured experience and fixture-backed event grid', async () => {
    await renderExplorePage();

    expect(screen.getByRole('heading', { level: 1, name: 'Neon Nights' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Neon Nights featured poster' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /What's on in All Cities/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('6 events found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Sunday Soul' })).toBeInTheDocument();
    expect(screen.getByLabelText('184 people interested')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pause featured events/i })).not.toBeInTheDocument();
  });

  it('searches and filters fixtures without backend behavior', async () => {
    await renderExplorePage();

    fireEvent.change(screen.getByPlaceholderText('Events, venues, artists, cities'), {
      target: { value: 'jazz' },
    });

    expect(screen.getByText('1 event found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Rooftop Jazz' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View Neon Nights' })).not.toBeInTheDocument();
  });

  it('shows an honest empty state and restores fixtures', async () => {
    await renderExplorePage();

    fireEvent.change(screen.getByPlaceholderText('Events, venues, artists, cities'), {
      target: { value: 'not-a-real-fixture' },
    });

    expect(screen.getByText('No events found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getByText('6 events found')).toBeInTheDocument();
  });

  it('changes featured events with accessible carousel controls', async () => {
    await renderExplorePage();

    fireEvent.click(screen.getByRole('button', { name: 'Next featured event' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Rooftop Jazz' })).toBeInTheDocument();
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

    await renderExplorePage();
    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Neon Nights' })).toBeInTheDocument();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('keeps fixture money as paise and does not expose backend fields', () => {
    expect(exploreFixture.events[0]?.price?.amountPaise).toBe(149900);
    expect(JSON.stringify(exploreFixture)).not.toMatch(/api|firebase|firestore|razorpay/i);
  });
});
