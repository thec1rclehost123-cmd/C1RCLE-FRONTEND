import { buildPrivateMetadata } from '@/lib/seo/metadata';

import { ForgotPasswordClient } from './forgot-password-client';

import type { Metadata } from 'next';

export const metadata: Metadata = buildPrivateMetadata(
  'Reset your password',
  'Request a password reset link for your THE C1RCLE member account.',
);

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
