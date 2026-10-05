'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { login } from '@c1rcle/auth';

import { safeNextPath } from '@/lib/auth/safe-next-path';

import {
  AuthShell,
  authButtonClass,
  authInputClass,
} from '../../features/auth/components/AuthShell';

function describeLoginError(error: unknown): string {
  if (isApiClientError(error) && error.status === 429) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (error instanceof Error && error.message === 'Authentication failed') {
    return 'Incorrect email or password.';
  }
  if (isApiClientError(error) && error.status !== undefined && error.status >= 500) {
    return 'Sign-in is temporarily unavailable. Please try again shortly.';
  }
  return 'We could not sign you in. Check your details and try again.';
}

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expired = searchParams.get('reason') === 'expired';
  const nextPath = safeNextPath(searchParams.get('next'));

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await login({ email: email.trim(), password });
      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      setError(describeLoginError(caught));
      setPending(false);
    }
  };

  return (
    <AuthShell eyebrow="Member access" title="Sign in">
      {expired && !error && (
        <p role="status" className="mb-5 text-sm text-white/60">
          Your session expired. Sign in again to continue.
        </p>
      )}
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        className="space-y-5"
        noValidate
      >
        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className="text-xs font-bold uppercase tracking-widest text-white/60"
          >
            Email address
          </label>
          <input
            id="login-email"
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
        <div className="space-y-2">
          <label
            htmlFor="login-password"
            className="text-xs font-bold uppercase tracking-widest text-white/60"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
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
          disabled={pending || email.trim().length === 0 || password.length === 0}
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <div className="mt-6 flex flex-col gap-3 text-sm text-white/55">
        <Link href="/forgot-password" className="underline hover:text-white">
          Forgot your password?
        </Link>
        <p>
          New to THE C1RCLE? Guest sign-up is not available on the web yet. Create your account in
          the mobile app, then sign in here.
        </p>
      </div>
    </AuthShell>
  );
}
