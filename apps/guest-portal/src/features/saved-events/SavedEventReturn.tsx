'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useSessionStore } from '@c1rcle/auth';

/** Mounted only after the existing protected-route OnboardingGuard permits it. */
export function SavedEventReturn({ destination }: { destination: string }) {
  const router = useRouter();
  const { hydrated, status } = useSessionStore();
  useEffect(() => {
    if (hydrated && status === 'authenticated') router.replace(destination);
  }, [destination, router, hydrated, status]);
  return (
    <p role="status" className="px-5 pb-24 pt-36 text-sm text-white/70">
      Returning to your event…
    </p>
  );
}
