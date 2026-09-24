'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type SubmitEvent } from 'react';

import {
  AlertIcon,
  PartnerIcon,
  NextIcon,
  VisibleIcon,
  HiddenIcon,
  LockedIcon,
  EmailIcon,
  UsersIcon,
  InstantIcon,
} from '@c1rcle/icons';

import { resolvePartnerV3Path } from '@/components/partner-shell/partner-role-routing';
import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';

type UserType = 'venue' | 'host' | 'promoter';

const roleConfig = {
  venue: {
    // lucide-react@1.28.0 ships without type declarations, so @c1rcle/icons'
    // re-exported names type as `any` here; rendering each icon through a typed
    // inline wrapper keeps the config value non-any (JSX on an any-typed component
    // is fine) instead of smuggling `any` into a typed slot.
    icon: ({ className }: { className?: string }) => <PartnerIcon className={className} />,
    label: 'Venue',
    description: 'Full venue operations',
    color: 'from-orange-500/20 to-orange-600/10',
  },
  host: {
    icon: ({ className }: { className?: string }) => <UsersIcon className={className} />,
    label: 'Host',
    description: 'Event management',
    color: 'from-indigo-500/20 to-indigo-600/10',
  },
  promoter: {
    icon: ({ className }: { className?: string }) => <InstantIcon className={className} />,
    label: 'Promoter',
    description: 'Sales & outreach',
    color: 'from-emerald-500/20 to-emerald-600/10',
  },
};

const bgPalette = {
  venue: { primary: '#F44A22', ring: 'rgba(244,74,34,VAL)', blob: 'rgba(244,74,34,0.12)' },
  host: { primary: '#FFFFFF', ring: 'rgba(255,255,255,VAL)', blob: 'rgba(255,255,255,0.08)' },
  promoter: { primary: '#22C55E', ring: 'rgba(34,197,94,VAL)', blob: 'rgba(34,197,94,0.12)' },
};

function WorkspaceBg({ type }: { type: UserType | null }) {
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
          {/* Radial glow blob */}
          <motion.div
            className="absolute rounded-full"
            // eslint-disable-next-line no-restricted-syntax -- framer-motion SVG/offset values (x/y translate from -50%) and type-driven runtime colours (r()/p.blob) are per-workspace dynamic state, not static CSS; converting would require reworking the motion/colour model, which is outside the 2026-09-11 lint-fix scope.
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

          {/* All — same rotating arc style, different colours */}
          {[0, 120, 240].map((deg, i) => (
            <motion.div
              key={i}
              className="absolute"
              // eslint-disable-next-line no-restricted-syntax -- arc size/rotation (340 + i*80, deg) and the workspace ring-colour helper r(a) are expression-driven per-index geometry, not static CSS; converting would require reworking the arc model, which is outside the 2026-09-11 lint-fix scope.
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

          {/* Corner accent dot */}
          <motion.div
            className="absolute bottom-8 right-8 rounded-full"
            // eslint-disable-next-line no-restricted-syntax -- accent dot uses the workspace-selected accent colour at runtime (p.primary); converting the colour source would require reworking the palette model, which is outside the 2026-09-11 lint-fix scope.
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

function LoginForm() {
  const {
    signIn,
    signOut,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- AuthContextValue.user is deliberately `any` (see DashboardAuthProvider.tsx's doc comment); only used here for a truthy/falsy check, never dereferenced.
    user,
    profile,
    isApproved,
    onboardingStatus,
    loading: authLoading,
  } = useDashboardAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'select' | 'credentials'>(
    searchParams.get('type') ? 'credentials' : 'select',
  );
  const [userType, setUserType] = useState<UserType | null>(
    searchParams.get('type') as UserType | null,
  );

  // Per-ring colours: default = tri-colour, selected = single colour
  const ringColors = [
    userType === 'host'
      ? 'rgba(255,255,255,VAL)'
      : userType === 'promoter'
        ? 'rgba(34,197,94,VAL)'
        : 'rgba(244,74,34,VAL)',
    userType === 'venue'
      ? 'rgba(244,74,34,VAL)'
      : userType === 'promoter'
        ? 'rgba(34,197,94,VAL)'
        : 'rgba(255,255,255,VAL)',
    userType === 'venue'
      ? 'rgba(244,74,34,VAL)'
      : userType === 'host'
        ? 'rgba(255,255,255,VAL)'
        : 'rgba(34,197,94,VAL)',
    userType === 'host'
      ? 'rgba(255,255,255,VAL)'
      : userType === 'promoter'
        ? 'rgba(34,197,94,VAL)'
        : 'rgba(244,74,34,VAL)',
    userType === 'venue'
      ? 'rgba(244,74,34,VAL)'
      : userType === 'host'
        ? 'rgba(255,255,255,VAL)'
        : 'rgba(34,197,94,VAL)',
  ];
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for DashboardAuthProvider to finish its async fetch before acting.
    // Without this guard the effect fires while isApproved=false (its default),
    // which signs the user out before the profile is even loaded — causing the
    // "page refreshes / fields clear" silent failure.
    if (authLoading || !user) return;

    if (isApproved && profile?.activeMembership) {
      // Fully approved with an active partnership — go to dashboard.
      // `next` is what the edge proxy (proxy.ts) emits; `callbackUrl` is the
      // codex-track name. Both are honoured — the merged tree has each.
      const callback = searchParams.get('next') ?? searchParams.get('callbackUrl');
      if (callback) {
        router.replace(callback);
      } else {
        router.replace(
          resolvePartnerV3Path(profile.activeMembership.partnerType) ??
            '/partner/select-organization',
        );
      }
    } else if (!isApproved && profile !== null) {
      // profile is loaded (not null) but user is not approved — safe to reject.
      // We check profile !== null to avoid acting on the initial null state.
      void signOut();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- real UX requirement: a definitively-unapproved account must show why immediately, not after another render cycle.
      setError(
        onboardingStatus
          ? "You don't have partner access yet. Your application is pending review."
          : "This account doesn't have partner access. Please apply or contact support.",
      );
    }
    // If isApproved=true but activeMembership is null, do nothing — handleLogin
    // will navigate directly via router.push once its own fetch completes.
  }, [
    user,
    authLoading,
    isApproved,
    profile,
    onboardingStatus,
    router,
    userType,
    searchParams,
    step,
    signOut,
  ]);

  const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userType) return;
    setError('');
    setLoading(true);

    try {
      // signIn() calls the real /api/v2/auth/login BFF proxy — a successful
      // call updates the session store, which re-renders this component with
      // a fresh `user`/`profile`/`isApproved`; the redirect effect above
      // (reading those same fields) does the actual navigation once
      // DashboardAuthProvider's own post-login fetch (memberships +
      // onboarding status) resolves. Workspace type is a UI hint only — the
      // server, not the tile the user clicked, decides which dashboard they
      // land on (D-024 C-10: role/partnerType come from the gateway, never
      // client-selected).
      await signIn(email, password);
    } catch {
      // login() already collapses every BFF 4xx into one generic error
      // (account-existence oracle suppression, D-024's login-path rule) —
      // there is no further error code to branch on here.
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--surface-base)]">
      {/* Left Panel - Premium Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden bg-[var(--surface-secondary)]">
        {/* Background dot grid */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,currentColor_1px,transparent_0)] bg-[length:32px_32px]"
          />
        </div>

        {/* Floating particles — tri-colour by default, single colour on selection */}
        {[
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
          { x: 41, size: 4, dur: 9, delay: 2.4, ci: 0 },
          { x: 47, size: 3, dur: 14, delay: 0.3, ci: 1 },
          { x: 53, size: 5, dur: 11, delay: 3.8, ci: 2 },
          { x: 59, size: 3, dur: 15, delay: 1.0, ci: 0 },
          { x: 65, size: 4, dur: 10, delay: 2.6, ci: 1 },
          { x: 71, size: 3, dur: 13, delay: 0.5, ci: 2 },
          { x: 77, size: 5, dur: 12, delay: 3.3, ci: 0 },
          { x: 83, size: 3, dur: 16, delay: 1.7, ci: 1 },
          { x: 89, size: 4, dur: 8, delay: 2.1, ci: 2 },
          { x: 95, size: 3, dur: 14, delay: 4.5, ci: 0 },
          { x: 3, size: 4, dur: 11, delay: 1.2, ci: 2 },
          { x: 10, size: 3, dur: 15, delay: 3.6, ci: 0 },
          { x: 17, size: 5, dur: 9, delay: 0.1, ci: 1 },
          { x: 24, size: 3, dur: 13, delay: 2.9, ci: 2 },
          { x: 48, size: 4, dur: 10, delay: 1.4, ci: 0 },
          { x: 63, size: 3, dur: 17, delay: 3.1, ci: 1 },
          { x: 76, size: 5, dur: 12, delay: 0.6, ci: 2 },
          { x: 88, size: 3, dur: 14, delay: 2.3, ci: 0 },
          { x: 33, size: 4, dur: 11, delay: 4.2, ci: 1 },
          { x: 57, size: 3, dur: 16, delay: 1.9, ci: 2 },
        ].map(({ x, size, dur, delay, ci }, i) => {
          const ringCol = ringColors[ci] ?? 'rgba(244,74,34,VAL)';
          const col = ringCol.replace('VAL', '0.8');
          const glow = ringCol.replace('VAL', '0.3');
          return (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              // eslint-disable-next-line no-restricted-syntax -- particle size/position/glow are per-index geometry over expression-derived ring colours (ringColors[ci]→col/glow); converting would require reworking the particle motion model, which is outside the 2026-09-11 lint-fix scope.
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

        {/* Top - Logo & Theme Toggle */}
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

        {/* Middle - Hero Content */}
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

        {/* Bottom - Footer */}
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
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[var(--text-primary)] flex items-center justify-center">
                <span className="text-[var(--text-inverse)] font-bold">C</span>
              </div>
              <span className="text-title font-bold text-[var(--text-primary)]">THE C1RCLE</span>
            </div>
          </div>

          {/* Single AnimatePresence — swaps the entire block (header + content) at once */}
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
                {/* Header */}
                <div>
                  <h3 className="text-headline text-[var(--text-primary)] mb-2">Welcome back</h3>
                  <p className="text-body text-[var(--text-secondary)]">
                    Select your workspace to continue.
                  </p>
                </div>

                {/* Workspace tiles */}
                <div className="grid grid-cols-3 gap-3">
                  {(['venue', 'host', 'promoter'] as UserType[]).map((type) => {
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
                    <NextIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
                {/* Header with back button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('select');
                      setError('');
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center border border-[var(--border-default)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors flex-shrink-0"
                  >
                    <NextIcon className="h-4 w-4 rotate-180 text-[var(--text-secondary)]" />
                  </button>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">
                      {userType ? roleConfig[userType].label : ''} Workspace
                    </span>
                    <h3 className="text-headline text-[var(--text-primary)] leading-tight">
                      Sign in
                    </h3>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-4 bg-[var(--state-error-bg)] border border-red-500/20 rounded-2xl flex items-start gap-3">
                    <AlertIcon className="h-5 w-5 text-[var(--state-error)] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[14px] text-[var(--state-error)] font-medium">{error}</p>
                      {/* Only the "no partner access yet" case (a real, authenticated
                          account) offers this — the login failure path is
                          deliberately generic (D-024's anti-account-existence-oracle
                          rule) and must never hint whether an email is registered. */}
                      {error.includes('partner access') && (
                        <button
                          onClick={() => {
                            router.push(`/onboard?email=${email}&type=${String(userType)}`);
                          }}
                          className="text-[13px] font-semibold text-[var(--state-error)] underline mt-2 hover:no-underline"
                        >
                          Apply for Access →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Form */}
                <form
                  onSubmit={(e) => {
                    void handleLogin(e);
                  }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label htmlFor="email" className="input-label">Email Address</label>
                    <div className="relative group">
                      <EmailIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                        }}
                        required
                        className="input input-lg pl-12"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="input-label">Password</label>
                    <div className="relative group">
                      <LockedIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                        }}
                        required
                        className="input input-lg pl-12 pr-12"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowPassword(!showPassword);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)] hover:text-[var(--text-secondary)] transition-colors"
                      >
                        {showPassword ? (
                          <HiddenIcon className="h-5 w-5" />
                        ) : (
                          <VisibleIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || authLoading}
                    className="btn btn-primary btn-xl w-full group"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Continue to Dashboard
                        <NextIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-caption text-[var(--text-tertiary)]">New to C1RCLE?</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Apply CTA */}
          <div className="card p-6 text-center">
            <p className="text-body-sm text-[var(--text-secondary)] mb-4">
              Join our network of premium nightlife venues, hosts, and promoters.
            </p>
            <button
              onClick={() => {
                router.push('/onboard');
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

// Loading Skeleton
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

// eslint-disable-next-line import-x/no-default-export -- consumed via default import by src/app/login/page.tsx (outside the 2026-09-11 lint-fix scope); named-exporting here would force touching page.tsx.
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
