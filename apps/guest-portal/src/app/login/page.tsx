// FIXTURE_ONLY: Temporary UI development page.
// Must not be used as a production API fallback.

import { LoginPageClient } from './login-page-client';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login & Member Access | THE C1RCLE',
  description:
    'Sign in or create your member account to access exclusive events, tickets, and night life experiences with THE C1RCLE.',
};

export default function LoginPage() {
  return <LoginPageClient />;
}
