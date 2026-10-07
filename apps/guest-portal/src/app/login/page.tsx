import { Suspense } from 'react';

import { LoginPageClient } from './login-page-client';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Login & Member Access',
  'Sign in to your member account to access THE C1RCLE.',
);

interface LoginSearchParams {
  readonly mode?: string;
  readonly next?: string;
  readonly callbackUrl?: string;
}

function resolveInitialMode(mode: string | undefined): 'login' | 'signup' {
  return mode === 'signup' || mode === 'register' ? 'signup' : 'login';
}

function resolveNextPath(next: string | undefined): string | null {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {
    return null;
  }
  return next;
}

export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<LoginSearchParams>;
}) {
  const params = await searchParams;
  const initialMode = resolveInitialMode(params.mode);
  const nextPath = resolveNextPath(params.next ?? params.callbackUrl);

  return (
    <Suspense>
      <LoginPageClient key={initialMode} initialMode={initialMode} nextPath={nextPath} />
    </Suspense>
  );
}
