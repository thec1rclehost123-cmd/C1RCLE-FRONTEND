'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { hydrateSession, logout, markAnonymous, markHydrated, setSession } from '@c1rcle/auth';

import { OnboardingGuard } from '@/features/onboarding/OnboardingGuard';

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
 * Thin session bootstrap provider. Hydrates the in-memory user/expiry state
 * from the server bootstrap, confirms the cookie session through the BFF, and
 * runs the idle timeout + focus-refresh. Everything else reads `useSession()`.
 */
export function SessionProvider({ initialUser, children }: SessionProviderProps) {
  const router = useRouter();

  useEffect(() => {
    if (initialUser !== null) {
      /*
       * The server bootstrap only proves an httpOnly session exists. The BFF
       * establishes this app's namespaced CSRF cookie and confirms the cookie
       * session; the Gateway bearer token stays server-side.
       */
      setSession(initialUser, null, 0);
      void hydrateSession().then((recovered) => {
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

  return <OnboardingGuard>{children}</OnboardingGuard>;
}
