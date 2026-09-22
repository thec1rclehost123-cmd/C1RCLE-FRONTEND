'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { logout, markAnonymous, markHydrated, refresh, setSession } from '@c1rcle/auth';

import type { getServerSession } from '@c1rcle/auth/server-session';

/**
 * Idle timeout (minutes) after which the session is revoked client-side.
 * Any pointer/key activity or a visibility change resets the clock.
 */
const IDLE_TIMEOUT_MS = 30 * 60_000;

export interface SessionProviderProps {
  /** Server bootstrap from `getServerSession()` — carries no access token. */
  readonly initialUser: Awaited<ReturnType<typeof getServerSession>>;
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

  return <>{children}</>;
}
