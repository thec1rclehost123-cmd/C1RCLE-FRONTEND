import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { guestOnboardingStateSchema } from '@c1rcle/contracts/guest-onboarding';

import { guestDestination } from '@/lib/auth/continue-path';
import { isGuestProtectedPath } from '@/lib/auth/protected-path';
import { requireGuestSession } from '@/lib/auth/require-session';
import { forwardToGateway } from '@/lib/bff/auth-proxy';

export default async function ContinueGuest({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = guestDestination(params.next);
  const session = await requireGuestSession(`/auth/continue?next=${encodeURIComponent(next)}`);
  if (!isGuestProtectedPath(next)) redirect(next);
  if (!session.user.emailVerified) redirect(`/verify-email?next=${encodeURIComponent(next)}`);
  let complete = false;
  try {
    const response = await forwardToGateway('/api/v2/profile/onboarding', {
      method: 'GET',
      cookie: (await cookies()).toString(),
    });
    if (response.ok) complete = guestOnboardingStateSchema.parse(await response.json()).complete;
  } catch {
    /* Onboarding renders a retry state rather than bypassing required progress. */
  }
  redirect(complete ? next : `/onboarding?next=${encodeURIComponent(next)}`);
}
