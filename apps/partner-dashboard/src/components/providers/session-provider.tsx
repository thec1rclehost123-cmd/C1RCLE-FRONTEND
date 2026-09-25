'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import {
  logout,
  markAnonymous,
  markHydrated,
  refresh,
  setSession,
  useSessionStore,
} from '@c1rcle/auth';

import type { User } from '@c1rcle/contracts';

/**
 * Idle timeout (minutes) after which the session is revoked client-side.
 * Any pointer/key activity or a visibility change resets the clock.
 */
const IDLE_TIMEOUT_MS = 30 * 60_000;

/** Refresh the token when returning to the tab within this window of expiry. */
const FOCUS_REFRESH_WINDOW_MS = 5 * 60_000;

/**
 * Key for the tab-session guard that stops the auto-refresh from re-firing on
 * every full page load when the BFF refresh keeps being rejected (403).
 */
const BOOTSTRAP_GUARD_KEY = 'c1rcle.session.bootstrap';

/** Read whether this tab already attempted (and settled) a bootstrap refresh. */
function bootstrapGuardValue(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.sessionStorage.getItem(BOOTSTRAP_GUARD_KEY);
}

/** Clear the guard so a successful login is followed by a fresh refresh. */
function clearBootstrapGuard(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.removeItem(BOOTSTRAP_GUARD_KEY);
}

/**
 * Reset the tab-session guard after a successful authentication (login/signup)
 * so the next full page load performs a proper refresh instead of short-
 * circuiting to anonymous.
 */
export function clearSessionBootstrapGuard(): void {
  clearBootstrapGuard();
}

export interface SessionProviderProps {
  /** Server bootstrap from `getServerSession()` — carries no access token. */
  readonly initialUser: { user: User } | null;
  readonly children: ReactNode;
}

/**
 * Thin session bootstrap provider. Hydrates the in-memory session store from
 * the server bootstrap, obtains a fresh access token, and runs the idle
 * timeout + focus-refresh. Everything else reads `useSession()` directly.
 */
export function SessionProvider({ initialUser, children }: SessionProviderProps) {
  const router = useRouter();

  useEffect(() => {
    if (initialUser !== null) {
      /*
       * The server bootstrap only proves an httpOnly session exists — the
       * access token is not readable server-side, so it starts null and one
       * refresh is performed to obtain it (the BFF exchanges the refresh
       * cookie same-origin).
       */
      setSession(initialUser, null, 0);
      void refresh().then((recovered) => {
        if (!recovered) {
          markAnonymous();
        }
        markHydrated();
      });
    } else {
      markAnonymous();
      markHydrated();
    }
  }, [initialUser]);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const onIdle = () => {
      void logout().then(() => {
        router.replace('/login');
      });
    };

    const resetIdleTimer = () => {
      if (idleTimer !== undefined) {
        clearTimeout(idleTimer);
      }
      idleTimer = setTimeout(onIdle, IDLE_TIMEOUT_MS);
    };

    window.addEventListener('pointerdown', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    document.addEventListener('visibilitychange', resetIdleTimer);
    resetIdleTimer();

    return () => {
      if (idleTimer !== undefined) {
        clearTimeout(idleTimer);
      }
      window.removeEventListener('pointerdown', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      document.removeEventListener('visibilitychange', resetIdleTimer);
    };
  }, [router]);

  useEffect(() => {
    const onVisibilityChanged = () => {
      if (document.visibilityState === 'visible' && bootstrapGuardValue() !== 'settled-anonymous') {
        const expiresAt = useSessionStore.getState().expiresAt;
        if (expiresAt !== null && expiresAt - Date.now() < FOCUS_REFRESH_WINDOW_MS) {
          void refresh();
        }
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChanged);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChanged);
    };
  }, []);

  return <>{children}</>;
}
