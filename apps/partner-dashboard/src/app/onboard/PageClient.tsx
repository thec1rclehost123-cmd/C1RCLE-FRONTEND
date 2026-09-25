'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  AtSign,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  Users,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { useSession } from '@c1rcle/auth';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import {
  getMine,
  saveProgress as saveOnboardingProgress,
  start as startOnboarding,
  submit as submitOnboardingApplication,
  uploadDocument,
} from '@/lib/onboarding/onboarding-repository';
import { routeAfterAuth } from '@/lib/org/route-after-auth';

import type { OnboardingRequestDto } from '@c1rcle/contracts/client';

// ── Step type ─────────────────────────────────────────────────────────────────
// Six-step flow per ONBOARDING-FLOW-SPEC-2026-09-01.md: role → sign-in/sign-up →
// profile(+plan, which creates the application) → documents → review → success.
// Email/phone OTP steps are dropped (Better Auth email+password only); the phone
// is a *typed* profile field, never OTP-verified. Entity-type KYC branching is
// collapsed: every applicant uploads the same 3 documents (id_front, id_back,
// selfie) — the backend's fixed label enum.
type OnboardingStep = 'role' | 'signup' | 'details' | 'documents' | 'review' | 'success';

type PartnerType = 'venue' | 'host' | 'promoter';

/** Mirrors `onboardingPlanSchema` (`basic | silver | diamond`) — the contracts
 * index doesn't export a standalone `OnboardingPlan` type, only the enum used
 * inside `StartOnboardingRequest`/`OnboardingRequestDto`. */
type OnboardingPlan = 'basic' | 'silver' | 'diamond';

const STEP_SEQUENCE: readonly OnboardingStep[] = [
  'role',
  'signup',
  'details',
  'documents',
  'review',
  'success',
];

const STEP_LABELS: Record<OnboardingStep, string> = {
  role: 'Role',
  signup: 'Sign Up',
  details: 'Details',
  documents: 'Documents',
  review: 'Review',
  success: 'Done',
};

const CITIES = [
  'Pune',
  'Mumbai',
  'Goa',
  'Bengaluru',
  'Delhi',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'Ahmedabad',
];

const BUSINESS_TYPES = [
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'llp', label: 'LLP' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'sole_prop', label: 'Sole Proprietorship' },
  { value: 'trust', label: 'Trust / Society' },
];

const PLANS: readonly {
  readonly value: OnboardingPlan;
  readonly label: string;
  readonly fee: string;
}[] = [
  { value: 'basic', label: 'Basic', fee: '15% platform fee' },
  { value: 'silver', label: 'Silver', fee: '12% platform fee' },
  { value: 'diamond', label: 'Diamond', fee: '10% platform fee' },
];

/** A draft application counts as "profile started" once its legalName is set. */
function isProfileStarted(app: OnboardingRequestDto | null): boolean {
  return app !== null && app.profile.legalName.trim().length > 0;
}

/** The 3 backend-fixed document labels every applicant must upload. */
const DOCUMENT_LABELS = ['id_front', 'id_back', 'selfie'] as const;
type DocLabel = (typeof DOCUMENT_LABELS)[number];

function docLabelCopy(label: DocLabel): { title: string; label: string } {
  switch (label) {
    case 'id_front':
      return { title: 'Government ID — Front', label: 'Front side of your government-issued ID' };
    case 'id_back':
      return { title: 'Government ID — Back', label: 'Back side of your government-issued ID' };
    case 'selfie':
      return { title: 'Selfie', label: 'A clear selfie for identity confirmation' };
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    signIn: authSignIn,
    signUp: authSignUp,
    signOut,
    loading: authLoading,
  } = useDashboardAuth();
  const { user: authUser } = useSession();

  const [step, setStep] = useState<OnboardingStep>('role');
  const [partnerType, setPartnerType] = useState<PartnerType>('venue');
  const [plan, setPlan] = useState<OnboardingPlan>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Success screen status — driven by the real application status from getMine(),
  // never assumed from wizard state.
  const [approvalStatus, setApprovalStatus] = useState<
    'pending' | 'approved' | 'changes_requested' | 'rejected'
  >('pending');
  const [reviewNote, setReviewNote] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // Existing-user detection on the signup step (duplicate email → sign-in mode).
  const [emailExists, setEmailExists] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');

  // Signup / account fields.
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  // Business-entity toggle — a *local* reveal, not a backend branch (spec).
  const [isBusiness, setIsBusiness] = useState(false);

  // Profile fields (details step) — the UI speaks the server's
  // profile-vocabulary (legalName, businessType, …) except `password`, which
  // is collected on the signup step and never leaves the client.
  const [formData, setFormData] = useState<{
    password: string;
    legalName: string;
    contactPerson: string;
    phone: string;
    city: string;
    area: string;
    website: string;
    capacity: string | number | null;
    instagram: string;
    bio: string;
    businessType: string;
    registrationNumber: string;
  }>({
    password: '',
    legalName: '',
    contactPerson: '',
    phone: '',
    city: '',
    area: '',
    website: '',
    capacity: '',
    instagram: '',
    bio: '',
    businessType: '',
    registrationNumber: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [docNotice, setDocNotice] = useState('');

  // Uploaded document storage paths, seeded from the application on resume and
  // updated as each KycFileZone completes. The same 3 labels for everyone.
  const [documents, setDocuments] = useState<Record<DocLabel, string | null>>({
    id_front: null,
    id_back: null,
    selfie: null,
  });

  // ── Save onboarding progress (debounced autosave once the application exists) ──
  const saveProgress = useCallback(
    async (_currentStep: OnboardingStep) => {
      if (!submittedRequestId) return;
      try {
        await saveOnboardingProgress(submittedRequestId, {
          legalName: formData.legalName || undefined,
          contactPerson: formData.contactPerson || undefined,
          phone: formData.phone || undefined,
          city: formData.city || undefined,
          area: formData.area || undefined,
          website: formData.website || undefined,
          capacity: formData.capacity ? Number(formData.capacity) : undefined,
          instagram: formData.instagram || undefined,
          bio: formData.bio || undefined,
          businessType: formData.businessType || undefined,
          registrationNumber: formData.registrationNumber || undefined,
          entityType: isBusiness ? 'business' : undefined,
        });
      } catch {
        /* silent — non-critical best-effort autosave */
      }
    },
    [submittedRequestId, formData, isBusiness],
  );

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!submittedRequestId || step !== 'details') return;
    if (autosaveTimer.current !== null) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void saveProgress('details');
    }, 800);
    return () => {
      if (autosaveTimer.current !== null) clearTimeout(autosaveTimer.current);
    };
  }, [formData, isBusiness, submittedRequestId, step, saveProgress]);

  // ── Pre-fill role/email from URL params (deep links keep a refresh's place) ──
  useEffect(() => {
    const type = searchParams.get('type') as PartnerType | null;
    const urlEmail = searchParams.get('email');
    if (type === 'venue' || type === 'host' || type === 'promoter') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- URL prefill must run post-hydration: useSearchParams is empty during SSR, so lazy state initializers cannot replace this.
      setPartnerType(type);
    }
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [searchParams]);

  // ── Resume onboarding state from the real backend on load ─────────────────
  // There is no server-side `onboardingStep` field — the step to resume at is
  // derived from what the draft application actually has on it (`getMine()` →
  // `/api/v2/onboarding/me`). No session → step 1 (public). Authenticated with
  // no application → straight to profile (role re-pickable, account is good).
  const initialChecked = useRef(false);

  // Shared by initial load, existing-user login, and post-submit poll: maps a
  // real application onto wizard state + the correct step.
  const seedFromApplication = useCallback(
    (application: OnboardingRequestDto, go: (s: OnboardingStep) => void) => {
      setSubmittedRequestId(application.id);
      if (application.status === 'approved') {
        setApprovalStatus('approved');
        go('success');
        return;
      }
      if (application.status === 'rejected') {
        setApprovalStatus('rejected');
        setReviewNote(application.reviewNote ?? '');
        go('success');
        return;
      }
      if (application.status === 'changes_requested') {
        setApprovalStatus('changes_requested');
        setReviewNote(application.reviewNote ?? '');
        go('success');
        return;
      }
      if (application.status === 'submitted') {
        setApprovalStatus('pending');
        go('success');
        return;
      }
      // draft — continue from where the profile left off.
      setApprovalStatus('pending');
      const p = application.profile;
      setFormData((prev) => ({
        ...prev,
        legalName: p.legalName !== '' ? p.legalName : prev.legalName,
        contactPerson: p.contactPerson !== '' ? p.contactPerson : prev.contactPerson,
        phone: p.phone !== '' ? p.phone : prev.phone,
        city: p.city !== '' ? p.city : prev.city,
        area: p.area ?? prev.area,
        website: p.website ?? prev.website,
        capacity: p.capacity != null ? String(p.capacity) : prev.capacity,
        instagram: p.instagram ?? prev.instagram,
        bio: p.bio ?? prev.bio,
        businessType: p.businessType ?? prev.businessType,
        registrationNumber: p.registrationNumber ?? prev.registrationNumber,
      }));
      setIsBusiness(p.entityType === 'business');
      setPlan(application.plan);

      const seeded: Record<DocLabel, string | null> = {
        id_front: null,
        id_back: null,
        selfie: null,
      };
      for (const doc of application.documents) {
        if (doc.label === 'id_front' || doc.label === 'id_back' || doc.label === 'selfie') {
          seeded[doc.label] = doc.storagePath;
        }
      }
      setDocuments(seeded);

      const missing = application.missingDocuments.length;
      if (!isProfileStarted(application)) {
        go('details');
      } else if (missing > 0) {
        go('documents');
      } else {
        go('review');
      }
    },
    [],
  );

  useEffect(() => {
    if (authLoading) return;
    if (initialChecked.current) return;

    const checkInitialState = async () => {
      initialChecked.current = true;
      if (!authUser) {
        setStep('role');
        return;
      }

      const application = await getMine();
      if (!application) {
        // Signed in but never started an application — begin at the profile
        // step (the account already exists; the signup step would 409-loop).
        setStep('details');
        return;
      }

      setSubmittedRequestId(application.id);
      seedFromApplication(application, (s) => {
        setStep(s);
      });
    };

    void checkInitialState();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seedFromApplication is a stable []-memoized mapper; the probe must run once per auth transition, not per callback identity.
  }, [authLoading, authUser]);

  // ── Approval polling on the success screen ──────────────────────────────
  useEffect(() => {
    if (step !== 'success' || !submittedRequestId) return;
    const checkApproval = async () => {
      try {
        const application = await getMine();
        if (!application) return;
        if (application.status === 'approved') {
          setApprovalStatus('approved');
        } else if (application.status === 'changes_requested') {
          setApprovalStatus('changes_requested');
          setReviewNote(application.reviewNote ?? '');
        } else if (application.status === 'rejected') {
          setApprovalStatus('rejected');
          setReviewNote(application.reviewNote ?? '');
        }
      } catch {
        /* silent */
      }
    };
    void checkApproval();
    const interval = setInterval(() => void checkApproval(), 10_000);
    return () => {
      clearInterval(interval);
    };
  }, [step, submittedRequestId]);

  const handleProfileChange = (key: string, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  };

  // ── Step 2: sign up / sign in (public) ─────────────────────────────────────
  // Better Auth email + password only — no OTP. A duplicate email surfaces as
  // a 409, switching the screen to sign-in mode (onboarding/me decides where a
  // returning account continues) rather than a separate enumeration pre-check.
  const handleSignup = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      await authSignUp(email, formData.password, name.trim());
      setEmailExists(false);
      setStep('details');
    } catch (err) {
      if (isApiClientError(err) && err.status === 409) {
        setEmailExists(true);
        setError('This email is already registered. Please sign in to continue.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 (sign-in path): resume a returning applicant ────────────────────
  const handleExistingUserLogin = async () => {
    setError('');
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      await authSignIn(email, loginPassword);
      const application = await getMine();
      if (application) {
        seedFromApplication(application, (s) => {
          setStep(s);
        });
      } else {
        // Signed in with no application on record — begin a fresh one (role is
        // kept from step 1), skipping the signup screen.
        setStep('details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: profile + plan → create the application ────────────────────────
  // The canonical contract creates the application with `requestedType`, `plan`
  // and the full `profile` in one call (startOnboardingSchema requires all
  // three), so the plan + profile are collected together here. Resuming a draft
  // instead PATCHes the changed subset and advances.
  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.legalName.trim()) errors['legalName'] = 'Required';
    if (!formData.contactPerson.trim()) errors['contactPerson'] = 'Required';
    const digits = formData.phone.replace(/[^\d]/g, '');
    if (!formData.phone.trim()) {
      errors['phone'] = 'Required';
    } else if (digits.length < 6 || digits.length > 15) {
      errors['phone'] = 'Enter a valid phone number with country code (e.g. +91 98765 43210).';
    }
    if (!formData.city) errors['city'] = 'Select a city';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateApplication = async () => {
    setError('');
    setFieldErrors({});
    if (!authUser) {
      setError('Your session expired. Please sign in again to continue.');
      setStep('signup');
      return;
    }
    if (!validateProfile()) return;
    setLoading(true);
    try {
      const profile = {
        legalName: formData.legalName.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        city: formData.city,
        area: formData.area || undefined,
        website: formData.website || undefined,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        instagram: formData.instagram || undefined,
        bio: formData.bio || undefined,
        businessType: formData.businessType || undefined,
        registrationNumber: formData.registrationNumber || undefined,
        entityType: isBusiness ? 'business' : undefined,
      };

      if (submittedRequestId) {
        // Resume path — the application already exists; PATCH the profile then
        // advance to whatever is still owed.
        await saveOnboardingProgress(submittedRequestId, profile);
        const application = await getMine();
        const missing = application?.missingDocuments.length ?? 3;
        setStep(missing > 0 ? 'documents' : 'review');
        return;
      }

      const application = await startOnboarding(
        { requestedType: partnerType, plan, profile },
        crypto.randomUUID(),
      );
      setSubmittedRequestId(application.id);
      setDocNotice('');
      setStep('documents');
    } catch (err) {
      if (isApiClientError(err) && err.status === 409) {
        // One live application per person — adopt the existing draft and resume.
        const existing = await getMine();
        if (existing) {
          seedFromApplication(existing, (s) => {
            setStep(s);
          });
          setError('You already have an application in progress — resuming it.');
          return;
        }
        setError('You already have an application in progress.');
      } else {
        setError(
          err instanceof Error ? err.message : 'Failed to create account. Please try again.',
        );
        if (isApiClientError(err) && err.fieldErrors) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(err.fieldErrors as Record<string, string[]>).map(([k, v]) => [
                k,
                v.join(' '),
              ]),
            ),
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4: documents ───────────────────────────────────────────────────────
  const handleDocumentUploaded = (label: DocLabel, storagePath: string | null) => {
    setDocuments((prev) => ({ ...prev, [label]: storagePath }));
    setDocNotice('');
    // Refresh the truth from the server so missingDocuments stays authoritative,
    // but never block the UI on it.
    void getMine().then((application) => {
      if (!application) return;
      const seeded: Record<DocLabel, string | null> = {
        id_front: null,
        id_back: null,
        selfie: null,
      };
      for (const doc of application.documents) {
        if (doc.label === 'id_front' || doc.label === 'id_back' || doc.label === 'selfie') {
          seeded[doc.label] = doc.storagePath;
        }
      }
      setDocuments((prev) => ({ ...prev, ...seeded }));
    });
  };

  const allDocumentsUploaded = DOCUMENT_LABELS.every((label) => documents[label] !== null);

  // ── Step 5: review + submit ─────────────────────────────────────────────────
  const submitApplication = async () => {
    setError('');
    setDocNotice('');
    if (!submittedRequestId) {
      setError('No application found. Please restart onboarding.');
      return;
    }
    setLoading(true);
    try {
      const application = await submitOnboardingApplication(
        submittedRequestId,
        crypto.randomUUID(),
      );
      setSubmittedRequestId(application.id);
      setApprovalStatus('pending');
      setStep('success');
    } catch (err) {
      if (isApiClientError(err) && err.status === 400) {
        // Missing documents is the common 400 — surface it on the documents
        // step per spec ("inline notice on step 5, not an error toast").
        const message = err.fieldErrors
          ? Object.values(err.fieldErrors).flat().join(' ')
          : err.message;
        if (/document/i.test(message)) {
          setDocNotice(message);
          setStep('documents');
          return;
        }
        setError(message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStepFromUnauthenticated = () => {
    // proxy.ts leaves /onboard ungated; the wizard guards itself: authed-only
    // steps bounce to the sign-in screen.
    if (!authUser && step !== 'role' && step !== 'signup') {
      setStep('signup');
    }
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- the wizard must bounce to the sign-in step the moment the session drops; this [authUser, step]-driven reconciliation can't be derived during render without duplicating the step-guard logic.
  useEffect(updateStepFromUnauthenticated, [authUser, step]);

  const currentStepIndex = STEP_SEQUENCE.indexOf(step);

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      <header className="sticky top-0 z-50 bg-[var(--surface-base)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStepIndex === 0) {
                router.replace('/login');
              } else {
                const prevStep = STEP_SEQUENCE[currentStepIndex - 1];
                if (prevStep !== undefined) setStep(prevStep);
              }
            }}
            className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors text-[11px] font-semibold uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStepIndex === 0 ? 'Back to Login' : 'Back'}
          </button>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[var(--text-primary)] flex items-center justify-center">
              <span className="text-[var(--text-inverse)] font-bold text-sm">C</span>
            </div>
            <span className="text-[15px] font-bold text-[var(--text-primary)] tracking-tight">
              THE C1RCLE
            </span>
          </div>
        </div>
      </header>

      {step !== 'success' && (
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center">
            {STEP_SEQUENCE.filter((s) => s !== 'success').map((s, i) => {
              const isDone = currentStepIndex > STEP_SEQUENCE.indexOf(s);
              const isCurrent = step === s;
              const filteredSteps = STEP_SEQUENCE.filter((x) => x !== 'success');
              const isLast = i === filteredSteps.length - 1;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!isDone}
                      onClick={() => {
                        if (isDone) setStep(s);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${isCurrent ? 'bg-[var(--accent-primary)] text-white' : isDone ? 'bg-[var(--state-success)] text-white cursor-pointer hover:opacity-80' : 'bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'}`}
                    >
                      {isDone ? '✓' : i + 1}
                    </button>
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wider ${isCurrent ? 'text-[var(--accent-primary)]' : isDone ? 'text-[var(--state-success)]' : 'text-[var(--text-tertiary)]'}`}
                    >
                      {STEP_LABELS[s]}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 rounded-full mx-2 mb-4 transition-all ${isDone ? 'bg-[var(--state-success)]' : 'bg-[var(--surface-tertiary)]'}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-6 pb-24">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Role (public) ── */}
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(STEP_SEQUENCE.indexOf('role') + 1).padStart(2, '0')}
                label="Select Role"
                title="Join the Network"
                description="Select your operational role to begin the onboarding process."
              />
              <div className="grid grid-cols-1 gap-4 mb-10">
                <RoleCard
                  icon={Building2}
                  title="Venue Partner"
                  description="Direct management for nightlife venues, clubs, and lounge spaces."
                  active={partnerType === 'venue'}
                  onClick={() => {
                    setPartnerType('venue');
                  }}
                />
                <RoleCard
                  icon={Users}
                  title="Event Host"
                  description="For organizers, DJs, and collectives hosting independent events."
                  active={partnerType === 'host'}
                  onClick={() => {
                    setPartnerType('host');
                  }}
                />
                <RoleCard
                  icon={Zap}
                  title="Promoter"
                  description="Access tools for ticket distribution and guestlist management."
                  active={partnerType === 'promoter'}
                  onClick={() => {
                    setPartnerType('promoter');
                  }}
                />
              </div>
              <ActionButton
                onClick={() => {
                  setError('');
                  // Already signed in? Skip the signup screen.
                  setStep(authUser ? 'details' : 'signup');
                }}
              >
                Continue <ChevronRight className="h-5 w-5" />
              </ActionButton>
            </motion.div>
          )}

          {/* ── Step 2: Sign up / Sign in (public) ── */}
          {step === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(STEP_SEQUENCE.indexOf('signup') + 1).padStart(2, '0')}
                label="Sign Up"
                title={emailExists ? 'Welcome Back' : 'Create Your Account'}
                description={
                  emailExists
                    ? 'Log in with your existing account to resume onboarding.'
                    : 'Enter your email and set a password. No OTP — you will sign in here directly.'
                }
              />
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setEmailExists(false);
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${!emailExists ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailExists(true);
                    setError('');
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${emailExists ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                >
                  Log In
                </button>
              </div>
              <ErrorBanner error={error} />
              <div className="space-y-5">
                {!emailExists && (
                  <FormInput
                    label="Full Name"
                    icon={User}
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      setName(e.target.value);
                    }}
                    placeholder="Your name"
                    required
                  />
                )}
                <FormInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value);
                  }}
                  placeholder="you@company.com"
                />
                <div className="relative">
                  <FormInput
                    label="Password"
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={emailExists ? loginPassword : formData.password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (emailExists) {
                        setLoginPassword(e.target.value);
                      } else {
                        setFormData((prev) => ({ ...prev, password: e.target.value }));
                      }
                    }}
                    placeholder={emailExists ? 'Enter your password' : 'Minimum 8 characters'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-4 top-[42px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {emailExists ? (
                  <ActionButton
                    onClick={() => {
                      void handleExistingUserLogin();
                    }}
                    loading={loading}
                    loadingText="AUTHORIZING ACCESS..."
                  >
                    Verify & Login <ChevronRight className="h-5 w-5" />
                  </ActionButton>
                ) : (
                  <ActionButton
                    onClick={() => {
                      void handleSignup();
                    }}
                    loading={loading}
                  >
                    Continue <ChevronRight className="h-5 w-5" />
                  </ActionButton>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Profile + Plan (authed) ── */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(STEP_SEQUENCE.indexOf('details') + 1).padStart(2, '0')}
                label="Your Details"
                title={
                  partnerType === 'venue'
                    ? 'Venue Registration'
                    : partnerType === 'host'
                      ? 'Host Profile'
                      : 'Promoter Enrollment'
                }
                description="Choose your plan and tell us about the applicant. You'll upload verification documents next."
              />
              <ErrorBanner
                error={error}
                onLoginClick={() => {
                  router.push('/login');
                }}
              />

              {authUser && (
                <div className="p-5 rounded-2xl bg-[var(--state-success-bg)] border border-[var(--state-success)]/20 flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-[var(--state-success)] flex items-center justify-center font-bold text-white text-lg">
                      {authUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--state-success)] uppercase tracking-wider mb-0.5">
                        Signed In As
                      </p>
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                        {authUser.email}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-[var(--state-success)]" />
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleCreateApplication();
                }}
                className="space-y-8"
              >
                {/* Plan */}
                <div className="space-y-4">
                  <SectionTitle title="Select Your Plan" />
                  <div className="grid grid-cols-1 gap-3">
                    {PLANS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          setPlan(p.value);
                        }}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${plan === p.value ? 'bg-[var(--surface-tertiary)] border-[var(--accent-primary)]' : 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[15px] font-semibold text-[var(--text-primary)]">
                            {p.label}
                          </span>
                          <span className="text-[12px] text-[var(--text-tertiary)]">{p.fee}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile */}
                <div className="space-y-5">
                  <SectionTitle
                    title={partnerType === 'promoter' ? 'Your Profile' : 'Entity Information'}
                  />

                  <FormField
                    label={
                      partnerType === 'venue'
                        ? 'Venue Name'
                        : partnerType === 'host'
                          ? 'Brand / Collective Name'
                          : 'Your Full Name'
                    }
                    icon={partnerType === 'venue' ? Building2 : User}
                    value={formData.legalName}
                    error={fieldErrors['legalName']}
                    onChange={(v) => {
                      handleProfileChange('legalName', v);
                    }}
                    placeholder={
                      partnerType === 'venue'
                        ? 'e.g. Club Eclipse'
                        : partnerType === 'host'
                          ? 'e.g. Midnight Collective'
                          : 'Your name'
                    }
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Contact Person"
                      icon={Briefcase}
                      value={formData.contactPerson}
                      error={fieldErrors['contactPerson']}
                      onChange={(v) => {
                        handleProfileChange('contactPerson', v);
                      }}
                      placeholder="Primary contact"
                    />
                    {/* Phone is a typed, unverified profile field (spec) — no OTP. */}
                    <FormField
                      label="Phone Number"
                      icon={Phone}
                      type="tel"
                      value={formData.phone}
                      error={fieldErrors['phone']}
                      onChange={(v) => {
                        handleProfileChange('phone', v);
                      }}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  {/* Local "business" toggle — reveals optional fields, no backend branch. */}
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isBusiness}
                      onChange={(e) => {
                        setIsBusiness(e.target.checked);
                      }}
                      className="h-4 w-4 rounded accent-[var(--accent-primary)]"
                    />
                    <span className="text-[13px] text-[var(--text-secondary)]">
                      I'm registering as a business / company
                    </span>
                  </label>
                  {isBusiness && (
                    <div className="grid grid-cols-1 gap-4 p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
                      <FormSelect
                        label="Business Type"
                        value={formData.businessType}
                        onChange={(v) => {
                          handleProfileChange('businessType', v);
                        }}
                        options={[{ value: '', label: 'Select business type' }, ...BUSINESS_TYPES]}
                      />
                      <FormField
                        label="Registration / CIN Number (optional)"
                        icon={Briefcase}
                        value={formData.registrationNumber}
                        onChange={(v) => {
                          handleProfileChange('registrationNumber', v);
                        }}
                        placeholder="e.g. U74999MH2020PTC123456"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                      label="City"
                      value={formData.city}
                      error={fieldErrors['city']}
                      onChange={(v) => {
                        handleProfileChange('city', v);
                      }}
                      options={[
                        { value: '', label: 'Select a city' },
                        ...CITIES.map((c) => ({ value: c, label: c })),
                      ]}
                    />
                    <FormField
                      label="Area / Locality"
                      value={formData.area}
                      onChange={(v) => {
                        handleProfileChange('area', v);
                      }}
                      placeholder="e.g. Bandra"
                    />
                  </div>

                  <FormField
                    label="Website (optional)"
                    icon={Globe}
                    value={formData.website}
                    onChange={(v) => {
                      handleProfileChange('website', v);
                    }}
                    placeholder="https://yourbrand.com"
                  />

                  {partnerType === 'venue' && (
                    <FormField
                      label="Approximate Capacity"
                      icon={Users}
                      value={formData.capacity}
                      onChange={(v) => {
                        handleProfileChange('capacity', v === '' ? null : Number(v));
                      }}
                      placeholder="e.g. 500"
                    />
                  )}

                  {partnerType === 'promoter' && (
                    <>
                      <FormField
                        label="Instagram Handle"
                        icon={AtSign}
                        value={formData.instagram}
                        onChange={(v) => {
                          handleProfileChange('instagram', v);
                        }}
                        placeholder="@yourusername"
                      />
                      <div className="space-y-2">
                        <label className="input-label" htmlFor="promoter-bio">
                          Short Bio
                        </label>
                        <textarea
                          id="promoter-bio"
                          value={formData.bio}
                          onChange={(e) => {
                            handleProfileChange('bio', e.target.value);
                          }}
                          placeholder="Tell us about your reach, experience, and what you're looking for..."
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] transition-all outline-none min-h-[120px] resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--accent-primary)] text-white h-14 rounded-2xl font-semibold text-[14px] hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      Continue to Documents <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── Step 4: Documents (authed) ── */}
          {step === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(STEP_SEQUENCE.indexOf('documents') + 1).padStart(2, '0')}
                label="Verification Documents"
                title="Verify Your Identity"
                description="Upload a government-issued ID (front and back) and a selfie. Images only — JPG, PNG or WEBP, up to 5 MB each."
              />
              {docNotice && <ErrorBanner error={docNotice} />}
              <div className="space-y-6">
                {DOCUMENT_LABELS.map((label) => {
                  const copy = docLabelCopy(label);
                  return (
                    <KycFileZone
                      key={label}
                      label={copy.title}
                      fieldName={label}
                      value={documents[label]}
                      onChange={(path) => {
                        handleDocumentUploaded(label, path);
                      }}
                      uid={authUser?.id ?? ''}
                      stepId="documents"
                      requestId={submittedRequestId}
                      docLabel={label}
                    />
                  );
                })}
              </div>
              <div className="mt-8">
                <ActionButton
                  onClick={() => {
                    setStep('review');
                  }}
                  disabled={!allDocumentsUploaded}
                >
                  {allDocumentsUploaded ? (
                    <>
                      Review & Submit <ChevronRight className="h-5 w-5" />
                    </>
                  ) : (
                    'Upload all 3 documents to continue'
                  )}
                </ActionButton>
              </div>
            </motion.div>
          )}

          {/* ── Step 5: Review + Submit (authed) ── */}
          {step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(STEP_SEQUENCE.indexOf('review') + 1).padStart(2, '0')}
                label="Review & Submit"
                title="Review Your Application"
                description="Confirm the details below before submitting for review."
              />
              <ErrorBanner error={error} />
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] space-y-3">
                  <SummaryRow
                    label="Role"
                    value={partnerType.charAt(0).toUpperCase() + partnerType.slice(1)}
                  />
                  <SummaryRow label="Plan" value={plan.charAt(0).toUpperCase() + plan.slice(1)} />
                  <SummaryRow label="Name" value={formData.legalName} />
                  <SummaryRow label="Contact" value={formData.contactPerson} />
                  <SummaryRow label="Phone" value={formData.phone} />
                  <SummaryRow label="City" value={formData.city} />
                  <SummaryRow label="Email" value={authUser?.email ?? ''} />
                </div>
                <div className="p-6 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                    Documents
                  </p>
                  <div className="space-y-2">
                    {DOCUMENT_LABELS.map((label) => (
                      <div key={label} className="flex items-center gap-3">
                        <CheckCircle2
                          className={`h-4 w-4 ${documents[label] ? 'text-[var(--state-success)]' : 'text-[var(--text-tertiary)]'}`}
                        />
                        <span className="text-[13px] text-[var(--text-secondary)]">
                          {docLabelCopy(label).title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => {
                    void submitApplication();
                  }}
                  disabled={loading || !allDocumentsUploaded}
                  className="w-full bg-[var(--accent-primary)] text-white h-14 rounded-2xl font-semibold text-[14px] hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit Application <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Success ── */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center pt-8"
            >
              {approvalStatus === 'approved' && (
                <>
                  <motion.div
                    key="approved"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                    className="h-24 w-24 rounded-3xl bg-[var(--accent-glow)] text-[var(--accent-primary)] flex items-center justify-center mx-auto mb-8"
                  >
                    <Sparkles className="h-12 w-12" />
                  </motion.div>
                  <h1 className="text-display-sm text-[var(--text-primary)] mb-4">
                    You're Approved
                  </h1>
                  <p className="text-body text-[var(--text-secondary)] mb-10 max-w-md mx-auto">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formData.legalName}
                    </span>{' '}
                    has been approved. Continue to your dashboard.
                  </p>
                  <button
                    onClick={() => void routeAfterAuth(router)}
                    className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-[var(--accent-primary)] text-white font-semibold text-[14px] hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-primary)]/20"
                  >
                    Go to Dashboard <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              {approvalStatus === 'rejected' && (
                <>
                  <motion.div
                    key="rejected"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="h-24 w-24 rounded-3xl bg-[var(--state-error-bg)] text-[var(--state-error)] flex items-center justify-center mx-auto mb-8"
                  >
                    <AlertCircle className="h-12 w-12" />
                  </motion.div>
                  <h1 className="text-display-sm text-[var(--text-primary)] mb-4">
                    Application Not Approved
                  </h1>
                  <p className="text-body text-[var(--text-secondary)] mb-10 max-w-md mx-auto">
                    {reviewNote || 'Our team was unable to approve this application.'}
                  </p>
                  <button
                    onClick={() => {
                      if (authUser) void signOut();
                      router.push('/login');
                    }}
                    className="inline-flex items-center gap-2 text-[var(--accent-primary)] font-semibold text-[14px] hover:underline"
                  >
                    Return to Login <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              {approvalStatus === 'changes_requested' && (
                <>
                  <motion.div
                    key="changes"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="h-24 w-24 rounded-3xl bg-[var(--state-warning-bg, #fbbf241a)] text-[var(--state-warning, #f59e0b)] flex items-center justify-center mx-auto mb-8"
                  >
                    <RefreshCwIcon />
                  </motion.div>
                  <h1 className="text-display-sm text-[var(--text-primary)] mb-4">
                    Changes Requested
                  </h1>
                  <p className="text-body text-[var(--text-secondary)] mb-10 max-w-md mx-auto">
                    {reviewNote ||
                      'Our team has requested changes before this application can continue.'}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setStep('details');
                      }}
                      className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-[var(--accent-primary)] text-white font-semibold text-[14px] hover:brightness-110 transition-all"
                    >
                      Fix Profile <ChevronRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (authUser) void signOut();
                        router.push('/login');
                      }}
                      className="inline-flex items-center justify-center gap-2 text-[var(--accent-primary)] font-semibold text-[14px] hover:underline"
                    >
                      Return to Login <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
              {approvalStatus === 'pending' && (
                <>
                  <motion.div
                    key="pending"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="h-24 w-24 rounded-3xl bg-[var(--state-success-bg)] text-[var(--state-success)] flex items-center justify-center mx-auto mb-8"
                  >
                    <CheckCircle2 className="h-12 w-12" />
                  </motion.div>
                  <h1 className="text-display-sm text-[var(--text-primary)] mb-4">
                    Application Submitted
                  </h1>
                  <p className="text-body text-[var(--text-secondary)] mb-10 max-w-md mx-auto">
                    Your application and verification documents for{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formData.legalName}
                    </span>{' '}
                    are under review. We'll notify you once approved.
                  </p>
                  <div className="p-6 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] mb-10 flex items-start gap-4 text-left">
                    <ShieldCheck className="h-6 w-6 text-[var(--accent-primary)] flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">
                        What Happens Next?
                      </p>
                      <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">
                        Our team reviews applications and documents within 24–48 hours.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (authUser) void signOut();
                      router.push('/login');
                    }}
                    className="inline-flex items-center gap-2 text-[var(--accent-primary)] font-semibold text-[14px] hover:underline"
                  >
                    Return to Login <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Small presentational helpers ──────────────────────────────────────────────

function RefreshCwIcon() {
  return (
    <svg
      className="h-12 w-12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function StepHeader({
  step,
  label,
  title,
  description,
}: {
  step: string;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-10">
      <p className="text-label text-[var(--accent-primary)] mb-2">
        STEP {step} — {label.toUpperCase()}
      </p>
      <h1 className="text-display-sm text-[var(--text-primary)] mb-3">{title}</h1>
      <p className="text-body text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-label text-[var(--text-tertiary)] whitespace-nowrap">{title}</span>
      <div className="h-px bg-[var(--border-subtle)] flex-1" />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] text-[var(--text-tertiary)]">{label}</span>
      <span className="text-[13px] font-semibold text-[var(--text-primary)] text-right">
        {value}
      </span>
    </div>
  );
}

function RoleCard({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${active ? 'bg-[var(--surface-tertiary)] border-[var(--accent-primary)] shadow-lg' : 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] hover:border-[var(--border-default)]'}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--surface-tertiary)] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-[16px] font-semibold mb-1 text-[var(--text-primary)]">{title}</h3>
          <p
            className={`text-[13px] leading-relaxed ${active ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)]'}`}
          >
            {description}
          </p>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-[var(--border-default)]'}`}
        >
          {active && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </motion.button>
  );
}

type FormInputProps = {
  label: string;
  icon?: LucideIcon;
} & InputHTMLAttributes<HTMLInputElement>;

function FormInput({ label, icon: Icon, ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
        )}
        <input
          className={`w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-all outline-none ${Icon ? 'pl-12 pr-4' : 'px-4'} py-3.5 hover:border-[var(--border-default)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] disabled:opacity-60 disabled:cursor-not-allowed`}
          {...props}
        />
      </div>
    </div>
  );
}

function FormField({
  label,
  icon: Icon,
  value,
  error,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  label: string;
  icon?: LucideIcon;
  value: string | number | null;
  error?: string | undefined;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
        )}
        <input
          type={type}
          value={value ?? ''}
          onChange={
            onChange
              ? (e) => {
                  onChange(e.target.value);
                }
              : undefined
          }
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-all outline-none ${Icon ? 'pl-12 pr-4' : 'px-4'} py-3.5 hover:border-[var(--border-default)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-[var(--state-error)]' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-[var(--state-error)]">{error}</p>}
    </div>
  );
}

function FormSelect({
  label,
  value,
  error,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  error?: string | undefined;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          disabled={disabled}
          className={`w-full bg-[var(--surface-secondary)] border rounded-xl px-4 py-3.5 text-[14px] text-[var(--text-primary)] appearance-none cursor-pointer transition-all outline-none hover:border-[var(--border-default)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] ${error ? 'border-[var(--state-error)]' : 'border-[var(--border-subtle)]'}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)] rotate-90 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-[var(--state-error)]">{error}</p>}
    </div>
  );
}

function ActionButton({
  onClick,
  loading = false,
  loadingText = 'Processing...',
  disabled = false,
  children,
}: {
  onClick?: () => void;
  loading?: boolean;
  loadingText?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full bg-[var(--accent-primary)] text-white h-14 rounded-2xl font-semibold text-[14px] hover:brightness-110 transition-all flex items-center justify-center gap-3 shadow-lg shadow-[var(--accent-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function ErrorBanner({ error, onLoginClick }: { error: string; onLoginClick?: () => void }) {
  if (!error) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-5 bg-[var(--state-error-bg)] border border-[var(--state-error)]/20 rounded-2xl"
    >
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-[var(--state-error)] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[var(--state-error)]">{error}</p>
          {onLoginClick && /log in|sign in/i.test(error) && (
            <button
              onClick={onLoginClick}
              className="text-[12px] font-semibold text-[var(--state-error)] underline hover:no-underline mt-2 inline-block"
            >
              Go to Login →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Document upload zone ───────────────────────────────────────────────────────
// One of the backend's fixed 3 slots (id_front / id_back / selfie). The upload
// lands server-side through the app's own BFF (`uploadDocument`); the browser
// never performs a cross-origin PUT.
function KycFileZone({
  label,
  fieldName: _fieldName,
  value,
  onChange,
  uid: _uid,
  stepId: _stepId,
  requestId,
  docLabel,
}: {
  label: string;
  fieldName: string;
  value: string | null;
  onChange: (storagePath: string | null) => void;
  uid: string;
  stepId: string;
  /** The application to attach this document to; required. */
  requestId: string | null;
  /** The real backend document slot for this field. */
  docLabel: 'id_front' | 'id_back' | 'selfie';
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploadError('');
    if (!requestId) {
      setUploadError('Your application has not been created yet. Please go back and try again.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5MB.');
      return;
    }

    const contentType = file.type;
    if (
      contentType !== 'image/jpeg' &&
      contentType !== 'image/png' &&
      contentType !== 'image/webp'
    ) {
      setUploadError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    setUploading(true);
    setProgress(10);
    try {
      const updated = await uploadDocument(requestId, docLabel, file, crypto.randomUUID());
      setProgress(100);
      onChange(updated.documents.find((doc) => doc.label === docLabel)?.storagePath ?? null);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </label>
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span className="text-[12px] text-emerald-400 font-medium truncate flex-1">Uploaded</span>
          <button
            type="button"
            onClick={() => {
              onChange(null);
            }}
            className="p-1 rounded-lg hover:bg-red-500/20 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : uploading ? (
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />
            <span className="text-[12px] text-[var(--text-tertiary)]">Uploading… {progress}%</span>
          </div>
          <div className="progress-bar w-full">
            {/* eslint-disable no-restricted-syntax -- dynamic upload width is set inline; the design-token .progress-bar/.progress-bar-fill classes carry the chrome. */}
            <div
              className="progress-bar-fill progress-bar-fill-accent"
              style={{ width: `${String(progress)}%` }}
            />
            {/* eslint-enable no-restricted-syntax */}
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full p-5 rounded-xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/40 bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] transition-all text-center group"
          >
            <Upload className="h-5 w-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] mx-auto mb-1.5 transition-colors" />
            <p className="text-[11px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
              Click to upload · JPG, PNG or WEBP · Max 5MB
            </p>
          </button>
          {uploadError && (
            <p className="text-[11px] font-medium text-red-400 flex items-center gap-1.5 mt-2">
              <AlertCircle className="h-3.5 w-3.5" />
              {uploadError}
            </p>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && void handleFile(e.target.files[0])}
      />
    </div>
  );
}
