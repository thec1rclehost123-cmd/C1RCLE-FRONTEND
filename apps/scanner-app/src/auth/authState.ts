import { useCallback, useEffect, useRef, useState } from 'react';

import { isDevicePaired } from './deviceIdentity';
import { isSessionExpired } from './scannerSession';
import { isStaffSessionActive } from './staffAuth';

/**
 * `logged_out -> needs_pairing -> needs_redeem -> active_session`, with an
 * expired scanner session folding back to `needs_redeem` (redeem again)
 * rather than all the way to `logged_out` — the staff session and device
 * pairing both survive a 12h scanner-session expiry.
 *
 * `needs_pairing` and `needs_redeem` used to be one state
 * (`paired_no_session`), covering both "this device has never been named"
 * and "this device is paired but has no session" — genuinely different
 * situations that both routed to `/pairing`. Once past pairing, a device
 * with no session STAYED in that same bucket and kept redirecting back to
 * `/pairing` instead of `/redeem`, since nothing distinguished the two.
 */
export type ScannerAuthState =
  'logged_out' | 'needs_pairing' | 'needs_redeem' | 'active_session' | 'checking';

/**
 * Module-level pub-sub, same pattern as `src/features/toast/toastStore.ts`.
 *
 * `useScannerAuthState` lives only in `app/_layout.tsx`; login, pairing,
 * redeem and logout are sibling screens rendered inside its `<Slot>`, with
 * no way to reach that hook's own `refresh` closure directly. Every one of
 * them used to navigate with a direct `router.replace(...)` right after
 * changing the state this hook reads — but the hook only re-checks when
 * `refresh()` fires, which nothing called, so `state` (and therefore the
 * root layout's own redirect target) stayed stuck on whatever it was
 * BEFORE the action. The result: `router.replace(...)` would change the
 * pathname, the layout would re-render with that fresh pathname but the
 * STALE state, see a mismatch, and immediately redirect back to the OLD
 * target — silently undoing a successful login, a successful pairing, or
 * a logout, while the network tab showed a clean 200 the whole time.
 * `notifyAuthStateChanged()` is the missing wire: call it, not
 * `router.replace`, right after any action that changes what
 * `isStaffSessionActive`/`isDevicePaired`/`isSessionExpired` would answer,
 * and let the root layout's own redirect do the actual navigating once the
 * async check catches up.
 */
const listeners = new Set<() => void>();

export function notifyAuthStateChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function useScannerAuthState(): { state: ScannerAuthState; refresh: () => void } {
  const [state, setState] = useState<ScannerAuthState>('checking');
  const [tick, setTick] = useState(0);
  // A ref, not a plain `let`, so TypeScript can't statically narrow it to
  // its initial literal value across the async closure below — a `let`
  // here reads as always-false to the type-aware "unnecessary conditional"
  // rule, which is exactly backwards for a real cross-render cancellation flag.
  const cancelledRef = useRef(false);

  const refresh = useCallback(() => {
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    listeners.add(refresh);
    return () => {
      listeners.delete(refresh);
    };
  }, [refresh]);

  // Every other state change reaches this hook via `notifyAuthStateChanged()`
  // called right after some explicit action (login, pairing, redeem,
  // logout). But the in-memory staff access token and the 12h scanner
  // session both expire purely by the clock, with no action to call that
  // from — a staff member can be mid-shift on scan.tsx/door.tsx when the
  // token dies, and without this, `state` never re-evaluates: every
  // subsequent API call 401s and the screen shows a generic "offline"
  // error indefinitely, with no way to self-recover short of an app
  // restart. Polling is coarser than an exact expiry timer, but doesn't
  // need one more piece of state to track "when does the current session
  // expire" — it just asks the same question this hook already knows how
  // to answer, periodically.
  useEffect(() => {
    const interval = setInterval(refresh, 60_000);
    return () => {
      clearInterval(interval);
    };
  }, [refresh]);

  useEffect(() => {
    cancelledRef.current = false;

    void (async () => {
      if (!isStaffSessionActive()) {
        if (!cancelledRef.current) setState('logged_out');
        return;
      }
      const paired = await isDevicePaired();
      if (!paired) {
        if (!cancelledRef.current) setState('needs_pairing');
        return;
      }
      const expired = await isSessionExpired();
      if (!cancelledRef.current) setState(expired ? 'needs_redeem' : 'active_session');
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [tick]);

  return { state, refresh };
}
