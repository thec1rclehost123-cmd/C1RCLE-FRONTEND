import { Suspense } from 'react';

import { ResetPasswordPageClient as PageClient } from './PageClient';

export const metadata = {
  title: 'Choose a new password | THE C1RCLE Partner Dashboard',
  // The reset token arrives in the query string; never leak it via Referer.
  referrer: 'no-referrer' as const,
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PageClient />
    </Suspense>
  );
}
