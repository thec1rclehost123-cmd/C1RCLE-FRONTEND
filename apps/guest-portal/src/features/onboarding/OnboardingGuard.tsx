'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { useSessionStore } from '@c1rcle/auth';

import { guestDestination } from '@/lib/auth/continue-path';
import { captureGuestReturnFragment, restoreGuestReturnFragment } from '@/lib/auth/return-fragment';

import { readOnboardingStatus } from './client';

export function OnboardingGuard({ children }: { readonly children?: ReactNode }) {
  const session = useSessionStore();
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState<string | null>(null);
  const userId = session.session?.user.id ?? '';
  const key = userId;
  const onboardingExempt = [
    '/onboarding',
    '/verify-email',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth',
  ].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  useEffect(() => {
    if (
      !session.hydrated ||
      session.status !== 'authenticated' ||
      !userId ||
      onboardingExempt ||
      checked === key
    )
      return;
    let active = true;
    const intent = pathname + window.location.search;
    captureGuestReturnFragment(intent);
    const next = encodeURIComponent(guestDestination(intent));
    if (session.session?.user.emailVerified === false) {
      router.replace(`/verify-email?next=${next}`);
      return;
    }
    void readOnboardingStatus()
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
    userId,
    onboardingExempt,
    checked,
    key,
  ]);
  if (onboardingExempt || session.status === 'anonymous') return <>{children}</>;
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
