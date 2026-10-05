'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { resetPassword } from '@c1rcle/auth';

import {
  AuthShell,
  authButtonClass,
  authInputClass,
} from '../../features/auth/components/AuthShell';

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The one-time token lives only in this ref: captured once, then stripped
  // from the URL so it cannot leak via history, Referer or screenshots.
  const tokenRef = useRef<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenRef.current === null) {
      const token = searchParams.get('token');
      if (token !== null && token.length > 0) {
        tokenRef.current = token;
        router.replace('/reset-password');
      }
      setHasToken(tokenRef.current !== null);
    }
  }, [router, searchParams]);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || tokenRef.current === null) return;
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await resetPassword({ token: tokenRef.current, newPassword: password });
      tokenRef.current = null;
      setDone(true);
    } catch (caught) {
      if (isApiClientError(caught) && caught.status === 429) {
        setError('Too many attempts. Please wait a minute and try again.');
      } else if (isApiClientError(caught) && caught.status !== undefined && caught.status >= 500) {
        setError('We could not reset your password right now. Please try again shortly.');
      } else {
        setError('This reset link is invalid or has expired. Request a new one.');
      }
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <AuthShell eyebrow="Account recovery" title="Password updated">
        <div role="status" className="space-y-4 text-sm text-white/70">
          <p>Your password has been changed. Sign in with your new password.</p>
          <Link href="/login" className="underline hover:text-white">
            Go to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (hasToken === false) {
    return (
      <AuthShell eyebrow="Account recovery" title="Link missing">
        <div role="alert" className="space-y-4 text-sm text-white/70">
          <p>This reset link is invalid or incomplete.</p>
          <Link href="/forgot-password" className="underline hover:text-white">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Account recovery" title="Choose a new password">
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-2">
          <label
            htmlFor="reset-password"
            className="text-xs font-bold uppercase tracking-widest text-white/60"
          >
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            className={authInputClass}
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="reset-confirm"
            className="text-xs font-bold uppercase tracking-widest text-white/60"
          >
            Confirm password
          </label>
          <input
            id="reset-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
              setError(null);
            }}
            className={authInputClass}
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
          disabled={pending || hasToken === null || password.length === 0}
        >
          {pending ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  );
}
