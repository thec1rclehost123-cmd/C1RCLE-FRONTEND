'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';

import { fetchSession, signup } from '@c1rcle/auth';

import { GoogleButton } from '@/features/auth/components/GoogleButton';
import { guestContinuePath } from '@/lib/auth/continue-path';
import { sendEmailVerification, verifyEmail } from '@/lib/auth/email-verification';
import { captureGuestReturnFragment } from '@/lib/auth/return-fragment';
import { safeNextPath } from '@/lib/auth/safe-next-path';

import {
  AuthShell,
  authButtonClass,
  authInputClass,
} from '../../features/auth/components/AuthShell';

export function SignupClient({
  initialEmail,
  suggestedEmail = '',
}: {
  readonly initialEmail?: string;
  readonly suggestedEmail?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail ?? suggestedEmail);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [created, setCreated] = useState(initialEmail !== undefined);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);
    if (!created && password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setPending(true);
    try {
      if (!created) {
        await signup({ displayName: name.trim(), email: email.trim(), password });
        setCreated(true);
        setPassword('');
        setConfirmation('');
        await sendEmailVerification(email.trim());
        setSent(true);
      } else if (!sent) {
        await sendEmailVerification(email.trim());
        setSent(true);
      } else {
        await verifyEmail(email.trim(), code);
        await fetchSession();
        captureGuestReturnFragment(safeNextPath(params.get('next'), '/explore'));
        router.replace(guestContinuePath(params.get('next')));
        router.refresh();
      }
    } catch {
      setError(
        created
          ? 'We could not verify your email. Check the code or try again shortly.'
          : 'We could not complete signup. Check your details, or sign in if you already have an account.',
      );
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await sendEmailVerification(email.trim());
      setSent(true);
    } catch {
      setError('We could not send a code. Please wait a moment and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Member access"
      title={created ? 'Verify your email' : 'Create your account'}
    >
      {!created && <GoogleButton next={safeNextPath(params.get('next'))} />}
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="space-y-5"
      >
        {created ? (
          <>
            <p className="text-sm text-white/70">
              {sent
                ? `Enter the code sent to ${email.trim()}.`
                : 'Your account is created. Send a code to verify your email.'}
            </p>
            {sent && (
              <label className="block text-sm text-white/70">
                Verification code
                <input
                  aria-label="Verification code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(event) => {
                    setCode(event.target.value);
                  }}
                  className={authInputClass}
                />
              </label>
            )}
          </>
        ) : (
          <>
            <label className="block text-sm text-white/70">
              Name
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                }}
                className={authInputClass}
              />
            </label>
            <label className="block text-sm text-white/70">
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
                className={authInputClass}
              />
            </label>
            <label className="block text-sm text-white/70">
              Password
              <input
                required
                type="password"
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
                className={authInputClass}
              />
            </label>
            <label className="block text-sm text-white/70">
              Confirm password
              <input
                required
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                }}
                className={authInputClass}
              />
            </label>
          </>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
        <button disabled={pending} type="submit" className={authButtonClass}>
          {pending
            ? 'Please wait…'
            : created
              ? sent
                ? 'Verify email'
                : 'Send verification code'
              : 'Create account'}
        </button>
        {created && sent && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              void resend();
            }}
            className="text-sm text-white/70 underline"
          >
            Resend code
          </button>
        )}
      </form>
      <Link
        href={`/login?next=${encodeURIComponent(safeNextPath(params.get('next')))}`}
        className="mt-5 block text-sm text-white/70 underline"
      >
        Already have an account? Sign in
      </Link>
    </AuthShell>
  );
}
