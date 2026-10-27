import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StickyEventCheckoutCta } from './StickyEventCheckoutCta';

let intersectionCallback: IntersectionObserverCallback | undefined;

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];

  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback;
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn(() => []);
}

afterEach(() => {
  vi.unstubAllGlobals();
  intersectionCallback = undefined;
});

describe('StickyEventCheckoutCta', () => {
  it('stays out of the ticket selector and appears after it leaves view', async () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    render(
      <>
        <aside id="event-ticket-selector">Ticket tiers</aside>
        <StickyEventCheckoutCta href="/checkout/event" label="Buy tickets" className="accent" />
      </>,
    );

    expect(screen.queryByRole('link', { name: 'Buy tickets' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(intersectionCallback).toBeDefined();
    });
    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(screen.queryByRole('link', { name: 'Buy tickets' })).not.toBeInTheDocument();

    act(() => {
      intersectionCallback?.(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });
    expect(screen.getByRole('link', { name: 'Buy tickets' })).toHaveAttribute(
      'href',
      '/checkout/event',
    );
  });

  it('does not cover the selector when IntersectionObserver is unavailable', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    render(
      <>
        <aside id="event-ticket-selector">Ticket tiers</aside>
        <StickyEventCheckoutCta href="/checkout/event" label="Buy tickets" className="accent" />
      </>,
    );

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Buy tickets' })).not.toBeInTheDocument();
    });
  });
});
