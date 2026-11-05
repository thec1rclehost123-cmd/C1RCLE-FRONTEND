import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { guestContinuePath } from '@/lib/auth/continue-path';
import { requireGuestSession } from '@/lib/auth/require-session';

import { SignupClient } from '../signup/signup-client';

export default async function VerifyEmailPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const session = await requireGuestSession('/verify-email');
  const params = await searchParams;
  if (session.user.emailVerified) redirect(guestContinuePath(params.next));
  return (
    <Suspense fallback={null}>
      <SignupClient initialEmail={session.user.email} />
    </Suspense>
  );
}
