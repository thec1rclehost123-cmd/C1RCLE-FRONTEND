import { Suspense } from 'react';

import { OnboardingClient } from '@/features/onboarding/OnboardingClient';
import { requireGuestSession } from '@/lib/auth/require-session';

export default async function OnboardingPage() {
  const session = await requireGuestSession('/onboarding');
  return (
    <Suspense fallback={null}>
      <OnboardingClient initialName={session.user.displayName} />
    </Suspense>
  );
}
