import { useEffect } from 'react';

import { sendHeartbeat } from '@/api/scannerApiClient';

const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * Fires `POST /door/heartbeat` on an interval while mounted (i.e. while the
 * app is foregrounded inside the tab shell with an active session). Whether
 * this should continue while backgrounded is the open Phase 0 question in
 * `docs/scanner-app/06-v1-vs-v2-and-rollout.md` — this hook only runs while
 * its host screen is mounted, which React Native already pauses on
 * background by virtue of JS execution being suspended, so no explicit
 * AppState handling is added until that question is resolved.
 */
export function useHeartbeat(): void {
  useEffect(() => {
    const interval = setInterval(() => {
      // A dropped heartbeat is expected and harmless (dev-server restart
      // mid-flight, a brief network hiccup) — the next tick 60s later
      // covers for it. Without this catch it was an uncaught promise
      // rejection on every single failure. `no-console` forbids logging it
      // client-side; silently swallowing is correct here regardless — a
      // failed heartbeat has nothing actionable for the user to do.
      void sendHeartbeat().catch(() => undefined);
    }, HEARTBEAT_INTERVAL_MS);
    return () => {
      clearInterval(interval);
    };
  }, []);
}
