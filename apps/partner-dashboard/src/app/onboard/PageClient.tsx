'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Users,
  Zap,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Lock,
  User,
  MapPin,
  Phone,
  Briefcase,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw,
  Building,
  Globe,
  Loader2,
  Upload,
  X,
  ArrowRight,
} from 'lucide-react';
import { isApiClientError } from '@c1rcle/api-client';
import { getClientEnv } from '@c1rcle/config';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import {
  addDocument,
  getMine,
  getUploadUrl,
  saveProgress as saveOnboardingProgress,
  start as startOnboarding,
  submit as submitOnboardingApplication,
  verifyDocument,
} from '@/lib/onboarding/onboarding-repository';
import { sendOtp, verifyOtp } from '@/lib/onboarding/otp';
import { uploadToSignedUrl } from '@/lib/onboarding/uploadToSignedUrl';
import { confirmPhoneOtp, getTestingBypassEnabled, sendPhoneOtp } from '@/lib/firebase/phone-auth';
import { routeAfterAuth } from '@/lib/org/route-after-auth';

import type { ConfirmationResult } from 'firebase/auth';

const PHONE_RECAPTCHA_CONTAINER_ID = 'phone-verify-recaptcha';

/** v1's rule, ported: a bare 10-digit number is assumed Indian (+91-prefixed). */
function toE164(phone: string): string {
  const digitsOnly = phone.replace(/[^\d+]/g, '');
  if (digitsOnly.startsWith('+')) return digitsOnly;
  if (/^\d{10}$/.test(digitsOnly)) return `+91${digitsOnly}`;
  return `+${digitsOnly}`;
}

const Instagram = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// ── Step type ─────────────────────────────────────────────────────────────────
type OnboardingStep =
  | 'signup'
  | 'email_verify'
  | 'phone_verify'
  | 'entity_type'
  | 'role'
  | 'details'
  | 'kyc_identity'
  | 'kyc_business'
  | 'kyc_signatory'
  | 'success';

type PartnerType = 'venue' | 'host' | 'promoter';
type EntityType = 'individual' | 'business';

// Dynamic sequence based on entity type (KYC steps vary). `signup` runs
// before `email_verify` — the real `/onboarding/otp/send` route requires an
// authenticated session, so the account must exist before the first OTP.
function getStepSequence(et: EntityType): OnboardingStep[] {
  const kycSteps: OnboardingStep[] =
    et === 'business' ? ['kyc_business', 'kyc_signatory'] : ['kyc_identity'];
  return [
    'role',
    'signup',
    'email_verify',
    'phone_verify',
    'entity_type',
    'details',
    ...kycSteps,
    'success',
  ];
}

const STEP_LABELS: Record<OnboardingStep, string> = {
  signup: 'Sign Up',
  email_verify: 'Email',
  phone_verify: 'Phone',
  entity_type: 'Entity',
  role: 'Role',
  details: 'Details',
  kyc_identity: 'Identity',
  kyc_business: 'Business',
  kyc_signatory: 'Signatory',
  success: 'Done',
};

// ── Main component ────────────────────────────────────────────────────────────
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user: authUser,
    signIn: authSignIn,
    signUp: authSignUp,
    signOut,
    loading: authLoading,
  } = useDashboardAuth();

  const clientEnv = getClientEnv();
  const testingBypass = getTestingBypassEnabled();
  const testPhone = testingBypass ? (clientEnv.NEXT_PUBLIC_FIREBASE_TEST_PHONE ?? '') : '';

  const [step, setStep] = useState<OnboardingStep>('role');
  const [partnerType, setPartnerType] = useState<PartnerType>('venue');
  const [entityType, setEntityType] = useState<EntityType>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'verified'>('pending');
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // KYC step state — documents are uploaded/confirmed server-side as each
  // KycFileZone completes; kycStepData is local UI bookkeeping only now.
  const [createdUid, setCreatedUid] = useState<string | null>(null);
  const [, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState('');

  // Existing user detection state
  const [emailExists, setEmailExists] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');

  // OTP state — provider-agnostic; only verification.js changes per provider
  const [otpEmail, setOtpEmail] = useState('');
  const [otpEmailCode, setOtpEmailCode] = useState('');
  const [otpEmailSent, setOtpEmailSent] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const [otpPhone, setOtpPhone] = useState(testPhone || '+91 ');
  const [otpPhoneCode, setOtpPhoneCode] = useState('');
  const [otpPhoneSent, setOtpPhoneSent] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);

  const emailCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Phone verification — real Firebase Identity Platform flow.
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Form data — all existing fields preserved exactly
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    contactPerson: '',
    phone: '',
    city: '',
    area: '',
    website: '',
    capacity: '',
    plan: 'silver',
    role: 'organizer',
    association: '',
    associatedHostId: '',
    instagram: '',
    bio: '',
    upcomingEventsText: '',
    pastEventsText: '',
    businessType: 'pvt_ltd',
    registrationNumber: '',
  });

  // ── Save onboarding progress so the user can resume mid-form ─────────
  // `currentStep` is UI-only now — the real backend has no step field, it
  // just stores profile fields; resume position is re-derived from those
  // fields + document/status state via `getMine()`, not from a stored step.
  // `plan`/`role`/`association`/`associatedHostId`/`upcomingEventsText`/
  // `pastEventsText` have no home in `saveOnboardingProgressSchema` (it's
  // `.strict()`) so they stay purely local UI state, never sent to the server.
  const saveProgress = useCallback(
    async (_currentStep: OnboardingStep) => {
      if (!submittedRequestId) return;
    async (_currentStep: OnboardingStep) => {
      if (!submittedRequestId) return;
      try {
        await saveOnboardingProgress(submittedRequestId, {
          legalName: formData.name || undefined,
          contactPerson: formData.contactPerson || undefined,
          phone: formData.phone || otpPhone.replace(/\s/g, '') || undefined,
          city: formData.city || undefined,
          area: formData.area || undefined,
          website: formData.website || undefined,
          capacity: formData.capacity ? Number(formData.capacity) : undefined,
          instagram: formData.instagram || undefined,
          bio: formData.bio || undefined,
          businessType: formData.businessType || undefined,
          registrationNumber: formData.registrationNumber || undefined,
          entityType: entityType || undefined,
        });
      } catch {
        /* silent — non-critical, matches the prior best-effort autosave */
      }
    },
    [submittedRequestId, entityType, formData, otpPhone],
  );

  // Dynamic sequence depends on entity type chosen at step 4
  const stepSequence = getStepSequence(entityType);

  const initialised = useRef(false);

  // Pre-fill from URL params (existing behaviour kept)
  useEffect(() => {
    const type = searchParams.get('type') as PartnerType;
    const email = searchParams.get('email');
    const hostId = searchParams.get('hostId');
    if (type) setPartnerType(type);
    if (email) {
      setOtpEmail(email);
      setFormData((prev) => ({ ...prev, email }));
    }
    if (hostId) setFormData((prev) => ({ ...prev, associatedHostId: hostId }));
  }, [searchParams]);

  // ── Resume onboarding state from the real backend on load ────────────────
  // There is no server-side `onboardingStep` field — the step to resume at is
  // derived from what the draft request actually has on it, via
  // `getMyOnboardingRequest()` (`/api/auth/me` never existed on the real
  // system). If no request exists yet, the account is signed out and the
  // wizard restarts from `role` — mirrors the old "enforce Step 1" behaviour.
  const initialChecked = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (initialChecked.current) return;

    const checkInitialState = async () => {
      initialChecked.current = true;
      if (authUser) {
        try {
          const application = await getMine();
          if (application) {
            setSubmittedRequestId(application.id);

            if (application.status !== 'draft') {
              // submitted / changes_requested / approved / rejected — the
              // success screen renders the real status, no further wizard
              // steps to resume into.
              setApprovalStatus(application.status === 'approved' ? 'verified' : 'pending');
              setStep('success');
              initialised.current = true;
              return;
            }

            // Draft application — resume mid-wizard from its saved profile.
            // The backend has no stored "step"; missingDocuments tells us
            // whether they still owe KYC images or are ready to submit.
            const p = application.profile;
            const isBusiness = p.entityType === 'business';
            setEntityType(isBusiness ? 'business' : 'individual');
            setCreatedUid(authUser.id);

            setFormData((prev) => ({
              ...prev,
              email: authUser.email || prev.email,
              name: p.legalName || prev.name,
              contactPerson: p.contactPerson || prev.contactPerson,
              phone: p.phone || prev.phone,
              city: p.city || prev.city,
              area: p.area || prev.area,
              website: p.website || prev.website,
              capacity: p.capacity != null ? String(p.capacity) : prev.capacity,
              instagram: p.instagram || prev.instagram,
              bio: p.bio || prev.bio,
              businessType: p.businessType || prev.businessType,
              registrationNumber: p.registrationNumber || prev.registrationNumber,
            }));
            if (p.phone) {
              setOtpPhone(p.phone);
            }

            const seq = getStepSequence(isBusiness ? 'business' : 'individual');
            const resumeStep =
              application.missingDocuments.length > 0
                ? seq[seq.indexOf('details') + 1]
                : seq[seq.length - 2];
            setStep(resumeStep ?? 'details');
            initialised.current = true;
            return;
          }

          // Authenticated but no application on record yet — this account is
          // already good (they have a live session), so continue the wizard
          // from the first authed step instead of discarding it. Mirrors the
          // equivalent branch in `handleExistingUserLogin`.
          setFormData((prev) => ({ ...prev, email: authUser.email || prev.email }));
          setOtpEmail(authUser.email || '');
          initialised.current = true;
          setStep('phone_verify');
          return;
        } catch (err) {
          console.error('Error checking initial onboarding state:', err);
        }
      }
      setStep('role');
    };

    checkInitialState();
  }, [authLoading, authUser, signOut]);

  // Approval polling — real application status via getMine()
  useEffect(() => {
    if (step !== 'success' || !submittedRequestId) return;
    const checkApproval = async () => {
      try {
        const application = await getMine();
        if (!application) return;
        setApprovalStatus(application.status === 'approved' ? 'verified' : 'pending');
      } catch {
        /* silent */
      }
    };
    checkApproval();
    const interval = setInterval(checkApproval, 10_000);
    return () => clearInterval(interval);
  }, [step, submittedRequestId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  function startCooldown(
    setter: React.Dispatch<React.SetStateAction<number>>,
    ref: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
  ) {
    setter(60);
    ref.current = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) {
          clearInterval(ref.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Signup ────────────────────────────────────────────────────────────────
  // Its own step, before email verification (per ONBOARDING-FLOW-SPEC-2026-09-01.md
  // §Step 2): the real `/onboarding/otp/send` route is a "new-signup gate" —
  // it requires an authenticated session (requireUserId) — so the account
  // has to exist before the first OTP send, not folded into that screen.
  // No real check-email endpoint exists; a duplicate email surfaces as a 409
  // here, routing to the "Welcome Back" sign-in recovery instead of a
  // separate enumeration-risk pre-flight check.
  const handleSignup = async () => {
    setError('');
    if (!formData.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      await authSignUp(otpEmail, formData.password, formData.name.trim());
      await sendOtp(otpEmail);
      setOtpEmailSent(true);
      setFormData((prev) => ({ ...prev, email: otpEmail }));
      startCooldown(setEmailCooldown, emailCooldownRef);
      setStep('email_verify');
    } catch (err) {
      if (isApiClientError(err) && err.status === 409) {
        setEmailExists(true);
        setError('This email is already registered.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExistingUserLogin = async () => {
    setError('');
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    try {
      await authSignIn(otpEmail, loginPassword);

      const application = await getMine();

      if (application && application.status !== 'draft') {
        setSubmittedRequestId(application.id);
        setApprovalStatus(application.status === 'approved' ? 'verified' : 'pending');
        initialised.current = true;
        setStep('success');
        setLoading(false);
        return;
      }

      if (application) {
        setSubmittedRequestId(application.id);
        const p = application.profile;
        const isBusiness = p.entityType === 'business';
        setEntityType(isBusiness ? 'business' : 'individual');

        setFormData((prev) => ({
          ...prev,
          email: otpEmail,
          name: p.legalName || prev.name,
          contactPerson: p.contactPerson || prev.contactPerson,
          phone: p.phone || prev.phone,
          city: p.city || prev.city,
          area: p.area || prev.area,
          website: p.website || prev.website,
          capacity: p.capacity != null ? String(p.capacity) : prev.capacity,
          instagram: p.instagram || prev.instagram,
          bio: p.bio || prev.bio,
          businessType: p.businessType || prev.businessType,
          registrationNumber: p.registrationNumber || prev.registrationNumber,
        }));
        if (p.phone) setOtpPhone(p.phone);

        const seq = getStepSequence(isBusiness ? 'business' : 'individual');
        const nextStep =
          application.missingDocuments.length > 0
            ? seq[seq.indexOf('details') + 1]
            : seq[seq.length - 2];

        initialised.current = true;
        setStep(nextStep ?? 'details');
        return;
      }

      // Account exists but never started an application — resume at
      // phone_verify, not details: this account has never had its phone
      // collected/verified, and `handleCreateAccount` requires a valid
      // phone (min 6 chars) to open the application. Email is already
      // known-good (they just logged in with it), so email_verify is
      // skipped, but phone still needs collecting.
      setFormData((prev) => ({ ...prev, email: otpEmail }));
      initialised.current = true;
      setStep('phone_verify');
    } catch (err: any) {
      console.error('Existing user login error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOtp = async () => {
    setError('');
    if (!otpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(otpEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await sendOtp(otpEmail);
      setOtpEmailSent(true);
      setFormData((prev) => ({ ...prev, email: otpEmail }));
      startCooldown(setEmailCooldown, emailCooldownRef);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setError('');
    if (otpEmailCode.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(otpEmail, otpEmailCode);
      setStep('phone_verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Phone OTP — real Firebase Identity Platform flow ──────────────────────
  // Runs after account creation (`details`), when a session already exists —
  // `/api/auth/phone-verification` forwards the session cookie.
  const handleSendPhoneOtp = async () => {
    setError('');
    const cleanPhone = otpPhone.replace(/\s/g, '');
    if (!cleanPhone) {
      setError('Please enter a phone number.');
      return;
    }

    // Check for only numbers (with optional leading +)
    if (!/^\+?[0-9]+$/.test(cleanPhone)) {
      setError('Phone number must contain only numbers (no letters or special characters).');
      return;
    }

    const digitsOnly = cleanPhone.replace(/[^\d]/g, '');
    if (cleanPhone.startsWith('+')) {
      if (cleanPhone.startsWith('+91')) {
        const localNumber = cleanPhone.slice(3);
        if (localNumber.length !== 10) {
          setError('Please enter a valid 10-digit Indian mobile number after +91.');
          return;
        }
      } else {
        if (digitsOnly.length < 8) {
          setError('Phone number too short. Include your country code (e.g., +919876543210).');
          return;
        }
      }
    } else {
      if (digitsOnly.length !== 10) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    }

    const dialablePhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${digitsOnly}`;

    setLoading(true);
    try {
      // No real phone-availability pre-check exists; a duplicate phone has no
      // enforcement point until the application is saved, same tradeoff as
      // the dropped email pre-check above.
      //
      // GCP Identity Platform owns send/verify/rate-limit/cooldown for phone
      // entirely client-side (see lib/firebase/phone-auth.ts) — there is no
      // backend OTP call here, unlike the email step above.
      const confirmation = await sendPhoneOtp(toE164(cleanPhone), PHONE_RECAPTCHA_CONTAINER_ID);
      setPhoneConfirmation(confirmation);
      setOtpPhoneSent(true);
      setFormData((prev) => ({ ...prev, phone: dialablePhone }));
      startCooldown(setPhoneCooldown, phoneCooldownRef);
    } catch (err: any) {
      setError(err.message || 'Could not send the SMS code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    setError('');
    if (otpPhoneCode.length !== 6) {
      setError('Enter the 6-digit code.');
      return;
    }
    if (!phoneConfirmation) {
      setError('Please request a new code.');
      return;
    }
    setLoading(true);
    try {
      const cleanPhone = otpPhone.replace(/\s/g, '');
      // Identity Platform confirming the code only proves the applicant holds
      // that Firebase-side session, not that it's their number — the ID token
      // it returns still has to be checked server-side against the applicant's
      // own entered number via the real onboarding verification endpoint.
      const idToken = await confirmPhoneOtp(phoneConfirmation, otpPhoneCode);
      const result = await verifyDocument({
        documentType: 'phone',
        documentNumber: cleanPhone,
        proofToken: idToken,
      });
      if (!result.passed) {
        throw new Error(result.reason || 'Phone verification failed.');
      }
      setStep('entity_type');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 5: Open the application, advance to KYC ──
  // The account itself was already created back at the email_verify step
  // (the real OTP send route requires an existing session) and the phone
  // was already format-validated there too, so this step only opens the
  // onboarding application against the now-established session.
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!authUser) {
        setError('Your session expired. Please verify your email again to continue.');
        setStep('email_verify');
        setLoading(false);
        return;
      }
      const createPhone = formData.phone || otpPhone.replace(/\s/g, '');

      // Open the application now that we have a real session — this is the
      // one call that persists the full profile server-side; the request id
      // it returns backs every subsequent saveProgress/upload/submit call.
      const application = await startOnboarding(
        {
          requestedType: partnerType,
          plan: formData.plan as 'basic' | 'silver' | 'diamond',
          profile: {
            legalName: formData.name,
            contactPerson: formData.contactPerson,
            phone: createPhone,
            city: formData.city,
            area: formData.area || undefined,
            website: formData.website || undefined,
            capacity: formData.capacity ? Number(formData.capacity) : undefined,
            instagram: formData.instagram || undefined,
            bio: formData.bio || undefined,
            businessType: formData.businessType || undefined,
            registrationNumber: formData.registrationNumber || undefined,
            entityType,
          },
        },
        crypto.randomUUID(),
      );
      setSubmittedRequestId(application.id);
      setCreatedUid(authUser?.id ?? null);

      // Advance to the first KYC step in the sequence
      const seq = getStepSequence(entityType);
      const detailsIdx = seq.indexOf('details');
      const nextStep = seq[detailsIdx + 1];
      if (nextStep) {
        setStep(nextStep);
      }
    } catch (err: any) {
      console.error('Account creation error:', err);
      if (isApiClientError(err) && err.status === 409) {
        setError('You already have an application in progress.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── KYC step: save data and submit when it's the last step ─────────────
  // Documents themselves are already uploaded/verified by this point (each
  // KycFileZone / handleVerifyAadhaar call landed on the application as it
  // happened) — this only needs to flag the application as submitted.
  const submitApplication = useCallback(
    async (_stepId: string, _data: Record<string, unknown>) => {
      setKycSubmitting(true);
      setKycError('');
      try {
        if (!submittedRequestId) {
          throw new Error('No application found. Please restart onboarding.');
        }
        const application = await submitOnboardingApplication(
          submittedRequestId,
          crypto.randomUUID(),
        );
        setSubmittedRequestId(application.id);
        setApprovalStatus('pending');
        setStep('success');
      } catch (err: any) {
        console.error('Final submit error:', err);
        if (isApiClientError(err) && err.status === 400) {
          setKycError(
            err.fieldErrors
              ? Object.values(err.fieldErrors).flat().join(' ')
              : 'Please upload all required documents before submitting.',
          );
        } else {
          setKycError(err?.message || 'Failed to submit. Please try again.');
        }
      } finally {
        setKycSubmitting(false);
      }
    },
    [submittedRequestId],
  );

  // ── Intermediate KYC step: advance, or submit on the last one ──────────
  // Documents are already uploaded/confirmed server-side by KycFileZone as
  // each field is filled in — this only advances the wizard.
  const handleKycStep = useCallback(
    (stepId: string, _data: Record<string, unknown>) => {
      const idx = stepSequence.indexOf(stepId as OnboardingStep);
      const isLastStep = idx === stepSequence.length - 2; // second-to-last (before "success")
      if (isLastStep) {
        submitApplication(stepId, data);
      } else {
        if (idx !== -1 && idx < seq.length - 1) {
          const next = seq[idx + 1];
          if (next) {
            setStep(next);
            saveProgress(next);
          }
        }
      }
    },
    [stepSequence, submitApplication, saveProgress],
  );

  const currentStepIndex = stepSequence.indexOf(step);
  const effectiveUid = createdUid || authUser?.id || '';
  const effectiveUid = createdUid || authUser?.id || '';

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--surface-base)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={async () => {
              if (currentStepIndex === 0) {
                if (authUser) await signOut();
                router.push('/login');
              } else {
                const prevStep = stepSequence[currentStepIndex - 1];
                if (prevStep) setStep(prevStep);
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

      {/* Progress bar — auto-driven by stepSequence */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="flex items-center">
          {stepSequence
            .filter((s) => s !== 'success')
            .map((s, i) => {
              const isDone = currentStepIndex > i;
              const isCurrent = currentStepIndex === i;
              const isLast = i === stepSequence.filter((s) => s !== 'success').length - 1;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      disabled={!isDone}
                      onClick={() => isDone && setStep(s)}
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

      <main className="max-w-xl mx-auto px-6 pb-24">
        <AnimatePresence mode="wait">
          {/* ── Sign Up ── */}
          {step === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('signup') + 1).padStart(2, '0')}
                label="Sign Up"
                title={emailExists ? 'Welcome Back' : 'Create Your Account'}
                description={
                  emailExists
                    ? 'Log in with your existing account to resume onboarding.'
                    : "Enter your email and set a password. We'll verify your email next."
                }
              />
              {/* In-place Sign Up / Log In toggle — switching never leaves /onboard,
                  so partner-type + progress are kept regardless of which path a
                  visitor takes. */}
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
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    required
                  />
                )}
                <FormInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={otpEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpEmail(e.target.value)}
                  placeholder="you@company.com"
                />
                <div className="relative">
                  <FormInput
                    label="Password"
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={emailExists ? loginPassword : formData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      emailExists
                        ? setLoginPassword(e.target.value)
                        : setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    placeholder={emailExists ? 'Enter your password' : 'Minimum 8 characters'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-[42px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {emailExists ? (
                  <ActionButton
                    onClick={handleExistingUserLogin}
                    loading={loading}
                    loadingText="AUTHORIZING ACCESS..."
                  >
                    Verify & Login <ChevronRight className="h-5 w-5" />
                  </ActionButton>
                ) : (
                  <ActionButton onClick={handleSignup} loading={loading}>
                    Continue <ChevronRight className="h-5 w-5" />
                  </ActionButton>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Email Verification ── */}
          {step === 'email_verify' && (
            <motion.div
              key="email_verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('email_verify') + 1).padStart(2, '0')}
                label="Verify Email"
                title="Confirm Your Email"
                description="Enter the 6-digit code we sent to confirm your email address."
              />
              <ErrorBanner error={error} />
              <div className="space-y-5">
                <FormInput
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={otpEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtpEmail(e.target.value)}
                  placeholder="you@company.com"
                  disabled={otpEmailSent}
                />
                {!otpEmailSent ? (
                  <ActionButton onClick={handleSendEmailOtp} loading={loading}>
                    Send Code <ChevronRight className="h-5 w-5" />
                  </ActionButton>
                ) : (
                  <>
                    <OtpInput
                      label="Enter the 6-digit code sent to your email"
                      value={otpEmailCode}
                      onChange={setOtpEmailCode}
                    />
                    <ActionButton onClick={handleVerifyEmailOtp} loading={loading}>
                      Verify Email <ChevronRight className="h-5 w-5" />
                    </ActionButton>
                    <ResendButton
                      cooldown={emailCooldown}
                      onClick={handleSendEmailOtp}
                      loading={loading}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setOtpEmailSent(false);
                        setError('');
                        setOtpEmailCode('');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      Use a different email
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Phone Verification ── */}
          {step === 'phone_verify' && (
            <motion.div
              key="phone_verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('phone_verify') + 1).padStart(2, '0')}
                step={String(stepSequence.indexOf('phone_verify') + 1).padStart(2, '0')}
                label="Verify Phone"
                title="Confirm Your Number"
                description="We'll send an SMS code to confirm your mobile number. This becomes your verified contact on the platform."
              />
              <ErrorBanner error={error} />
              {testingBypass && (
                <div className="mb-6 p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0" />
                  <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    Testing mode: SMS and reCAPTCHA are skipped. Enter the test number configured
                    in the Firebase Console (Authentication → Phone → Test phone numbers)
                    {testPhone
                      ? ' — pre-filled below.'
                      : ', e.g. +1 555 555 0100.'}{' '}
                    Use the exact code configured for that number in the console (not an
                    arbitrary one).
                  </p>
                </div>
              )}
              {/* Invisible reCAPTCHA anchor for Firebase's signInWithPhoneNumber — renders nothing visible. */}
              <div id={PHONE_RECAPTCHA_CONTAINER_ID} />
              <div className="space-y-5">
                <FormInput
                  label="Mobile Number (with country code)"
                  icon={Phone}
                  type="tel"
                  value={otpPhone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    let sanitized = val.replace(/[^0-9+\s]/g, '');
                    if (sanitized.indexOf('+') > 0) {
                      sanitized = sanitized[0] + sanitized.slice(1).replace(/\+/g, '');
                    }
                    setOtpPhone(sanitized);
                  }}
                  placeholder="+91 98765 43210"
                  disabled={otpPhoneSent}
                />
                {!otpPhoneSent ? (
                  <ActionButton onClick={handleSendPhoneOtp} loading={loading}>
                    Send SMS Code <ChevronRight className="h-5 w-5" />
                  </ActionButton>
                ) : (
                  <>
                    <OtpInput
                      label="Enter the 6-digit SMS code"
                      value={otpPhoneCode}
                      onChange={setOtpPhoneCode}
                    />
                    <ActionButton onClick={handleVerifyPhoneOtp} loading={loading}>
                      Verify Phone <ChevronRight className="h-5 w-5" />
                    </ActionButton>
                    <ResendButton
                      cooldown={phoneCooldown}
                      onClick={handleSendPhoneOtp}
                      loading={loading}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setOtpPhoneSent(false);
                        setError('');
                        setOtpPhoneCode('');
                        setPhoneConfirmation(null);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      Use a different number
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Entity Type ── */}
          {step === 'entity_type' && (
            <motion.div
              key="entity_type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('entity_type') + 1).padStart(2, '0')}
                step={String(stepSequence.indexOf('entity_type') + 1).padStart(2, '0')}
                label="Entity Type"
                title="Individual or Business?"
                description="This determines which verification documents you'll provide after approval."
              />
              <div className="grid grid-cols-1 gap-4 mb-10">
                <RoleCard
                  icon={User}
                  title="Individual"
                  description="Freelancer, independent promoter, solo DJ, or individual host."
                  active={entityType === 'individual'}
                  onClick={() => setEntityType('individual')}
                />
                <RoleCard
                  icon={Building}
                  title="Business"
                  description="Registered company, club, LLP, partnership firm, or trust."
                  active={entityType === 'business'}
                  onClick={() => setEntityType('business')}
                />
              </div>
              <ActionButton
                onClick={() => {
                  setError('');
                  setStep('details');
                }}
              >
                Continue <ChevronRight className="h-5 w-5" />
              </ActionButton>
            </motion.div>
          )}

          {/* ── Role Selection ── */}
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('role') + 1).padStart(2, '0')}
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
                  onClick={() => setPartnerType('venue')}
                />
                <RoleCard
                  icon={Users}
                  title="Event Host"
                  description="For organizers, DJs, and collectives hosting independent events."
                  active={partnerType === 'host'}
                  onClick={() => setPartnerType('host')}
                />
                <RoleCard
                  icon={Zap}
                  title="Promoter"
                  description="Access tools for ticket distribution and guestlist management."
                  active={partnerType === 'promoter'}
                  onClick={() => setPartnerType('promoter')}
                />
              </div>
              <ActionButton
                onClick={() => {
                  setError('');
                  setStep('signup');
                }}
              >
                Continue <ChevronRight className="h-5 w-5" />
              </ActionButton>
            </motion.div>
          )}

          {/* ── Details Form ── */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('details') + 1).padStart(2, '0')}
                label="Your Details"
                title={
                  partnerType === 'venue'
                    ? 'Venue Registration'
                    : partnerType === 'host'
                      ? 'Host Profile'
                      : 'Promoter Enrollment'
                }
                description="Tell us about your business. You'll upload verification documents in the next steps."
              />

              <ErrorBanner error={error} onLoginClick={() => router.push('/login')} />

              <form onSubmit={handleCreateAccount} className="space-y-8">
                {/* Credentials — the account was already created back at the
                    email_verify step, so this is just a confirmation banner. */}
                {authUser && (
                  <div className="p-5 rounded-2xl bg-[var(--state-success-bg)] border border-[var(--state-success)]/20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-xl bg-[var(--state-success)] flex items-center justify-center font-bold text-white text-lg">
                        {authUser.email?.[0].toUpperCase()}
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

                {/* Entity Information */}
                <div className="space-y-5">
                  <SectionTitle
                    title={partnerType === 'promoter' ? 'Your Profile' : 'Entity Information'}
                  />

                  {entityType === 'business' ? (
                    <>
                      <FormInput
                        label="Legal Business Name"
                        icon={Building}
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. Eclipse Nightlife Pvt. Ltd."
                      />
                      <FormSelect
                        label="Business Type"
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleInputChange}
                        options={[
                          { value: 'pvt_ltd', label: 'Private Limited' },
                          { value: 'llp', label: 'LLP' },
                          { value: 'partnership', label: 'Partnership Firm' },
                          { value: 'sole_prop', label: 'Sole Proprietorship' },
                          { value: 'trust', label: 'Trust / Society' },
                        ]}
                      />
                      <FormInput
                        label="Registration / CIN Number (optional)"
                        icon={Briefcase}
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        placeholder="e.g. U74999MH2020PTC123456"
                      />
                    </>
                  ) : (
                    <FormInput
                      label={
                        partnerType === 'venue'
                          ? 'Venue Name'
                          : partnerType === 'host'
                            ? 'Brand / Collective Name'
                            : 'Your Full Name'
                      }
                      icon={partnerType === 'venue' ? Building2 : User}
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder={
                        partnerType === 'venue'
                          ? 'e.g. Club Eclipse'
                          : partnerType === 'host'
                            ? 'e.g. Midnight Collective'
                            : 'Your name'
                      }
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label={entityType === 'business' ? 'Authorized Contact' : 'Contact Person'}
                      icon={Briefcase}
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      required
                      placeholder="Primary contact"
                    />
                    {/* Phone is now verified in a later step (after account
                        creation, since /api/auth/phone-verification requires
                        a session) — collected here as plain text instead. */}
                    <FormInput
                      label="Phone Number"
                      icon={Phone}
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      options={[
                        { value: '', label: 'Select a city' },
                        { value: 'Pune', label: 'Pune' },
                        { value: 'Mumbai', label: 'Mumbai' },
                        { value: 'Goa', label: 'Goa' },
                        { value: 'Bengaluru', label: 'Bengaluru' },
                        { value: 'Delhi', label: 'Delhi' },
                        { value: 'Hyderabad', label: 'Hyderabad' },
                        { value: 'Chennai', label: 'Chennai' },
                        { value: 'Kolkata', label: 'Kolkata' },
                        { value: 'Jaipur', label: 'Jaipur' },
                        { value: 'Ahmedabad', label: 'Ahmedabad' },
                      ]}
                    />
                    <FormInput
                      label="Area / Locality"
                      icon={MapPin}
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Bandra"
                    />
                  </div>

                  <FormInput
                    label="Website (optional)"
                    icon={Globe}
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://yourbrand.com"
                  />

                  {/* Role-specific fields */}
                  {partnerType === 'venue' && (
                    <>
                      <FormInput
                        label="Approximate Capacity"
                        icon={Users}
                        name="capacity"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g. 500"
                      />
                      <FormSelect
                        label="Subscription Tier"
                        name="plan"
                        value={formData.plan}
                        onChange={handleInputChange}
                        options={[
                          { value: 'basic', label: 'Basic Access' },
                          { value: 'silver', label: 'Silver Tier' },
                          { value: 'gold', label: 'Gold Premium' },
                          { value: 'diamond', label: 'Diamond Private' },
                        ]}
                      />
                    </>
                  )}
                  {partnerType === 'host' && (
                    <FormSelect
                      label="Host Category"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      options={[
                        { value: 'dj', label: 'Individual DJ / Artist' },
                        { value: 'organizer', label: 'Event Organizer' },
                        { value: 'collective', label: 'Collective / Label' },
                      ]}
                    />
                  )}
                  {partnerType === 'promoter' && (
                    <>
                      <FormInput
                        label="Instagram Handle"
                        icon={Instagram}
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleInputChange}
                        required
                        placeholder="@yourusername"
                      />
                      <div className="space-y-2">
                        <label className="input-label">Short Bio</label>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Tell us about your reach, experience, and what you're looking for..."
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] transition-all outline-none min-h-[120px] resize-none"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="input-label">Upcoming Events (optional)</label>
                        <textarea
                          name="upcomingEventsText"
                          value={formData.upcomingEventsText}
                          onChange={handleInputChange}
                          placeholder={
                            'One event per line\nSummer Fridays | Jun 14 2026 | Toy Room | Mumbai\nCampus Heatwave | Jul 05 2026 | Kitty Su | Delhi'
                          }
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] transition-all outline-none min-h-[120px] resize-none"
                        />
                        <p className="text-[12px] leading-5 text-[var(--text-tertiary)]">
                          Format each line as: event name | date | venue | city
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="input-label">Past Event Highlights (optional)</label>
                        <textarea
                          name="pastEventsText"
                          value={formData.pastEventsText}
                          onChange={handleInputChange}
                          placeholder={
                            'One event per line\nNeon Saturdays | Jan 20 2026 | Soho House | Mumbai\nWarehouse Takeover | Dec 28 2025 | AntiSocial | Pune'
                          }
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] transition-all outline-none min-h-[120px] resize-none"
                        />
                        <p className="text-[12px] leading-5 text-[var(--text-tertiary)]">
                          These appear on your partner profile until real event history is linked.
                        </p>
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
                      Setting up account…
                    </>
                  ) : (
                    <>
                      Continue to Verification <ChevronRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ── KYC: Identity Verification (Individual) ── */}
          {step === 'kyc_identity' && (
            <motion.div
              key="kyc_identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('kyc_identity') + 1).padStart(2, '0')}
                label="Identity Check"
                title="Verify Your Identity"
                description="Upload a government-issued ID and a selfie to confirm your identity."
              />
              {kycError && <ErrorBanner error={kycError} />}
              <KycIdentityForm
                uid={effectiveUid}
                requestId={submittedRequestId}
                requestId={submittedRequestId}
                initialData={{}}
                onSubmit={(data) => handleKycStep('kyc_identity', data)}
                submitting={false}
                submitLabel="Continue"
              />
            </motion.div>
          )}

          {/* ── KYC: Business Documents (Business) ── */}
          {step === 'kyc_business' && (
            <motion.div
              key="kyc_business"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('kyc_business') + 1).padStart(2, '0')}
                label="Business Documents"
                title="Business Documents"
                description="PAN, CIN/GST, and registration certificate for your business."
              />
              {kycError && <ErrorBanner error={kycError} />}
              <KycBusinessForm
                uid={effectiveUid}
                requestId={submittedRequestId}
                initialData={{
                  legalName: formData.name,
                  businessType: formData.businessType,
                  cin: formData.registrationNumber,
                }}
                onSubmit={(data) => handleKycStep('kyc_business', data)}
                submitting={false}
                submitLabel="Continue"
              />
            </motion.div>
          )}

          {/* ── KYC: Authorized Representative (Business) ── */}
          {step === 'kyc_signatory' && (
            <motion.div
              key="kyc_signatory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('kyc_signatory') + 1).padStart(2, '0')}
                label="Authorized Representative"
                title="Authorized Representative"
                description="Identity verification for the person representing the business."
              />
              {kycError && <ErrorBanner error={kycError} />}
              <KycSignatoryForm
                uid={effectiveUid}
                requestId={submittedRequestId}
                requestId={submittedRequestId}
                initialData={{}}
                onSubmit={(data) => handleKycStep('kyc_signatory', data)}
                submitting={false}
                submitLabel="Continue"
              />
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
              {approvalStatus === 'verified' ? (
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
                      {formData.name}
                    </span>{' '}
                    has been approved. Continue to your dashboard.
                  </p>
                  <button
                    onClick={() => routeAfterAuth(router)}
                    className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-[var(--accent-primary)] text-white font-semibold text-[14px] hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-primary)]/20"
                  >
                    Go to Dashboard <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
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
                      {formData.name}
                    </span>{' '}
                    are under review. We'll email you once approved.
                  </p>
                  <div className="p-6 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] mb-10 flex items-start gap-4 text-left">
                    <ShieldCheck className="h-6 w-6 text-[var(--accent-primary)] flex-shrink-0" />
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">
                        What Happens Next?
                      </p>
                      <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">
                        Our team reviews applications and documents within 24–48 hours. Once
                        approved, you'll receive an email to log in and access your full dashboard.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (authUser) await signOut();
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

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--surface-base)]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
            <p className="text-[14px] font-medium text-[var(--text-tertiary)]">Loading...</p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

// ── UI primitives ─────────────────────────────────────────────────────────────

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

function RoleCard({
  icon: Icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: any;
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
          <h3 className={`text-[16px] font-semibold mb-1 text-[var(--text-primary)]`}>{title}</h3>
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

function FormInput({ label, icon: Icon, ...props }: any) {
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

function FormSelect({ label, options, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <div className="relative">
        <select
          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-[14px] text-[var(--text-primary)] appearance-none cursor-pointer transition-all outline-none hover:border-[var(--border-default)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)]"
          {...props}
        >
          {options.map((opt: { value: string; label: string }) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)] rotate-90 pointer-events-none" />
      </div>
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

function OtpInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-[24px] font-bold tracking-[0.5em] text-center text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-all outline-none focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)]"
      />
    </div>
  );
}

function ActionButton({
  onClick,
  loading = false,
  loadingText = 'Processing...',
  children,
}: {
  onClick?: () => void;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type={onClick ? 'button' : 'submit'}
      onClick={onClick}
      disabled={loading}
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

function ResendButton({
  cooldown,
  onClick,
  loading,
}: {
  cooldown: number;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cooldown > 0 || loading}
      className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <RefreshCw className="h-4 w-4" />
      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
    </button>
  );
}

function ErrorBanner({ error, onLoginClick }: { error: string; onLoginClick?: () => void }) {
  if (!error) return null;
  const lines = error.split('\n').filter(Boolean);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-5 bg-[var(--state-error-bg)] border border-[var(--state-error)]/20 rounded-2xl"
    >
      <div className="flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-[var(--state-error)] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {lines.length === 1 ? (
            <p className="text-[14px] font-semibold text-[var(--state-error)]">{error}</p>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {lines.map((line, i) => (
                <li key={i} className="text-[14px] font-semibold text-[var(--state-error)]">
                  {line}
                </li>
              ))}
            </ul>
          )}
          {onLoginClick && error.includes('log in') && (
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

// ── KYC form utilities ────────────────────────────────────────────────────────

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
  /** The application to attach this document to; required when `docLabel` is set. */
  requestId: string | null;
  /**
   * Real backend document slot for this field — the onboarding document
   * model only has three: `id_front`/`id_back`/`selfie`. Omit for a field
   * with no real slot yet (e.g. the business registration certificate),
   * which falls back to a local-only, never-uploaded placeholder.
   */
  docLabel?: 'id_front' | 'id_back' | 'selfie';
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploadError('');
    if (!requestId) {
      setUploadError('Your application has not been created yet. Please go back and try again.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be under 5MB.');
      return;
    }

    if (!docLabel || !requestId) {
      // No real document slot for this field yet — kept local-only so the
      // step can still be filled out, but never durably uploaded anywhere.
      onChange(URL.createObjectURL(file));
      return;
    }

    const contentType = file.type;
    if (contentType !== 'image/jpeg' && contentType !== 'image/png' && contentType !== 'image/webp') {
      setUploadError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    setUploading(true);
    setProgress(10);
    try {
      const uploadUrlDto = await getUploadUrl(requestId, { label: docLabel, contentType });
      setProgress(40);

      await uploadToSignedUrl(uploadUrlDto.uploadUrl, uploadUrlDto.headers, file);
      setProgress(80);

      await addDocument(
        requestId,
        { label: docLabel, storagePath: uploadUrlDto.storagePath },
        crypto.randomUUID(),
      );
      setProgress(100);
      onChange(uploadUrlDto.storagePath);
    } catch (e: any) {
      console.error('Upload error:', e);
      setUploadError(e.message || 'Upload failed. Please try again.');
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
            onClick={() => onChange(null)}
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
          <div className="h-1 rounded-full bg-[var(--surface-tertiary)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
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
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

function KycInputField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[14px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:border-[var(--accent-primary)]/50 transition-all"
      />
    </div>
  );
}

function KycSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:border-[var(--accent-primary)]/50 transition-all appearance-none"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ── KYC Forms ─────────────────────────────────────────────────────────────────

function KycIdentityForm({
  uid,
  requestId,
  requestId,
  initialData,
  onSubmit,
  submitting,
  submitLabel = 'Continue',
}: {
  uid: string;
  requestId: string | null;
  requestId: string | null;
  initialData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  const [idType, setIdType] = useState((initialData['idType'] as string) || '');
  const [idNumber, setIdNumber] = useState((initialData['idNumber'] as string) || '');
  const [docFront, setDocFront] = useState<string | null>(
    (initialData['docFrontUrl'] as string) || null,
  );
  const [docBack, setDocBack] = useState<string | null>((initialData['docBackUrl'] as string) || null);
  const [selfie, setSelfie] = useState<string | null>((initialData['selfieUrl'] as string) || null);

  // New state for Aadhaar verification
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(!!initialData['isVerified']);
  const [verificationError, setVerificationError] = useState('');

  // The real backend requires exactly 3 documents (id_front, id_back, selfie)
  // to submit, unconditionally by ID type — REQUIRED_DOCUMENT_LABELS has no
  // per-type variant. A passport holder skipping "back" here would never be
  // able to clear missingDocuments server-side, so every ID type needs one.
  const needsBack = true;

  const handleVerifyAadhaar = async () => {
    if (!idNumber || idNumber.length !== 12) {
      setVerificationError('Aadhaar number must be 12 digits.');
      return;
    }
    setVerifying(true);
    setVerificationError('');
    try {
      // Format-check only, per D-018 — never rendered as government-verified.
      const result = await verifyDocument({ documentType: 'aadhaar', documentNumber: idNumber });
      if (!result.passed) {
        throw new Error(result.reason || 'Verification failed.');
      }
      setIsVerified(true);
    } catch (err: any) {
      setVerificationError(err.message || 'Verification failed.');
      setIsVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    setIsVerified(false);
    setVerificationError('');
  }, [idNumber, idType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idType || !idNumber || !docFront || !selfie) return;
    if (needsBack && !docBack) return;
    if (idType === 'aadhaar' && !isVerified) return;
    onSubmit({
      idType,
      idNumber,
      docFrontUrl: docFront,
      docBackUrl: docBack,
      selfieUrl: selfie,
      isVerified,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <KycSelectField
        label="ID Type"
        value={idType}
        onChange={setIdType}
        options={[
          { value: 'aadhaar', label: 'Aadhaar Card' },
          { value: 'passport', label: 'Passport' },
          { value: 'driving_licence', label: 'Driving Licence' },
          { value: 'voter_id', label: 'Voter ID' },
        ]}
      />

      <div className="space-y-2">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <KycInputField
              label="ID Number"
              value={idNumber}
              onChange={setIdNumber}
              placeholder="Enter your ID number"
            />
          </div>
          {idType === 'aadhaar' && (
            <button
              type="button"
              onClick={handleVerifyAadhaar}
              disabled={verifying || isVerified || idNumber.length !== 12}
              className={`h-12 px-6 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isVerified ? 'bg-emerald-500/20 text-emerald-500 cursor-default' : 'bg-[var(--accent-primary)] text-white hover:brightness-110 disabled:opacity-40'}`}
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isVerified ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : null}
              {verifying ? 'Verifying...' : isVerified ? 'Verified' : 'Verify ID'}
            </button>
          )}
        </div>
        {verificationError && (
          <p className="text-[11px] font-medium text-red-400 flex items-center gap-1.5 ml-1">
            <AlertCircle className="h-3.5 w-3.5" />
            {verificationError}
          </p>
        )}
        {isVerified && idType === 'aadhaar' && (
          <p className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5 ml-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Aadhaar structurally verified.
          </p>
        )}
      </div>

      <div className={`grid gap-4 ${needsBack ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        <KycFileZone
          label="Document Front"
          fieldName="doc_front"
          value={docFront}
          onChange={setDocFront}
          uid={uid}
          stepId="kyc_identity"
          requestId={requestId}
          docLabel="id_front"
        />
        {needsBack && (
          <KycFileZone
            label="Document Back"
            fieldName="doc_back"
            value={docBack}
            onChange={setDocBack}
            uid={uid}
            stepId="kyc_identity"
            requestId={requestId}
            docLabel="id_back"
          />
        )}
      </div>
      <KycFileZone
        label="Selfie Photo"
        fieldName="selfie"
        value={selfie}
        onChange={setSelfie}
        uid={uid}
        stepId="kyc_identity"
        requestId={requestId}
        docLabel="selfie"
      />
      <button
        type="submit"
        disabled={
          submitting ||
          !idType ||
          !idNumber ||
          !docFront ||
          !selfie ||
          (needsBack && !docBack) ||
          (idType === 'aadhaar' && !isVerified)
        }
        className="w-full h-12 rounded-xl bg-[var(--accent-primary)] text-white font-black uppercase tracking-widest text-[11px] hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function KycBusinessForm({
  uid,
  requestId,
  initialData,
  onSubmit,
  submitting,
  submitLabel = 'Continue',
}: {
  uid: string;
  requestId: string | null;
  initialData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  const legalName = (initialData['legalName'] as string) || '';
  const businessType = (initialData['businessType'] as string) || '';
  const cin = (initialData['cin'] as string) || '';

  const [pan, setPan] = useState((initialData['pan'] as string) || '');
  const [gst, setGst] = useState((initialData['gst'] as string) || '');
  const [address, setAddress] = useState((initialData['address'] as string) || '');
  const [regDoc, setRegDoc] = useState<string | null>((initialData['regDocUrl'] as string) || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pan || !address || !regDoc) return;
    onSubmit({ legalName, businessType, pan, cin, gst, address, regDocUrl: regDoc });
  };

  const BUSINESS_TYPE_LABELS: Record<string, string> = {
    pvt_ltd: 'Private Limited',
    llp: 'LLP',
    partnership: 'Partnership Firm',
    sole_prop: 'Sole Proprietorship',
    trust: 'Trust / Society',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
          Confirmed from your details
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--text-tertiary)]">Business Name</span>
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            {legalName || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[var(--text-tertiary)]">Business Type</span>
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            {BUSINESS_TYPE_LABELS[businessType] || businessType || '—'}
          </span>
        </div>
        {cin && (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-tertiary)]">CIN / Reg. No.</span>
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{cin}</span>
          </div>
        )}
      </div>
      <KycInputField label="Business PAN" value={pan} onChange={setPan} placeholder="AAACB1234C" />
      <KycInputField
        label="GST Number (optional)"
        value={gst}
        onChange={setGst}
        placeholder="27AAACB1234C1Z5"
      />
      <KycInputField
        label="Registered Address"
        value={address}
        onChange={setAddress}
        placeholder="Full address as on documents"
      />
      <KycFileZone
        label="Registration Certificate"
        fieldName="reg_doc"
        value={regDoc}
        onChange={setRegDoc}
        uid={uid}
        stepId="kyc_business"
        // No real document slot exists yet for a business registration
        // certificate — local-only placeholder (see KycFileZone's docLabel doc).
        requestId={null}
      />
      <button
        type="submit"
        disabled={submitting || !pan || !address || !regDoc}
        className="w-full h-12 rounded-xl bg-[var(--accent-primary)] text-white font-black uppercase tracking-widest text-[11px] hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}

function KycSignatoryForm({
  uid,
  requestId,
  requestId,
  initialData,
  onSubmit,
  submitting,
  submitLabel = 'Continue',
}: {
  uid: string;
  requestId: string | null;
  requestId: string | null;
  initialData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  const [fullName, setFullName] = useState((initialData['fullName'] as string) || '');
  const [designation, setDesignation] = useState((initialData['designation'] as string) || '');
  const [email, setEmail] = useState((initialData['email'] as string) || '');
  const [phone, setPhone] = useState((initialData['phone'] as string) || '');
  const [idType, setIdType] = useState((initialData['idType'] as string) || '');
  const [idNumber, setIdNumber] = useState((initialData['idNumber'] as string) || '');
  const [docFront, setDocFront] = useState<string | null>(
    (initialData['docFrontUrl'] as string) || null,
  );
  const [docBack, setDocBack] = useState<string | null>((initialData['docBackUrl'] as string) || null);
  const [selfie, setSelfie] = useState<string | null>((initialData['selfieUrl'] as string) || null);
  const [declared, setDeclared] = useState(false);
  // The real backend requires exactly 3 documents (id_front, id_back, selfie)
  // to submit, unconditionally by ID type — REQUIRED_DOCUMENT_LABELS has no
  // per-type variant. A passport holder skipping "back" here would never be
  // able to clear missingDocuments server-side, so every ID type needs one.
  const needsBack = true;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !fullName ||
      !designation ||
      !email ||
      !idType ||
      !idNumber ||
      !docFront ||
      !selfie ||
      !declared
    )
      return;
    if (needsBack && !docBack) return;
    onSubmit({
      fullName,
      designation,
      email,
      phone,
      idType,
      idNumber,
      docFrontUrl: docFront,
      docBackUrl: docBack,
      selfieUrl: selfie,
      declared,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
        <p className="text-[12px] text-[var(--text-tertiary)] leading-relaxed">
          Provide identity details for the person who is authorized to represent this business on
          C1RCLE.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <KycInputField
          label="Full Legal Name"
          value={fullName}
          onChange={setFullName}
          placeholder="As on government ID"
        />
        <KycSelectField
          label="Designation"
          value={designation}
          onChange={setDesignation}
          options={[
            { value: 'director', label: 'Director' },
            { value: 'partner', label: 'Partner' },
            { value: 'proprietor', label: 'Proprietor' },
            { value: 'authorized_signatory', label: 'Authorized Signatory' },
          ]}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <KycInputField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          placeholder="representative@company.com"
        />
        <KycInputField
          label="Phone"
          value={phone}
          onChange={setPhone}
          placeholder="+91 9876543210"
        />
      </div>
      <KycSelectField
        label="ID Type"
        value={idType}
        onChange={setIdType}
        options={[
          { value: 'aadhaar', label: 'Aadhaar Card' },
          { value: 'passport', label: 'Passport' },
          { value: 'driving_licence', label: 'Driving Licence' },
          { value: 'voter_id', label: 'Voter ID' },
        ]}
      />
      <KycInputField
        label="ID Number"
        value={idNumber}
        onChange={setIdNumber}
        placeholder="Enter ID number"
      />
      <div className={`grid gap-4 ${needsBack ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        <KycFileZone
          label="Document Front"
          fieldName="sig_doc_front"
          value={docFront}
          onChange={setDocFront}
          uid={uid}
          stepId="kyc_signatory"
          requestId={requestId}
          docLabel="id_front"
        />
        {needsBack && (
          <KycFileZone
            label="Document Back"
            fieldName="sig_doc_back"
            value={docBack}
            onChange={setDocBack}
            uid={uid}
            stepId="kyc_signatory"
            requestId={requestId}
            docLabel="id_back"
          />
        )}
      </div>
      <KycFileZone
        label="Selfie Photo"
        fieldName="sig_selfie"
        value={selfie}
        onChange={setSelfie}
        uid={uid}
        stepId="kyc_signatory"
        requestId={requestId}
        docLabel="selfie"
      />
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={declared}
          onChange={(e) => setDeclared(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[var(--border-subtle)] accent-[var(--accent-primary)]"
        />
        <span className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
          I confirm that I am authorized to represent this business and the information provided is
          accurate.
        </span>
      </label>
      <button
        type="submit"
        disabled={
          submitting ||
          !fullName ||
          !designation ||
          !email ||
          !idType ||
          !idNumber ||
          !docFront ||
          !selfie ||
          !declared ||
          (needsBack && !docBack)
        }
        className="w-full h-12 rounded-xl bg-[var(--accent-primary)] text-white font-black uppercase tracking-widest text-[11px] hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
