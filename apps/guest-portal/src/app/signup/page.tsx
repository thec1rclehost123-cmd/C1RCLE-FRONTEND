import { Suspense } from 'react';

import { AuthEntryClient } from '@/features/auth/components/AuthEntryClient';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up | THE C1RCLE',
  description:
    'Create your THE C1RCLE member account to access exclusive events, tickets, and night life experiences.',
};

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthEntryClient />
    </Suspense>
  );
}
