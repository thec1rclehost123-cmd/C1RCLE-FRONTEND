'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { requestPasswordReset } from '@c1rcle/auth';

export function ForgotPasswordPageClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (caught) {
      if (isApiClientError(caught) && caught.status === 429) {
        setError('Too many requests. Please wait a minute before trying again.');
      } else if (isApiClientError(caught) && caught.status !== 400) {
        setError('We could not send the email right now. Please try again shortly.');
      } else {
        setError('Enter a valid email address.');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-base)] p-6">
      <div className="w-full max-w-md space-y-8">
        <div>
          <p className="text-label-sm text-[var(--accent-primary)] mb-2">ACCOUNT RECOVERY</p>
          <h1 className="text-headline text-[var(--text-primary)]">Reset your password</h1>
        </div>

        {sent ? (
          <div role="status" className="space-y-4 text-[var(--text-secondary)]">
            <p>If an account exists for that email, a reset link has been sent.</p>
            <Link href="/login" className="text-[var(--accent-primary)] underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="space-y-6"
            noValidate
          >
            <p className="text-body text-[var(--text-secondary)]">
              Enter your email and we will send you a link to choose a new password.
            </p>
            <div className="space-y-2">
              <label htmlFor="forgot-email" className="input-label">
                Email Address
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                className="input input-lg"
                placeholder="you@company.com"
              />
            </div>
            {error !== null && (
              <p role="alert" className="text-[14px] text-[var(--state-error)]">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending || email.trim().length === 0}
              className="btn btn-primary btn-xl w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? 'Sending…' : 'Send reset link'}
            </button>
            <Link
              href="/login"
              className="block text-[13px] text-[var(--text-secondary)] underline"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
