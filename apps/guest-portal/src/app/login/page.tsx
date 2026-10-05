import { Suspense } from 'react';

import { buildPrivateMetadata } from '@/lib/seo/metadata';

import { LoginPageClient } from './login-page-client';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Login & Member Access',
  'Sign in to your member account to access THE C1RCLE.',
);

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
