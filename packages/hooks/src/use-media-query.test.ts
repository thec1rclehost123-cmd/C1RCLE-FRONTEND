import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useMediaQuery, usePrefersReducedMotion } from './use-media-query.js';

type ChangeListener = (event: MediaQueryListEvent) => void;

interface MatchMediaStub {
  readonly listeners: Set<ChangeListener>;
  fireChange(): void;
  setMatches(next: boolean): void;
}

function stubMatchMedia(initialMatches: boolean): {
  call: ReturnType<typeof vi.fn<typeof window.matchMedia>>;
  stub: MatchMediaStub;
} {
  const stub: MatchMediaStub = {
    listeners: new Set(),
    fireChange() {
      stub.listeners.forEach((listener) => {
        listener({} as MediaQueryListEvent);
      });
    },
    setMatches(next: boolean) {
      Object.defineProperty(mediaQueryList, 'matches', { value: next, configurable: true });
    },
  };

  const mediaQueryList = {
    get matches() {
      return initialMatches;
    },
    media: '(max-width: 768px)',
    onchange: null,
    addEventListener: (_type: 'change', listener: ChangeListener) => {
      stub.listeners.add(listener);
    },
    removeEventListener: (_type: 'change', listener: ChangeListener) => {
      stub.listeners.delete(listener);
    },
    addListener: (listener: ChangeListener) => {
      stub.listeners.add(listener);
    },
    removeListener: (listener: ChangeListener) => {
      stub.listeners.delete(listener);
    },
    dispatchEvent: () => true,
  };

  const call = vi.fn<typeof window.matchMedia>(() => mediaQueryList as MediaQueryList);
  vi.stubGlobal('matchMedia', call);

  return { call, stub };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaQuery', () => {
  it('returns true when the media query matches', () => {
    stubMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

    expect(result.current).toBe(true);
  });

  it('returns false when the media query does not match', () => {
    stubMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));

    expect(result.current).toBe(false);
  });

  it('subscribes to the given query', () => {
    const { call } = stubMatchMedia(false);

    renderHook(() => useMediaQuery('(orientation: landscape)'));

    expect(call).toHaveBeenCalledWith('(orientation: landscape)');
  });

  it('re-renders with the new value when the match changes', () => {
    const { stub } = stubMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      stub.setMatches(true);
      stub.fireChange();
    });
    expect(result.current).toBe(true);

    act(() => {
      stub.setMatches(false);
      stub.fireChange();
    });
    expect(result.current).toBe(false);
  });

  it('unsubscribes when unmounted', () => {
    const { stub } = stubMatchMedia(false);

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(stub.listeners.size).toBe(1);

    unmount();
    expect(stub.listeners.size).toBe(0);
  });
});

describe('usePrefersReducedMotion', () => {
  it('queries the prefers-reduced-motion media feature', () => {
    const { call } = stubMatchMedia(true);

    const { result } = renderHook(() => usePrefersReducedMotion());

    expect(call).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(result.current).toBe(true);
  });
});
