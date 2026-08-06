import { useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query.
 *
 * Implemented with `useSyncExternalStore` so the server snapshot is explicit
 * (`false`) rather than accidental — a media query cannot be evaluated during
 * SSR, and pretending otherwise causes hydration mismatches.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True when the user has asked the OS to reduce motion. */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}
