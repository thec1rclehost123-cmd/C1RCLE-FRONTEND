'use client';

import { motion, useReducedMotion } from 'framer-motion';
/*
 * @c1rcle/icons does not exist yet in this monorepo (no packages/icons directory); lucide-react
 * is the pre-existing choice shared by every auth/onboarding screen (signup, onboard, verify).
 * Tracked as repo-wide debt, not introduced here — swap all four call sites together once the
 * package lands.
 */
// eslint-disable-next-line no-restricted-imports
import { Mail, Lock, AlertCircle, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { login, useSessionStore } from '@c1rcle/auth';

import {
  normalizePartnerRole,
  resolvePartnerV3Path,
} from '@/components/partner-shell/partner-role-routing';
import { setActiveOrg } from '@/lib/org/active-org';
import { getOrganizations } from '@/lib/org/org-repository';

const RING_SPECS = [
  { deg: 0, sizeClass: 'w-[340px] h-[340px]', duration: 10 },
  { deg: 120, sizeClass: 'w-[420px] h-[420px]', duration: 13 },
  { deg: 240, sizeClass: 'w-[500px] h-[500px]', duration: 16 },
] as const;

/** Ambient background — a fixed brand accent, no per-role theming (the workspace-type picker is gone). */
function AmbientBg() {
  const reduceMotion = useReducedMotion();
  const [compactViewport, setCompactViewport] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => {
      setCompactViewport(query.matches);
    };
    update();
    query.addEventListener('change', update);
    return () => {
      query.removeEventListener('change', update);
    };
  }, []);

  const animateBackground = !reduceMotion && !compactViewport;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] blur-[70px] bg-[rgba(244,74,34,0.18)]"
        {...(animateBackground
          ? {
              animate: { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] },
              transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const },
            }
          : {})}
      />
      {RING_SPECS.map(({ deg, sizeClass, duration }) => (
        <motion.div
          key={deg}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-solid border-t-[rgba(244,74,34,0.5)] border-r-transparent border-b-[rgba(244,74,34,0.2)] border-l-[rgba(244,74,34,0.2)] ${sizeClass}`}
          initial={{ rotate: deg }}
          {...(animateBackground
            ? {
                animate: { rotate: [deg, deg + 360] },
                transition: { duration, repeat: Infinity, ease: 'linear' as const },
              }
            : {})}
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const sessionState = useSessionStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sessionState.status === 'authenticated' && sessionState.session?.user) {
      const next = searchParams.get('next') ?? searchParams.get('callbackUrl');
      if (next) {
        router.replace(next);
      }
    }
  }, [sessionState.status, sessionState.session, searchParams, router]);

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      await login({ email, password });

      const next = searchParams.get('next') ?? searchParams.get('callbackUrl');
      if (next) {
        router.push(next);
        return;
      }

      try {
        const orgs = await getOrganizations();
        if (orgs.length === 0) {
          router.push('/onboard');
        } else if (orgs.length === 1 && orgs[0]) {
          await setActiveOrg(orgs[0].id);
          const role = normalizePartnerRole(orgs[0].role);
          router.push(resolvePartnerV3Path(role) ?? '/venue');
        } else {
          router.push('/partner/select-organization');
        }
      } catch {
        router.push('/partner/select-organization');
      }
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
        setError(err.message || 'Invalid email or password.');
      } else if (err instanceof Error && err.message === 'Authentication failed') {
        setError('Invalid email or password. Please check your credentials or create a new account.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface-base)]">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-[var(--surface-secondary)]">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,currentColor_1px,transparent_0)] bg-[length:32px_32px]" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[var(--text-primary)] flex items-center justify-center shadow-lg">
              <span className="text-[var(--text-inverse)] text-xl font-bold">C</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                THE C1RCLE
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                Partner Dashboard
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-label-sm text-[var(--accent-primary)] mb-4">ENTERPRISE PLATFORM</p>
            <h2 className="text-display text-[var(--text-primary)] mb-6 leading-tight">
              Command Your
              <br />
              <span className="text-[var(--accent-primary)]">Nightlife Empire</span>
            </h2>
            <p className="text-body-lg text-[var(--text-secondary)] leading-relaxed max-w-md">
              Real-time analytics, seamless operations, and complete control over your venue,
              events, and promoter network—all in one powerful platform.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10">
          <p className="text-caption text-[var(--text-tertiary)]">
            Secure access for authorized partners only. Protected by enterprise-grade encryption.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="relative flex-1 flex items-center justify-center p-6 lg:p-12 overflow-hidden">
        <AmbientBg />
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="lg:hidden flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--text-primary)] flex items-center justify-center">
                <span className="text-[var(--text-inverse)] font-bold">C</span>
              </div>
              <span className="text-title font-bold text-[var(--text-primary)]">THE C1RCLE</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-headline text-[var(--text-primary)] mb-2">Welcome back</h3>
              <p className="text-body text-[var(--text-secondary)]">Sign in to your workspace.</p>
            </div>

            {error && (
              <div className="p-4 bg-[var(--state-error-bg)] border border-red-500/20 rounded-2xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--state-error)] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[14px] text-[var(--state-error)] font-medium">{error}</p>
                  <button
                    type="button"
                    onClick={() => { router.push(`/signup${email ? `?email=${encodeURIComponent(email)}` : ''}`); }}
                    className="text-[13px] font-semibold text-[var(--accent-primary)] underline mt-2 block hover:no-underline"
                  >
                    Don&apos;t have an account? Sign up here →
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={(e) => {
                void handleLogin(e);
              }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label htmlFor="login-email" className="input-label">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                  <input
                    id="login-email"
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
                <label htmlFor="login-password" className="input-label">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); }}
                    required
                    className="input input-lg pl-12 pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => { setShowPassword(!showPassword); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors['password'] && (
                  <p className="text-xs text-[var(--state-error)]">{fieldErrors['password']}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-xl w-full group cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Continue to Dashboard
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </div>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-caption text-[var(--text-tertiary)]">New to C1RCLE?</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          <div className="card p-6 text-center">
            <p className="text-body-sm text-[var(--text-secondary)] mb-4">
              Join our network of premium nightlife venues, hosts, and promoters.
            </p>
            <button onClick={() => { router.push('/onboard'); }} className="btn btn-secondary w-full">
              Apply for Partner Access
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex bg-[var(--surface-base)]">
      <div className="hidden lg:block lg:w-[55%] bg-[var(--surface-secondary)]" />
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="skeleton h-10 w-48 rounded-lg" />
          <div className="skeleton h-6 w-64 rounded-lg" />
          <div className="skeleton h-14 w-full rounded-2xl" />
          <div className="skeleton h-14 w-full rounded-2xl" />
          <div className="skeleton h-16 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/*
 * Next.js `page.tsx` requires a default export; this `PageClient.tsx` split is the pre-existing
 * pattern shared by every route in this app (onboard, verify) and predates this change.
 */
// eslint-disable-next-line import-x/no-default-export
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
