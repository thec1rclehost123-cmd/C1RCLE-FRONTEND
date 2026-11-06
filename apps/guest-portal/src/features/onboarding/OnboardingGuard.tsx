'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useSessionStore } from '@c1rcle/auth';

import { guestDestination } from '@/lib/auth/continue-path';
import { isGuestProtectedPath } from '@/lib/auth/protected-path';
import { captureGuestReturnFragment, restoreGuestReturnFragment } from '@/lib/auth/return-fragment';

import { readOnboarding } from './client';

export function OnboardingGuard({ children }: { readonly children?: ReactNode }) {
  const session = useSessionStore();
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState<string | null>(null);
  const key = `${session.session?.user.id ?? ''}:${pathname}`;
  useEffect(() => {
    if (!session.hydrated || session.status !== 'authenticated' || !isGuestProtectedPath(pathname))
      return;
    let active = true;
    const intent = pathname + window.location.search;
    captureGuestReturnFragment(intent);
    const next = encodeURIComponent(guestDestination(intent));
    if (session.session?.user.emailVerified === false) {
      router.replace(`/verify-email?next=${next}`);
      return;
    }
    void readOnboarding()
      .then((state) => {
        if (!active) return;
        if (state.complete) {
          const restored = restoreGuestReturnFragment(intent);
          if (restored !== intent) window.history.replaceState(window.history.state, '', restored);
          setChecked(key);
        } else router.replace(`/onboarding?next=${next}`);
      })
      .catch(() => {
        if (active) router.replace(`/onboarding?next=${next}`);
      });
    return () => {
      active = false;
    };
  }, [
    pathname,
    router,
    session.hydrated,
    session.status,
    session.session?.user.id,
    session.session?.user.emailVerified,
    key,
  ]);
  if (!isGuestProtectedPath(pathname) || session.status === 'anonymous') return <>{children}</>;
  if (
    session.status === 'authenticated' &&
    session.session?.user.emailVerified !== false &&
    checked === key
  )
    return <>{children}</>;
  return (
    <p role="status" className="px-6 py-24 text-sm text-white/70">
      Checking your account…
    </p>
  );
}
