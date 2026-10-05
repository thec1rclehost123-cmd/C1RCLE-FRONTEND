'use client';

import Link from 'next/link';
import React, { useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { requestPasswordReset } from '@c1rcle/auth';

import {
  AuthShell,
  authButtonClass,
  authInputClass,
} from '../../features/auth/components/AuthShell';

export function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
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
      } else if (isApiClientError(caught) && caught.status === 400) {
        setError('Enter a valid email address.');
      } else if (caught instanceof Error && !isApiClientError(caught)) {
        setError('Enter a valid email address.');
      } else {
        setError('We could not send the email right now. Please try again shortly.');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell eyebrow="Account recovery" title="Reset password">
      {sent ? (
        <div role="status" className="space-y-4 text-sm text-white/70">
          <p>If an account exists for that email, a reset link has been sent.</p>
          <Link href="/login" className="underline hover:text-white">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          className="space-y-5"
          noValidate
        >
          <p className="text-sm text-white/55">
            Enter your email and we will send you a link to choose a new password.
          </p>
          <div className="space-y-2">
            <label
              htmlFor="forgot-email"
              className="text-xs font-bold uppercase tracking-widest text-white/60"
            >
              Email address
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
              className={authInputClass}
              placeholder="you@example.com"
            />
          </div>
          {error !== null && (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={authButtonClass}
            disabled={pending || email.trim().length === 0}
          >
            {pending ? 'Sending…' : 'Send reset link'}
          </button>
          <Link href="/login" className="block text-sm text-white/55 underline hover:text-white">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
