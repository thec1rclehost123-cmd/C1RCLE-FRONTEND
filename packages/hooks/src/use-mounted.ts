import { useSyncExternalStore } from 'react';

const noopSubscribe = (): (() => void) => () => undefined;
const getClientSnapshot = (): boolean => true;
const getServerSnapshot = (): boolean => false;

/**
 * False during SSR and hydration, true on the client afterwards.
 *
 * Use it to defer rendering of anything that cannot exist on the server
 * (portals, theme-dependent markup) instead of reaching for `typeof window`.
 *
 * Implemented with `useSyncExternalStore` rather than the usual
 * `useState` + `useEffect` pair: React resolves the server/client snapshot
 * difference during hydration itself, so there is no synchronous `setState`
 * inside an effect and therefore no cascading second render.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, getClientSnapshot, getServerSnapshot);
}
