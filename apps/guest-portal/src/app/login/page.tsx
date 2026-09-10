// FIXTURE_ONLY: Temporary UI development page.
// Must not be used as a production API fallback.

import { buildPrivateMetadata } from '@/lib/seo/metadata';

import { LoginPageClient } from './login-page-client';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Login & Member Access',
  'Sign in or create your member account to access THE C1RCLE.',
);

export default function LoginPage() {
  return <LoginPageClient />;
}
