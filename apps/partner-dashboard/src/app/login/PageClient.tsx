'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
/*
 * @c1rcle/icons does not exist yet in this monorepo (no packages/icons directory); lucide-react
 * is the pre-existing choice shared by every auth/onboarding screen (signup, onboard, verify).
 * Tracked as repo-wide debt, not introduced here — swap all four call sites together once the
 * package lands.
 */
// eslint-disable-next-line no-restricted-imports
import {
  Mail,
  Lock,
  AlertCircle,
  ChevronRight,
  Building2,
  Users,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { login, logout, useSessionStore } from '@c1rcle/auth';

import {
  normalizePartnerRole,
  resolvePartnerV3Path,
} from '@/components/partner-shell/partner-role-routing';
import { setActiveOrg } from '@/lib/org/active-org';
import { getOrganizations } from '@/lib/org/org-repository';
import { filterOrgsByPartnerType } from '@/lib/org/route-after-auth';

import type { WorkspaceType } from '@/lib/org/route-after-auth';

const roleConfig = {
  venue: {
    icon: Building2,
    label: 'Venue',
    description: 'Full venue operations',
  },
  host: {
    icon: Users,
    label: 'Host',
    description: 'Event management',
  },
  promoter: {
    icon: Zap,
    label: 'Promoter',
    description: 'Sales & outreach',
  },
} as const satisfies Record<WorkspaceType, { icon: typeof Building2; label: string; description: string }>;

const bgPalette: Record<WorkspaceType, { primary: string; ring: string; blob: string }> = {
  venue: { primary: '#F44A22', ring: 'rgba(244,74,34,VAL)', blob: 'rgba(244,74,34,0.12)' },
  host: { primary: '#FFFFFF', ring: 'rgba(255,255,255,VAL)', blob: 'rgba(255,255,255,0.08)' },
  promoter: { primary: '#22C55E', ring: 'rgba(34,197,94,VAL)', blob: 'rgba(34,197,94,0.12)' },
};

/** Role-tinted ambient background — swaps colour with the selected workspace, ported from login-legacy. */
function WorkspaceBg({ type }: { type: WorkspaceType | null }) {
  const p = type ? bgPalette[type] : null;
  const r = (a: number) => p?.ring.replace('VAL', String(a)) ?? 'transparent';
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
    <AnimatePresence mode="wait">
      {type && p && (
        <motion.div
          key={type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              background: type === 'venue' ? 'rgba(244,74,34,0.22)' : p.blob,
              filter: type === 'venue' ? 'blur(60px)' : 'blur(80px)',
              width: type === 'venue' ? 420 : 500,
              height: type === 'venue' ? 420 : 500,
              top: '50%',
              left: '50%',
              x: '-50%',
              y: '-50%',
            }}
            {...(animateBackground
              ? {
                  animate:
                    type === 'venue'
                      ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }
                      : type === 'host'
                        ? {
                            x: ['-50%', '-40%', '-60%', '-50%'],
                            y: ['-50%', '-60%', '-40%', '-50%'],
                            scale: [1, 1.1, 1],
                          }
                        : { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] },
                  transition: {
                    duration: type === 'host' ? 6 : 3,
                    repeat: Infinity,
                    ease: 'easeInOut' as const,
                  },
                }
              : {})}
          />

          {[0, 120, 240].map((deg, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: 340 + i * 80,
                height: 340 + i * 80,
                top: '50%',
                left: '50%',
                x: '-50%',
                y: '-50%',
                borderTopWidth: 1,
                borderRightWidth: 1,
                borderBottomWidth: 1,
                borderLeftWidth: 1,
                borderStyle: 'solid',
                borderRadius: '50%',
                borderTopColor: r(0.75),
                borderRightColor: 'transparent',
                borderBottomColor: r(0.25),
                borderLeftColor: r(0.25),
                rotate: deg,
              }}
              {...(animateBackground
                ? {
                    animate: { rotate: [deg, deg + 360] },
                    transition: { duration: 8 + i * 3, repeat: Infinity, ease: 'linear' as const },
                  }
                : {})}
            />
          ))}

          <motion.div
            className="absolute bottom-8 right-8 rounded-full"
            style={{ width: 6, height: 6, background: p.primary }}
            {...(animateBackground
              ? {
                  animate: { opacity: [1, 0.2, 1] },
                  transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const },
                }
              : {})}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SPARKLE_SPECS = [
  { x: 5, size: 3, dur: 9, delay: 0, ci: 0 },
  { x: 12, size: 4, dur: 13, delay: 1.5, ci: 1 },
  { x: 18, size: 5, dur: 11, delay: 0.8, ci: 2 },
  { x: 25, size: 3, dur: 15, delay: 2.2, ci: 0 },
  { x: 31, size: 4, dur: 10, delay: 0.4, ci: 1 },
  { x: 38, size: 3, dur: 14, delay: 3.0, ci: 2 },
  { x: 44, size: 5, dur: 12, delay: 1.8, ci: 0 },
  { x: 50, size: 3, dur: 16, delay: 0.6, ci: 1 },
  { x: 56, size: 4, dur: 8, delay: 2.5, ci: 2 },
  { x: 62, size: 3, dur: 13, delay: 1.1, ci: 0 },
  { x: 68, size: 5, dur: 11, delay: 3.5, ci: 1 },
  { x: 74, size: 3, dur: 14, delay: 0.9, ci: 2 },
  { x: 80, size: 4, dur: 10, delay: 2.8, ci: 0 },
  { x: 86, size: 3, dur: 17, delay: 1.3, ci: 1 },
  { x: 92, size: 5, dur: 9, delay: 0.2, ci: 2 },
  { x: 8, size: 3, dur: 15, delay: 4.0, ci: 1 },
  { x: 15, size: 4, dur: 12, delay: 2.0, ci: 2 },
  { x: 22, size: 3, dur: 11, delay: 3.2, ci: 0 },
  { x: 29, size: 5, dur: 13, delay: 0.7, ci: 1 },
  { x: 35, size: 3, dur: 16, delay: 1.6, ci: 2 },
] as const;

/** Per-role ring colours for the sparkle field — tri-colour default, single colour once a workspace is picked. */
function useRingColors(type: WorkspaceType | null): [string, string, string] {
  const venue = 'rgba(244,74,34,VAL)';
  const host = 'rgba(255,255,255,VAL)';
  const promoter = 'rgba(34,197,94,VAL)';
  if (type === 'venue') return [venue, venue, venue];
  if (type === 'host') return [host, host, host];
  if (type === 'promoter') return [promoter, promoter, promoter];
  return [venue, host, promoter];
}

function SparkleField({ type }: { type: WorkspaceType | null }) {
  const reduceMotion = useReducedMotion();
  const ringColors = useRingColors(type);
  if (reduceMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {SPARKLE_SPECS.map(({ x, size, dur, delay, ci }, i) => {
        const ringCol = ringColors[ci];
        const col = ringCol.replace('VAL', '0.8');
        const glow = ringCol.replace('VAL', '0.3');
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${String(x)}%`,
              bottom: '-2%',
              background: col,
              boxShadow: `0 0 ${String(size * 3)}px ${String(size)}px ${glow}`,
              transition: 'background 0.6s ease, box-shadow 0.6s ease',
            }}
            animate={{
              y: [0, -(typeof window !== 'undefined' ? window.innerHeight * 1.1 : 900)],
              x: [0, (i % 2 === 0 ? 1 : -1) * (20 + (i % 4) * 10)],
              opacity: [0, 0.9, 0.9, 0],
            }}
            transition={{
              duration: dur,
              delay: delay * 0.25,
              repeat: Infinity,
              ease: 'easeInOut',
              times: [0, 0.1, 0.85, 1],
            }}
          />
        );
      })}
    </div>
  );
}

function LoginForm() {
  const sessionState = useSessionStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'select' | 'credentials'>(
    searchParams.get('type') ? 'credentials' : 'select',
  );
  const [userType, setUserType] = useState<WorkspaceType | null>(
    normalizePartnerRole(searchParams.get('type')),
  );

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
    if (!userType) return;
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

      const orgs = await getOrganizations();
      if (orgs.length === 0) {
        router.push(`/onboard?type=${userType}`);
        return;
      }

      const matches = await filterOrgsByPartnerType(orgs, userType);

      if (matches.length === 0) {
        await logout();
        setError(
          `This account is not registered as a ${roleConfig[userType].label} workspace. Please select the correct workspace, or apply for access.`,
        );
        setLoading(false);
        return;
      }

      if (matches.length === 1 && matches[0]) {
        await setActiveOrg(matches[0].id);
        router.push(resolvePartnerV3Path(userType) ?? '/partner/select-organization');
        return;
      }

      router.push(`/partner/select-organization?type=${userType}`);
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
        <SparkleField type={userType} />

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
        <WorkspaceBg type={userType} />
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

          <AnimatePresence mode="wait" initial={false}>
            {step === 'select' ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="space-y-8"
              >
                <div>
                  <h3 className="text-headline text-[var(--text-primary)] mb-2">Welcome back</h3>
                  <p className="text-body text-[var(--text-secondary)]">
                    Select your workspace to continue.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(roleConfig) as WorkspaceType[]).map((type) => {
                    const config = roleConfig[type];
                    const Icon = config.icon;
                    const isActive = userType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setUserType(type);
                          const params = new URLSearchParams(searchParams.toString());
                          params.set('type', type);
                          router.replace(`/login?${params.toString()}`);
                        }}
                        className={`relative p-5 rounded-2xl border-2 transition-all duration-200 text-center group ${
                          isActive
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                            : 'border-[var(--border-subtle)] bg-[var(--surface-secondary)] hover:border-[var(--border-default)]'
                        }`}
                      >
                        <Icon
                          className={`h-6 w-6 mx-auto mb-3 transition-colors ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}`}
                        />
                        <p
                          className={`text-[13px] font-semibold transition-colors ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}
                        >
                          {config.label}
                        </p>
                        <p
                          className={`text-[11px] mt-1 transition-colors ${isActive ? 'text-[var(--accent-primary)]/70' : 'text-[var(--text-tertiary)]'}`}
                        >
                          {config.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={!userType}
                  onClick={() => {
                    if (userType) setStep('credentials');
                  }}
                  className="btn btn-primary btn-xl w-full group disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    Continue
                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Back to workspace selection"
                    onClick={() => {
                      setStep('select');
                      setError('');
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-[var(--border-default)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180 text-[var(--text-secondary)]" />
                  </button>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">
                      {userType ? roleConfig[userType].label : ''} Workspace
                    </span>
                    <h3 className="text-headline text-[var(--text-primary)] leading-tight">Sign in</h3>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-[var(--state-error-bg)] border border-red-500/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-[var(--state-error)] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[14px] text-[var(--state-error)] font-medium">{error}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (email) params.set('email', email);
                          if (userType) params.set('type', userType);
                          const query = params.toString();
                          router.push(query ? `/signup?${query}` : '/signup');
                        }}
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
                        onChange={(e) => {
                          setEmail(e.target.value);
                        }}
                        required
                        className="input input-lg input-icon-left"
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
                        onChange={(e) => {
                          setPassword(e.target.value);
                        }}
                        required
                        className="input input-lg input-icon-left input-icon-right"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {fieldErrors['password'] && (
                      <p className="text-xs text-[var(--state-error)]">{fieldErrors['password']}</p>
                    )}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          router.push(
                            `/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`,
                          );
                        }}
                        className="text-[12px] font-medium text-[var(--accent-primary)] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
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
              </motion.div>
            )}
          </AnimatePresence>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-caption text-[var(--text-tertiary)]">New to C1RCLE?</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          <div className="card p-6 text-center">
            <p className="text-body-sm text-[var(--text-secondary)] mb-4">
              Join our network of premium nightlife venues, hosts, and promoters.
            </p>
            <button
              onClick={() => {
                router.push(userType ? `/onboard?type=${userType}` : '/onboard');
              }}
              className="btn btn-secondary w-full"
            >
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
