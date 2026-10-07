import { Suspense } from 'react';

import { ForgotPasswordPageClient as PageClient } from './PageClient';

export const metadata = {
  title: 'Reset password | THE C1RCLE Partner Dashboard',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <PageClient />
    </Suspense>
  );
}
