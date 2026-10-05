'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { clearSession, markAnonymous, markHydrated, refresh, useSessionStore } from '@c1rcle/auth';
import { getClientEnv } from '@c1rcle/config';

const PRIVATE_PREFIXES = ['/profile', '/tickets', '/help', '/checkout', '/confirmation'];

/** Renew this long before the session's `expiresAt`. */
const RENEW_LEAD_MS = 60_000;

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** The CSRF cookie is the only readable trace of a BFF-issued login. */
function hasBffLogin(): boolean {
  const name = `${getClientEnv().NEXT_PUBLIC_APP_ID}.c1rcle.csrf=`;
  return document.cookie.split('; ').some((entry) => entry.startsWith(name));
}

/**
 * Hydrates the in-memory session on first load (silent refresh through the
 * BFF), renews it shortly before expiry and on tab refocus, and sends the
 * guest to login with a return path when a private page loses its session.
 */
export function SessionBootstrap() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const expire = () => {
      clearSession();
      const current = window.location.pathname;
      if (isPrivatePath(current)) {
        router.replace(`/login?next=${encodeURIComponent(current)}&reason=expired`);
      }
    };

    const schedule = () => {
      if (timer !== undefined) clearTimeout(timer);
      const expiresAt = useSessionStore.getState().expiresAt;
      if (expiresAt === null || expiresAt <= 0) return;
      const delay = Math.max(expiresAt - Date.now() - RENEW_LEAD_MS, 5_000);
      timer = setTimeout(
        () => {
          void renew();
        },
        Math.min(delay, 2_147_000_000),
      );
    };

    const renew = async () => {
      const ok = await refresh();
      if (cancelled) return;
      if (ok) schedule();
      else expire();
    };

    if (hasBffLogin()) {
      void refresh().then((ok) => {
        if (cancelled) return;
        if (ok) schedule();
        else markAnonymous();
        markHydrated();
      });
    } else {
      markAnonymous();
      markHydrated();
    }

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const { status, expiresAt } = useSessionStore.getState();
      if (
        status === 'authenticated' &&
        expiresAt !== null &&
        expiresAt - Date.now() < RENEW_LEAD_MS
      ) {
        void renew();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [router]);

  // Re-evaluate on navigation: landing on a private page while anonymous after
  // hydration (e.g. cookie expired mid-session) goes to login.
  useEffect(() => {
    const { status, hydrated } = useSessionStore.getState();
    if (hydrated && status === 'anonymous' && isPrivatePath(pathname) && !hasBffLogin()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  return null;
}
