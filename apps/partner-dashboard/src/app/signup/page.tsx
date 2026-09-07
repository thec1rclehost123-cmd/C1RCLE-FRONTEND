'use client';

/*
 * @c1rcle/icons does not exist yet in this monorepo (no packages/icons directory); lucide-react
 * is the pre-existing choice shared by every auth/onboarding screen (login, onboard, verify).
 * Tracked as repo-wide debt, not introduced here.
 */
// eslint-disable-next-line no-restricted-imports
import { AlertCircle, ChevronRight, Lock, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { signup } from '@c1rcle/auth';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSignup = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await signup({ displayName, email, password });
      router.push('/onboard');
    } catch (err: unknown) {
      if (isApiClientError(err)) {
        if (err.fieldErrors) {
          const formatted: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.fieldErrors)) {
            if (msgs[0]) {
              formatted[key] = msgs[0];
            }
          }
          setFieldErrors(formatted);
        }
        setError(err.message || 'Signup failed. Please try again.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during signup.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface-base)]">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-[50%] relative flex-col justify-between p-12 overflow-hidden bg-[var(--surface-secondary)]">
        <div className="relative z-10 flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[var(--text-primary)] flex items-center justify-center shadow-lg">
            <span className="text-[var(--text-inverse)] text-xl font-bold">C</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              THE C1RCLE
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
              Partner Network
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-label-sm text-[var(--accent-primary)] mb-4">JOIN THE NETWORK</p>
          <h2 className="text-display text-[var(--text-primary)] mb-6 leading-tight">
            Start Partnering
            <br />
            <span className="text-[var(--accent-primary)]">With Leading Venues</span>
          </h2>
          <p className="text-body-lg text-[var(--text-secondary)] leading-relaxed">
            Create your account to apply for venue, host, or promoter organization access.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-caption text-[var(--text-tertiary)]">
            Protected by enterprise-grade security.
          </p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="relative flex-1 flex items-center justify-center p-6 lg:p-12 overflow-hidden">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h3 className="text-headline text-[var(--text-primary)] mb-2">Create an account</h3>
            <p className="text-body text-[var(--text-secondary)]">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--accent-primary)] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="p-4 bg-[var(--state-error-bg)] border border-red-500/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--state-error)] flex-shrink-0 mt-0.5" />
              <p className="text-[14px] text-[var(--state-error)] font-medium">{error}</p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              void handleSignup(e);
            }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label htmlFor="signup-display-name" className="input-label">
                Full Name / Display Name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                <input
                  id="signup-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); }}
                  required
                  className="input input-lg pl-12"
                  placeholder="Jane Doe"
                />
              </div>
              {fieldErrors['displayName'] && (
                <p className="text-xs text-[var(--state-error)]">{fieldErrors['displayName']}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-email" className="input-label">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); }}
                  required
                  className="input input-lg pl-12"
                  placeholder="you@company.com"
                />
              </div>
              {fieldErrors['email'] && (
                <p className="text-xs text-[var(--state-error)]">{fieldErrors['email']}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-password" className="input-label">
                Password (min. 8 characters)
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); }}
                  required
                  minLength={8}
                  className="input input-lg pl-12"
                  placeholder="••••••••"
                />
              </div>
              {fieldErrors['password'] && (
                <p className="text-xs text-[var(--state-error)]">{fieldErrors['password']}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="signup-confirm-password" className="input-label">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                <input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); }}
                  required
                  minLength={8}
                  className="input input-lg pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-xl w-full group disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                {loading ? 'Creating Account...' : 'Continue to Onboarding'}
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
