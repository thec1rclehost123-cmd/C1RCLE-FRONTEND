'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSessionStore } from '@c1rcle/auth';

import type { ReactNode } from 'react';

const EXEMPT_PREFIXES = ['/change-password', '/login', '/signup'];

/**
 * Global first-login rotation guard. An account still on its staff-invitation
 * temporary password is routed to `/change-password` (preserving the
 * destination as `?next=`) from everywhere else — the gateway 403s every
 * non-auth route until the rotation completes, so this keeps the UI ahead
 * of the API instead of showing a wall of forbidden errors.
 */
export function PasswordChangeGuard({ children }: { readonly children: ReactNode }) {
  const sessionState = useSessionStore();
  const pathname = usePathname();
  const router = useRouter();

  const mustChange = sessionState.session?.user.mustChangePassword === true;
  const exempt = EXEMPT_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  useEffect(() => {
    if (
      sessionState.hydrated &&
      sessionState.status === 'authenticated' &&
      mustChange &&
      !exempt
    ) {
      router.replace(`/change-password?next=${encodeURIComponent(pathname)}`);
    }
  }, [sessionState.hydrated, sessionState.status, mustChange, exempt, pathname, router]);

  return <>{children}</>;
}
