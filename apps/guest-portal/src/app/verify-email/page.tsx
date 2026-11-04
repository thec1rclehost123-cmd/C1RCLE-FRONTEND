import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { requireGuestSession } from '@/lib/auth/require-session';
import { safeNextPath } from '@/lib/auth/safe-next-path';

import { SignupClient } from '../signup/signup-client';

export default async function VerifyEmailPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const session = await requireGuestSession('/verify-email');
  const params = await searchParams;
  if (session.user.emailVerified) redirect(safeNextPath(params.next));
  return (
    <Suspense fallback={null}>
      <SignupClient initialEmail={session.user.email} />
    </Suspense>
  );
}
