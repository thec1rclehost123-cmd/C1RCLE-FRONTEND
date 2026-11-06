import { Suspense } from 'react';

import { AuthEntryClient } from '@/features/auth/components/AuthEntryClient';
import { buildPrivateMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Login & Member Access',
  'Sign in to your member account to access THE C1RCLE.',
);

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthEntryClient />
    </Suspense>
  );
}
