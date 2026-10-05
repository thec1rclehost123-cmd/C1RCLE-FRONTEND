import { Suspense } from 'react';

import { buildPrivateMetadata } from '@/lib/seo/metadata';

import { ResetPasswordClient } from './reset-password-client';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  ...buildPrivateMetadata(
    'Choose a new password',
    'Set a new password for your THE C1RCLE member account.',
  ),
  // The reset token arrives in the query string; never leak it via Referer.
  referrer: 'no-referrer',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
