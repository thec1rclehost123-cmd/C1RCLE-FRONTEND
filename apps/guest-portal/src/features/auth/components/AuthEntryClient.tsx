'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { LoginPageClient } from '@/app/login/login-page-client';
import { SignupClient } from '@/app/signup/signup-client';
import { guestDestination } from '@/lib/auth/continue-path';

import { AuthShell, authButtonClass, authInputClass } from './AuthShell';
import { GoogleButton } from './GoogleButton';

/** Email entry never queries account existence; the Guest chooses their next action. */
export function AuthEntryClient() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [continued, setContinued] = useState(false);
  const [method, setMethod] = useState<'login' | 'signup' | null>(null);
  if (method === 'login') return <LoginPageClient suggestedEmail={email} />;
  if (method === 'signup') return <SignupClient suggestedEmail={email} />;
  return (
    <AuthShell eyebrow="Member access" title="Join the C1RCLE">
      {params.get('reason') === 'expired' && (
        <p role="status" className="mb-4 text-sm text-white/70">
          Your session expired. Sign in again to continue.
        </p>
      )}
      {params.get('reason') === 'google' && (
        <p role="alert" className="mb-4 text-sm text-white/70">
          Google sign-in was not completed. Try again or continue with email.
        </p>
      )}
      <GoogleButton next={guestDestination(params.get('next'))} />
      <p className="mb-5 text-center text-sm text-white/50">or continue with email</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setContinued(true);
        }}
        className="space-y-5"
      >
        <label className="block text-sm text-white/70">
          Email address
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setContinued(false);
            }}
            className={authInputClass}
          />
        </label>
        {!continued ? (
          <button className={authButtonClass}>Continue</button>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => {
                setMethod('login');
              }}
              className={authButtonClass}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMethod('signup');
              }}
              className="min-h-12 w-full rounded-full border border-white/25 px-6 text-sm text-white"
            >
              Create account
            </button>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
