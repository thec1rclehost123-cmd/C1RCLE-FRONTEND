'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  AtSign,
  Building,
  Building2,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
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
  type ReactNode,
  type InputHTMLAttributes,
} from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { getClientEnv } from '@c1rcle/config';

import { useDashboardAuth } from '@/components/providers/DashboardAuthProvider';
import { confirmPhoneOtp, getTestingBypassEnabled, sendPhoneOtp } from '@/lib/firebase/phone-auth';
import { resolveKnownCity, searchCities, type CityEntry } from '@/lib/onboarding/cities';
import {
  getMine,
  saveProgress as saveOnboardingProgress,
  start as startOnboarding,
  submit as submitOnboardingApplication,
  uploadDocument,
  verifyDocument,
} from '@/lib/onboarding/onboarding-repository';
import { sendOtp, verifyOtp } from '@/lib/onboarding/otp';
import {
  CONTRACT_LIMITS,
  ID_NUMBER_ERRORS,
  KYC_ID_TYPES,
  checkArea,
  checkBio,
  checkCapacity,
  checkCity,
  checkEntityName,
  checkGSTIN,
  checkIdNumber,
  checkInstagramHandle,
  checkPAN,
  checkPersonName,
  checkPhone,
  checkRegisteredAddress,
  checkRegistrationNumber,
  checkWebsite,
  isKycIdType,
  isValidEmail,
  normalizeAadhaar,
  normalizeInstagramHandle,
  parseCapacity,
  sanitizeIdentifier,
  sanitizeMultiline,
  sanitizePhoneInput,
  sanitizeText,
  type KycIdType,
} from '@/lib/onboarding/validation';
import { routeAfterAuth } from '@/lib/org/route-after-auth';

import type { OnboardingDocumentLabel, OnboardingProfileDto } from '@c1rcle/contracts';
import type { User as SessionUser } from '@c1rcle/types';
import type { ConfirmationResult } from 'firebase/auth';

type OnboardingPlan = 'basic' | 'silver' | 'diamond';

const PHONE_RECAPTCHA_CONTAINER_ID = 'phone-verify-recaptcha';

/** v1's rule, ported: a bare 10-digit number is assumed Indian (+91-prefixed). */
function toE164(phone: string): string {
  const digitsOnly = phone.replace(/[^\d+]/g, '');
  if (digitsOnly.startsWith('+')) return digitsOnly;
  if (/^\d{10}$/.test(digitsOnly)) return `+91${digitsOnly}`;
  return `+${digitsOnly}`;
}

/** A thrown value's message, or `fallback` when it has none. */
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

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
  role: 'Role',
  signup: 'Sign Up',
  email_verify: 'Email',
  phone_verify: 'Phone',
  entity_type: 'Entity',
  details: 'Details',
  kyc_identity: 'Identity',
  kyc_business: 'Business',
  kyc_signatory: 'Signatory',
  success: 'Done',
};

/** Only one plan is offered today, so it isn't shown — it's sent to the backend as-is. */
const DEFAULT_PLAN: OnboardingPlan = 'basic';

const BUSINESS_TYPES = [
  { value: 'pvt_ltd', label: 'Private Limited' },
  { value: 'llp', label: 'LLP' },
  { value: 'partnership', label: 'Partnership Firm' },
  { value: 'sole_prop', label: 'Sole Proprietorship' },
  { value: 'trust', label: 'Trust / Society' },
] as const;

/** The closed set `businessType` may hold — `profilePayload` sends it verbatim. */
const BUSINESS_TYPE_VALUES: readonly string[] = BUSINESS_TYPES.map((type) => type.value);

// ── Main component ────────────────────────────────────────────────────────────
export function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const {
    user: rawAuthUser,
    signIn: authSignIn,
    signUp: authSignUp,
    signOut,
    loading: authLoading,
    isApproved,
  } = useDashboardAuth();
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  // `DashboardAuthProvider` types `user` as `any`; it is the @c1rcle/auth session user.
  const authUser = rawAuthUser as SessionUser | null;

  const clientEnv = getClientEnv();
  const testingBypass = getTestingBypassEnabled();
  const testPhone = testingBypass ? (clientEnv.NEXT_PUBLIC_FIREBASE_TEST_PHONE ?? '') : '';

  const [step, setStep] = useState<OnboardingStep>('role');
  const [partnerType, setPartnerType] = useState<PartnerType>(
    (searchParams.get('type') as PartnerType | null) ?? 'venue',
  );
  const [entityType, setEntityType] = useState<EntityType>('individual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Success screen status — driven by the real application status from getMine(),
  // never assumed from wizard state.
  const [approvalStatus, setApprovalStatus] = useState<
    'pending' | 'approved' | 'changes_requested' | 'rejected'
  >('pending');
  const [reviewNote] = useState('');
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);

  // KYC step state — documents are uploaded/confirmed server-side as each
  // KycFileZone completes; kycStepData is local UI bookkeeping only now.
  const [, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState('');

  // Existing user detection state
  const [emailExists, setEmailExists] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');

  // OTP state — provider-agnostic; only verification.js changes per provider
  const [otpEmail, setOtpEmail] = useState(searchParams.get('email') ?? '');
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

  // Form data — all existing fields preserved exactly
  const [formData, setFormData] = useState<{
    email: string;
    password: string;
    name: string;
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
    email: '',
    password: '',
    name: '',
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
  const [hostCategory, setHostCategory] = useState('organizer');
  const [upcomingEventsText, setUpcomingEventsText] = useState('');
  const [pastEventsText, setPastEventsText] = useState('');

  /**
   * Every profile field the gateway will receive, checked locally so the
   * applicant finds out in the field rather than from a round-trip 422. Errors
   * are keyed by the *profile* names (legalName, capacity, …) so they land on
   * the right control and survive the server's own `fieldErrors`.
   */
  const validateProfile = useCallback(() => {
    const errors: Record<string, string> = {};
    const isBusiness = entityType === 'business';

    const nameError = isBusiness
      ? checkEntityName(formData.name, 'organisation')
      : checkEntityName(formData.name, 'person');
    if (nameError) errors['legalName'] = nameError;

    const contactError = checkPersonName(formData.contactPerson, 'Contact person');
    if (contactError) errors['contactPerson'] = contactError;

    const phoneError = checkPhone(formData.phone);
    if (phoneError) errors['phone'] = phoneError;

    const cityError = checkCity(formData.city);
    if (cityError) errors['city'] = cityError;

    const areaError = checkArea(formData.area);
    if (areaError) errors['area'] = areaError;

    const websiteResult = checkWebsite(formData.website);
    if (!websiteResult.ok) errors['website'] = websiteResult.error;

    const capacityError = checkCapacity(formData.capacity);
    if (capacityError) errors['capacity'] = capacityError;

    if (isBusiness) {
      if (formData.businessType && !BUSINESS_TYPE_VALUES.includes(formData.businessType)) {
        errors['businessType'] = 'Choose a business type from the list.';
      }
      const regError = checkRegistrationNumber(formData.registrationNumber);
      if (regError) errors['registrationNumber'] = regError;
    }

    const instagramError = checkInstagramHandle(formData.instagram);
    if (instagramError) errors['instagram'] = instagramError;

    const bioError = checkBio(formData.bio);
    if (bioError) errors['bio'] = bioError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, entityType]);

  /**
   * The exact profile body sent to the gateway — sanitized and normalized
   * identically by `start` and by every autosave, so a resumed draft and a
   * fresh submit can never disagree about what was stored.
   */
  const profilePayload = useCallback((): OnboardingProfileDto => {
    const website = checkWebsite(formData.website);
    const capacity = parseCapacity(formData.capacity);
    return {
      legalName: sanitizeText(formData.name, CONTRACT_LIMITS.MAX_LEGAL_NAME),
      contactPerson: sanitizeText(formData.contactPerson, CONTRACT_LIMITS.MAX_NAME),
      phone: toE164(sanitizePhoneInput(formData.phone || otpPhone)),
      city:
        resolveKnownCity(formData.city) ?? sanitizeText(formData.city, CONTRACT_LIMITS.MAX_CITY),
      area: sanitizeText(formData.area, CONTRACT_LIMITS.MAX_AREA) || undefined,
      website: website.ok && website.value ? website.value : undefined,
      capacity: capacity ?? undefined,
      instagram:
        normalizeInstagramHandle(formData.instagram).slice(0, CONTRACT_LIMITS.MAX_INSTAGRAM) ||
        undefined,
      bio: sanitizeMultiline(formData.bio, CONTRACT_LIMITS.MAX_BIO) || undefined,
      businessType: sanitizeText(formData.businessType, 120) || undefined,
      registrationNumber:
        sanitizeIdentifier(formData.registrationNumber, CONTRACT_LIMITS.MAX_REGISTRATION_NUMBER) ||
        undefined,
      entityType,
    };
  }, [entityType, formData, otpPhone]);

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
      try {
        await saveOnboardingProgress(submittedRequestId, profilePayload());
      } catch {
        /* silent — non-critical, matches the prior best-effort autosave */
      }
    },
    [submittedRequestId, profilePayload],
  );

  // Dynamic sequence depends on entity type chosen at step 4
  const stepSequence = getStepSequence(entityType);

  const initialised = useRef(false);

  // Pre-fill from URL params (existing behaviour kept)
  useEffect(() => {
    const type = searchParams.get('type') as PartnerType;
    const email = searchParams.get('email');
    const hostId = searchParams.get('hostId');
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, react-hooks/set-state-in-effect
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
        if (isApproved) {
          void routeAfterAuth(router);
          return;
        }
        try {
          const application = await getMine();
          if (application) {
            setSubmittedRequestId(application.id);

            if (application.status !== 'draft') {
              // submitted / changes_requested / approved / rejected — the
              // success screen renders the real status, no further wizard
              // steps to resume into.
              setApprovalStatus(
                application.status === 'submitted' ? 'pending' : application.status,
              );
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

            setFormData((prev) => ({
              ...prev,
              email: authUser.email,
              name: p.legalName,
              contactPerson: p.contactPerson,
              phone: p.phone,
              city: p.city,
              area: p.area ?? prev.area,
              website: p.website ?? prev.website,
              capacity: p.capacity != null ? String(p.capacity) : prev.capacity,
              instagram: p.instagram ?? prev.instagram,
              bio: p.bio ?? prev.bio,
              businessType: p.businessType ?? prev.businessType,
              registrationNumber: p.registrationNumber ?? prev.registrationNumber,
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
          setFormData((prev) => ({ ...prev, email: authUser.email }));
          setOtpEmail(authUser.email);
          initialised.current = true;
          setStep('phone_verify');
          return;
        } catch {
          /* fall through — restart the wizard from `role` */
        }
      }
      setStep('role');
    };

    void checkInitialState();
  }, [authLoading, authUser, signOut, isApproved, router]);

  // Approval polling — real application status via getMine()
  useEffect(() => {
    if (step !== 'success' || !submittedRequestId) return;
    const checkApproval = async () => {
      try {
        const application = await getMine();
        if (!application) return;
        setApprovalStatus(
          application.status === 'submitted' || application.status === 'draft'
            ? 'pending'
            : application.status,
        );
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Details-step profile fields — the UI speaks the server's profile-vocabulary
  // (legalName, businessType, …), backed by the form-state fields below.
  const PROFILE_KEY_MAP: Record<string, keyof typeof formData> = {
    legalName: 'name',
    businessType: 'businessType',
    registrationNumber: 'registrationNumber',
    contactPerson: 'contactPerson',
    city: 'city',
    area: 'area',
    website: 'website',
    capacity: 'capacity',
    instagram: 'instagram',
    bio: 'bio',
  };

  const fieldValue = (key: string): string => {
    const mapped = PROFILE_KEY_MAP[key];
    if (!mapped) return '';
    return String(formData[mapped] ?? '');
  };

  const handleProfileChange = (key: string, value: string | number | null) => {
    const mapped = PROFILE_KEY_MAP[key];
    if (!mapped) return;
    setFormData((prev) => ({ ...prev, [mapped]: value }));
    // Editing a field clears its error — but keeps an error the *server*
    // reported on a field this wizard never renders, so nothing is silently
    // swallowed.
    setFieldErrors((prev) => (prev[key] === undefined ? prev : { ...prev, [key]: '' }));
  };

  /** Digits only, no cap — `checkCapacity` bounds the value, not the keystrokes. */
  const sanitizeDigits = (raw: string): string => raw.replace(/\D/gu, '');

  function startCooldown(
    setter: React.Dispatch<React.SetStateAction<number>>,
    ref: React.RefObject<ReturnType<typeof setInterval> | null>,
  ) {
    setter(15);
    ref.current = setInterval(() => {
      setter((prev) => {
        if (prev <= 1) {
          clearInterval(ref.current ?? undefined);
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

  // ── Step 2 (sign-in path): resume a returning applicant ────────────────────
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
        setApprovalStatus(application.status === 'submitted' ? 'pending' : application.status);
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
          name: p.legalName,
          contactPerson: p.contactPerson,
          phone: p.phone,
          city: p.city,
          area: p.area ?? prev.area,
          website: p.website ?? prev.website,
          capacity: p.capacity != null ? String(p.capacity) : prev.capacity,
          instagram: p.instagram ?? prev.instagram,
          bio: p.bio ?? prev.bio,
          businessType: p.businessType ?? prev.businessType,
          registrationNumber: p.registrationNumber ?? prev.registrationNumber,
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
    } catch (err) {
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
    } catch (err) {
      setError(errorMessage(err, 'Could not send the code. Please try again.'));
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
    } catch (err) {
      setError(errorMessage(err, 'Invalid or expired code.'));
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
    } catch (err) {
      setError(errorMessage(err, 'Could not send the SMS code. Please try again.'));
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
        throw new Error(result.reason ?? 'Phone verification failed.');
      }
      setStep('entity_type');
    } catch (err) {
      setError(errorMessage(err, 'Invalid or expired code.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 5: Open the application, advance to KYC ──
  // The account itself was already created back at the email_verify step
  // (the real OTP send route requires an existing session) and the phone
  // was already format-validated there too, so this step only opens the
  // onboarding application against the now-established session.
  const handleCreateAccount = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!validateProfile()) return;
    setLoading(true);
    try {
      if (!authUser) {
        setError('Your session expired. Please verify your email again to continue.');
        setStep('email_verify');
        setLoading(false);
        return;
      }
      // Open the application now that we have a real session — this is the
      // one call that persists the full profile server-side; the request id
      // it returns backs every subsequent saveProgress/upload/submit call.
      const application = await startOnboarding(
        {
          requestedType: partnerType,
          plan: DEFAULT_PLAN,
          profile: profilePayload(),
        },
        crypto.randomUUID(),
      );
      setSubmittedRequestId(application.id);
      setFieldErrors({});

      // Advance to the first KYC step in the sequence
      const seq = getStepSequence(entityType);
      const detailsIdx = seq.indexOf('details');
      const nextStep = seq[detailsIdx + 1];
      if (nextStep) {
        setStep(nextStep);
      }
    } catch (err) {
      if (isApiClientError(err) && err.status === 409) {
        setError('You already have an application in progress.');
      } else {
        setError(errorMessage(err, 'Failed to create account. Please try again.'));
        if (isApiClientError(err) && err.fieldErrors) {
          setFieldErrors(
            Object.fromEntries(Object.entries(err.fieldErrors).map(([k, v]) => [k, v.join(' ')])),
          );
        }
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
      } catch (err) {
        if (isApiClientError(err) && err.status === 400) {
          setKycError(
            err.fieldErrors
              ? Object.values(err.fieldErrors).flat().join(' ')
              : 'Please upload all required documents before submitting.',
          );
        } else {
          setKycError(errorMessage(err, 'Failed to submit. Please try again.'));
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
        void submitApplication(stepId, _data);
      } else {
        if (idx !== -1 && idx < stepSequence.length - 1) {
          const next = stepSequence[idx + 1];
          if (next) {
            setStep(next);
            void saveProgress(next);
          }
        }
      }
    },
    [stepSequence, submitApplication, saveProgress],
  );

  const currentStepIndex = stepSequence.indexOf(step);
  const requestedType = partnerType;

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      <header className="sticky top-0 z-50 bg-[var(--surface-base)]/80 backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              if (currentStepIndex === 0) {
                router.replace('/login');
              } else {
                const prevStep = stepSequence[currentStepIndex - 1];
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
            {stepSequence
              .filter((s) => s !== 'success')
              .map((s, i) => {
                const isDone = currentStepIndex > stepSequence.indexOf(s);
                const isCurrent = step === s;
                const filteredSteps = stepSequence.filter((x) => x !== 'success');
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setOtpEmail(e.target.value);
                  }}
                  placeholder="you@company.com"
                />
                <div className="relative">
                  <FormInput
                    label="Password"
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    value={emailExists ? loginPassword : formData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setOtpEmail(e.target.value);
                  }}
                  placeholder="you@company.com"
                  disabled={otpEmailSent}
                />
                {!otpEmailSent ? (
                  <ActionButton
                    onClick={() => {
                      void handleSendEmailOtp();
                    }}
                    loading={loading}
                  >
                    Send Code <ChevronRight className="h-5 w-5" />
                  </ActionButton>
                ) : (
                  <>
                    <OtpInput
                      label="Enter the 6-digit code sent to your email"
                      value={otpEmailCode}
                      onChange={setOtpEmailCode}
                    />
                    <ActionButton
                      onClick={() => {
                        void handleVerifyEmailOtp();
                      }}
                      loading={loading}
                    >
                      Verify Email <ChevronRight className="h-5 w-5" />
                    </ActionButton>
                    <ResendButton
                      cooldown={emailCooldown}
                      onClick={() => {
                        void handleSendEmailOtp();
                      }}
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
                label="Verify Phone"
                title="Confirm Your Number"
                description="We'll send an SMS code to confirm your mobile number. This becomes your verified contact on the platform."
              />
              <ErrorBanner error={error} />
              {testingBypass && (
                <div className="mb-6 p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0" />
                  <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">
                    Testing mode: SMS and reCAPTCHA are skipped. Enter the test number configured in
                    the Firebase Console (Authentication → Phone → Test phone numbers)
                    {testPhone ? ' — pre-filled below.' : ', e.g. +1 555 555 0100.'} Use the exact
                    code configured for that number in the console (not an arbitrary one).
                  </p>
                </div>
              )}
              {/* Invisible reCAPTCHA anchor for Firebase's signInWithPhoneNumber — renders nothing visible. */}
              <div id={PHONE_RECAPTCHA_CONTAINER_ID} />
              <div className="space-y-5">
                <FormField
                  label="Mobile Number (with country code)"
                  icon={Phone}
                  type="tel"
                  value={otpPhone}
                  onChange={(v) => {
                    let sanitized = v.replace(/[^0-9+\s]/g, '');
                    if (sanitized.indexOf('+') > 0) {
                      const firstChar = sanitized[0] ?? '';
                      sanitized = firstChar + sanitized.slice(1).replace(/\+/g, '');
                    }
                    setOtpPhone(sanitized);
                  }}
                  placeholder="+91 98765 43210"
                  disabled={otpPhoneSent}
                />
                {!otpPhoneSent ? (
                  <ActionButton
                    onClick={() => {
                      void handleSendPhoneOtp();
                    }}
                    loading={loading}
                  >
                    Send SMS Code <ChevronRight className="h-5 w-5" />
                  </ActionButton>
                ) : (
                  <>
                    <OtpInput
                      label="Enter the 6-digit SMS code"
                      value={otpPhoneCode}
                      onChange={setOtpPhoneCode}
                    />
                    <ActionButton
                      onClick={() => {
                        void handleVerifyPhoneOtp();
                      }}
                      loading={loading}
                    >
                      Verify Phone <ChevronRight className="h-5 w-5" />
                    </ActionButton>
                    <ResendButton
                      cooldown={phoneCooldown}
                      onClick={() => {
                        void handleSendPhoneOtp();
                      }}
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

          {step === 'entity_type' && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepHeader
                step={String(stepSequence.indexOf('entity_type') + 1).padStart(2, '0')}
                label="Entity Type"
                title="Individual or Business?"
                description="This determines which fields you'll complete in your profile."
              />
              <div className="grid grid-cols-1 gap-4 mb-10">
                <RoleCard
                  icon={User}
                  title="Individual"
                  description="Freelancer, independent promoter, solo DJ, or individual host."
                  active={entityType === 'individual'}
                  onClick={() => {
                    setEntityType('individual');
                  }}
                />
                <RoleCard
                  icon={Building}
                  title="Business"
                  description="Registered company, club, LLP, partnership firm, or trust."
                  active={entityType === 'business'}
                  onClick={() => {
                    setEntityType('business');
                  }}
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
                  setStep('signup');
                }}
              >
                Continue <ChevronRight className="h-5 w-5" />
              </ActionButton>
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
                step="05"
                label="Your Details"
                title={
                  requestedType === 'venue'
                    ? 'Venue Registration'
                    : requestedType === 'host'
                      ? 'Host Profile'
                      : 'Promoter Enrollment'
                }
                description="Tell us about your business. You'll upload verification documents in the next steps."
              />

              <ErrorBanner
                error={error}
                onLoginClick={() => {
                  router.push('/login');
                }}
              />

              {/* Credentials — the account was already created back at the
                  email_verify step, so this is just a confirmation banner. */}
              {authUser && (
                <div className="p-5 rounded-2xl bg-[var(--state-success-bg)] border border-[var(--state-success)]/20 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-[var(--state-success)] flex items-center justify-center font-bold text-white text-lg">
                      {authUser.email[0]?.toUpperCase()}
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
                  void handleCreateAccount(e);
                }}
                className="space-y-8"
              >
                {/* Profile */}
                <div className="space-y-5">
                  <SectionTitle title={partnerType === 'promoter' ? 'Your Profile' : ''} />

                  {entityType === 'business' ? (
                    <>
                      <FormField
                        label="Legal Business Name"
                        icon={Building}
                        value={fieldValue('legalName')}
                        error={fieldErrors['legalName']}
                        onChange={(v) => {
                          handleProfileChange(
                            'legalName',
                            sanitizeText(v, CONTRACT_LIMITS.MAX_LEGAL_NAME),
                          );
                        }}
                        placeholder="e.g. Eclipse Nightlife Pvt. Ltd."
                      />
                      <FormSelect
                        label="Business Type"
                        value={fieldValue('businessType')}
                        error={fieldErrors['businessType']}
                        onChange={(v) => {
                          handleProfileChange('businessType', v);
                        }}
                        options={[{ value: '', label: 'Select business type' }, ...BUSINESS_TYPES]}
                      />
                      <FormField
                        label="CIN / GSTIN / PAN (optional)"
                        icon={Briefcase}
                        value={fieldValue('registrationNumber')}
                        error={fieldErrors['registrationNumber']}
                        onChange={(v) => {
                          handleProfileChange(
                            'registrationNumber',
                            sanitizeIdentifier(v, CONTRACT_LIMITS.MAX_REGISTRATION_NUMBER),
                          );
                        }}
                        placeholder="e.g. L17110MH1980PLC014121"
                      />
                    </>
                  ) : (
                    <FormField
                      label={
                        requestedType === 'venue'
                          ? 'Venue Name'
                          : requestedType === 'host'
                            ? 'Brand / Collective Name'
                            : 'Your Full Name'
                      }
                      icon={requestedType === 'venue' ? Building2 : User}
                      value={fieldValue('legalName')}
                      error={fieldErrors['legalName']}
                      onChange={(v) => {
                        handleProfileChange(
                          'legalName',
                          sanitizeText(v, CONTRACT_LIMITS.MAX_LEGAL_NAME),
                        );
                      }}
                      placeholder={
                        requestedType === 'venue'
                          ? 'e.g. Club Eclipse'
                          : requestedType === 'host'
                            ? 'e.g. Midnight Collective'
                            : 'Your name'
                      }
                    />
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label={entityType === 'business' ? 'Authorized Contact' : 'Contact Person'}
                      icon={Briefcase}
                      value={fieldValue('contactPerson')}
                      error={fieldErrors['contactPerson']}
                      onChange={(v) => {
                        handleProfileChange(
                          'contactPerson',
                          sanitizeText(v, CONTRACT_LIMITS.MAX_NAME),
                        );
                      }}
                      placeholder="Primary contact"
                    />
                    {/* Phone is verified in a later step (after account
                        creation, since /api/auth/phone-verification requires
                        a session) — collected here as plain text instead.
                        Kept as a raw `FormInput` because the details step is
                        the one place a number may still carry the spaces and
                        `+` an applicant types naturally; `profilePayload`
                        normalizes it to E.164 on the way out. */}
                    <FormInput
                      label="Phone Number"
                      icon={Phone}
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={fieldErrors['phone']}
                      required
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <CityPicker
                      value={fieldValue('city')}
                      error={fieldErrors['city']}
                      onChange={(v) => {
                        handleProfileChange('city', v);
                      }}
                    />
                    <FormField
                      label="Area / Locality"
                      value={fieldValue('area')}
                      error={fieldErrors['area']}
                      onChange={(v) => {
                        handleProfileChange('area', sanitizeText(v, CONTRACT_LIMITS.MAX_AREA));
                      }}
                      placeholder="e.g. Bandra"
                    />
                  </div>

                  <FormField
                    label="Website (optional)"
                    icon={Globe}
                    value={fieldValue('website')}
                    error={fieldErrors['website']}
                    onChange={(v) => {
                      handleProfileChange('website', sanitizeText(v, CONTRACT_LIMITS.MAX_WEBSITE));
                    }}
                    placeholder="yourbrand.com"
                  />

                  {requestedType === 'venue' && (
                    <FormField
                      label="Approximate Capacity"
                      icon={Users}
                      value={fieldValue('capacity')}
                      error={fieldErrors['capacity']}
                      inputMode="numeric"
                      onChange={(v) => {
                        // Digits only, so the value can never be a decimal and
                        // `parseCapacity` always round-trips what is displayed.
                        handleProfileChange('capacity', sanitizeDigits(v));
                      }}
                      placeholder="e.g. 500"
                    />
                  )}

                  {requestedType === 'host' && (
                    <FormSelect
                      label="Host Category"
                      value={hostCategory}
                      onChange={setHostCategory}
                      options={[
                        { value: 'organizer', label: 'Event Organizer' },
                        { value: 'dj', label: 'Individual DJ / Artist' },
                        { value: 'collective', label: 'Collective / Label' },
                      ]}
                    />
                  )}

                  {requestedType === 'promoter' && (
                    <>
                      <FormField
                        label="Instagram Handle"
                        icon={AtSign}
                        value={fieldValue('instagram')}
                        error={fieldErrors['instagram']}
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
                          value={fieldValue('bio')}
                          onChange={(e) => {
                            handleProfileChange(
                              'bio',
                              sanitizeMultiline(e.target.value, CONTRACT_LIMITS.MAX_BIO),
                            );
                          }}
                          placeholder="Tell us about your reach, experience, and what you're looking for..."
                          className={`w-full bg-[var(--surface-secondary)] border rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] transition-all outline-none min-h-[120px] resize-none ${fieldErrors['bio'] ? 'border-[var(--state-error)]' : 'border-[var(--border-subtle)]'}`}
                        />
                        {fieldErrors['bio'] && (
                          <p className="text-xs text-[var(--state-error)]">{fieldErrors['bio']}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="input-label" htmlFor="promoter-upcoming">
                          Upcoming Events (optional)
                        </label>
                        <textarea
                          id="promoter-upcoming"
                          value={upcomingEventsText}
                          onChange={(e) => {
                            setUpcomingEventsText(e.target.value);
                          }}
                          placeholder={
                            'One event per line\nSummer Fridays | Jun 14 2026 | Toy Room | Mumbai\nCampus Heatwave | Jul 05 2026 | Kitty Su | Delhi'
                          }
                          className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] transition-all outline-none min-h-[120px] resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="input-label" htmlFor="promoter-past">
                          Past Event Highlights (optional)
                        </label>
                        <textarea
                          id="promoter-past"
                          value={pastEventsText}
                          onChange={(e) => {
                            setPastEventsText(e.target.value);
                          }}
                          placeholder={
                            'One event per line\nNeon Saturdays | Jan 20 2026 | Soho House | Mumbai\nWarehouse Takeover | Dec 28 2025 | AntiSocial | Pune'
                          }
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
                label="Verification Documents"
                title="Verify Your Identity"
                description="Upload a government-issued ID (front and back) and a selfie. Images only — JPG, PNG or WEBP, up to 5 MB each."
              />
              {kycError && <ErrorBanner error={kycError} />}
              <KycIdentityForm
                requestId={submittedRequestId}
                initialData={{}}
                onSubmit={(data) => {
                  handleKycStep('kyc_identity', data);
                }}
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
                requestId={submittedRequestId}
                initialData={{
                  legalName: formData.name,
                  businessType: formData.businessType,
                  cin: formData.registrationNumber,
                }}
                onSubmit={(data) => {
                  handleKycStep('kyc_business', data);
                }}
                submitting={false}
                submitLabel="Continue"
              />
            </motion.div>
          )}

          {/* ── Step 5: Review + Submit (authed) ── */}
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
                requestId={submittedRequestId}
                initialData={{}}
                onSubmit={(data) => {
                  handleKycStep('kyc_signatory', data);
                }}
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
                      {formData.name}
                    </span>{' '}
                    has been approved. Continue to your dashboard.
                  </p>
                  <button
                    onClick={() => {
                      void routeAfterAuth(router);
                    }}
                    className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-[var(--accent-primary)] text-white font-semibold text-[14px] hover:brightness-110 transition-all shadow-lg shadow-[var(--accent-primary)]/20"
                  >
                    Go to Dashboard <ChevronRight className="h-4 w-4" />
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
                    <RefreshCw className="h-10 w-10" />
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
                      {formData.name}
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
              {approvalStatus === 'rejected' && (
                <>
                  <motion.div
                    key="rejected"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="h-24 w-24 rounded-3xl bg-[var(--state-error-bg, #fef2f2)] text-[var(--state-error, #ef4444)] flex items-center justify-center mx-auto mb-8"
                  >
                    <AlertCircle className="h-10 w-10" />
                  </motion.div>
                  <h1 className="text-display-sm text-[var(--text-primary)] mb-4">
                    Application Rejected
                  </h1>
                  <p className="text-body text-[var(--text-secondary)] mb-10 max-w-md mx-auto">
                    {reviewNote ||
                      'Unfortunately, your application to become a partner has been rejected.'}
                  </p>
                  <button
                    onClick={() => {
                      if (authUser) void signOut();
                      router.push('/login');
                    }}
                    className="inline-flex items-center justify-center gap-2 text-[var(--accent-primary)] font-semibold text-[14px] hover:underline"
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
  /** Rendered under the input; also drives the error border. */
  error?: string | undefined;
} & InputHTMLAttributes<HTMLInputElement>;

function FormInput({ label, icon: Icon, error, ...props }: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-placeholder)] group-focus-within:text-[var(--accent-primary)] transition-colors" />
        )}
        <input
          className={`w-full bg-[var(--surface-secondary)] border rounded-xl text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-all outline-none ${Icon ? 'pl-12 pr-4' : 'px-4'} py-3.5 hover:border-[var(--border-default)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-[var(--state-error)]' : 'border-[var(--border-subtle)]'}`}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[var(--state-error)]">{error}</p>}
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
  inputMode,
  disabled = false,
}: {
  label: string;
  icon?: LucideIcon;
  value: string | number | null;
  error?: string | undefined;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'numeric' | 'text' | 'tel' | 'email' | 'url' | 'search' | undefined;
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
          inputMode={inputMode}
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
          aria-invalid={error ? true : undefined}
          className={`w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-all outline-none ${Icon ? 'pl-12 pr-4' : 'px-4'} py-3.5 hover:border-[var(--border-default)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] disabled:opacity-60 disabled:cursor-not-allowed ${error ? 'border-[var(--state-error)]' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-[var(--state-error)]">{error}</p>}
    </div>
  );
}

/**
 * City, as a searchable combobox over {@link searchCities}.
 *
 * A native `<select>` of ~260 cities was two problems at once: it gave no hint
 * that typing was possible, and its chrome could not be themed (the arrow and
 * the option list are OS-rendered). This keeps the same theme tokens as the
 * rest of the wizard while letting an applicant type "pune" or "ma" and pick
 * from a ranked shortlist.
 *
 * Free text is still accepted — `profile.city` is a free-form string on the
 * contract, and `resolveKnownCity` canonicalises aliases ("Bangalore" →
 * "Bengaluru") while passing anything it does not recognise through, so a town
 * missing from the list can never strand an applicant on an unsatisfiable
 * "Please select a city".
 */
function CityPicker({
  value,
  error,
  onChange,
}: {
  value: string;
  error?: string | undefined;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = 'city-picker-listbox';

  const matches: readonly CityEntry[] = open ? searchCities(query, 8) : [];

  // The listbox is absolutely positioned inside a `relative` wrapper, so any
  // click outside the wrapper dismisses it without a document listener.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  // Reset in the handlers that change the query rather than in an effect —
  // "the list just changed, so the highlight goes back to the top" is a direct
  // consequence of typing or focusing, not synchronisation with anything outside.
  const commit = (city: string) => {
    onChange(city);
    setQuery('');
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const next = activeIndex + delta;
      setActiveIndex(Math.min(Math.max(next, 0), Math.max(matches.length - 1, 0)));
      return;
    }
    if (event.key === 'Enter') {
      if (open && matches[activeIndex]) {
        event.preventDefault();
        commit(matches[activeIndex].name);
      }
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'Tab') {
      // Tabbing away commits whatever is typed (canonicalised) rather than
      // silently dropping it — the field is free-form, so a miss is legal.
      if (query.trim().length > 0) {
        onChange(resolveKnownCity(query) ?? '');
      }
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="input-label" htmlFor="city-picker-input">
        City
      </label>
      <div className="relative">
        <input
          id="city-picker-input"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            open && matches[activeIndex] ? `${listId}-${matches[activeIndex].name}` : undefined
          }
          autoComplete="off"
          value={open ? query : value}
          placeholder="Search for your city"
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => {
            setQuery('');
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full bg-[var(--surface-secondary)] border rounded-xl px-4 py-3.5 pr-11 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-all outline-none hover:border-[var(--border-default)] focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)] ${error ? 'border-[var(--state-error)]' : 'border-[var(--border-subtle)]'}`}
        />
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)] pointer-events-none" />
        {open && (
          <div
            id={listId}
            role="listbox"
            className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] shadow-xl shadow-black/20 p-1"
          >
            {matches.length === 0 ? (
              <div className="px-4 py-3 text-[13px] text-[var(--text-tertiary)]">
                No match — press Tab to keep "{query.trim()}"
              </div>
            ) : (
              matches.map((city, index) => (
                <div
                  key={city.name}
                  id={`${listId}-${city.name}`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    // `onMouseDown` fires before the input's blur, so the click
                    // both selects the city and keeps the field focused.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(city.name);
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    className={`flex w-full items-baseline justify-between gap-3 rounded-xl px-4 py-2.5 text-left transition-colors ${index === activeIndex ? 'bg-[var(--surface-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)]'}`}
                  >
                    <span className="text-[14px] font-medium">{city.name}</span>
                    <span className="text-[11px] text-[var(--text-tertiary)]">{city.state}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-[var(--state-error)]">{error}</p>
      ) : (
        value.length > 0 && <p className="text-xs text-[var(--text-tertiary)]">Selected: {value}</p>
      )}
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
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="input-label">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) => {
          onChange(e.target.value.replace(/\D/g, '').slice(0, 6));
        }}
        placeholder="000000"
        className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl px-4 py-3.5 text-[24px] font-bold tracking-[0.5em] text-center text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] transition-all outline-none focus:bg-[var(--surface-base)] focus:border-[var(--accent-primary)] focus:ring-3 focus:ring-[var(--accent-glow)]"
      />
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
      className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-40"
    >
      <RefreshCw className="h-4 w-4" />
      {cooldown > 0 ? `Resend in ${String(cooldown)}s` : 'Resend Code'}
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
// One slot of the gateway's required document set. The upload lands server-side
// through the app's own BFF (`uploadDocument`); the browser never performs a
// cross-origin PUT.
function KycFileZone({
  label,
  value,
  onChange,
  requestId,
  docLabel,
}: {
  label: string;
  value: string | null;
  onChange: (storagePath: string | null) => void;
  /** The application to attach this document to. */
  requestId: string | null;
  /**
   * Backend document slot for this field. Individuals use `id_front`/`id_back`/
   * `selfie`; business applicants use `registration_certificate` plus the
   * signatory's `sig_id_front`/`sig_id_back`/`sig_selfie` — exactly the sets
   * `missingDocuments()` checks per `profile.entityType`, so the label passed
   * here is what decides whether the applicant's application can submit.
   */
  docLabel: OnboardingDocumentLabel;
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
      setUploadError(errorMessage(e, 'Upload failed. Please try again.'));
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

function KycInputField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  type = 'text',
  inputMode,
  maxLength,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  /** Format guidance shown while the field is untouched. */
  hint?: string | undefined;
  error?: string | undefined;
  type?: string;
  inputMode?: 'numeric' | 'text' | 'tel' | 'email' | undefined;
  maxLength?: number;
}) {
  const message = error ?? hint;
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={`w-full h-12 px-4 rounded-xl bg-[var(--surface-secondary)] border text-[var(--text-primary)] text-[14px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all ${error ? 'border-[var(--state-error)] focus:border-[var(--state-error)]' : 'border-[var(--border-subtle)] focus:border-[var(--accent-primary)]/50'}`}
      />
      {message && (
        <p
          className={`text-[11px] font-medium ${error ? 'text-[var(--state-error)]' : 'text-[var(--text-tertiary)]'}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function KycSelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  error?: string | undefined;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          aria-invalid={error ? true : undefined}
          className={`w-full h-12 px-4 pr-11 rounded-xl bg-[var(--surface-secondary)] border text-[var(--text-primary)] text-[14px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all appearance-none ${error ? 'border-[var(--state-error)]' : 'border-[var(--border-subtle)] focus:border-[var(--accent-primary)]/50'}`}
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)] pointer-events-none" />
      </div>
      {error && <p className="text-[11px] font-medium text-[var(--state-error)]">{error}</p>}
    </div>
  );
}

// ── KYC Forms ─────────────────────────────────────────────────────────────────

/**
 * The `idType` a KYC form resumes with: one of the offered values, or empty.
 *
 * A draft written before the option set changed must not leave the select on a
 * value no option matches — the field would be stuck in a state the applicant
 * cannot correct, and the submit would fail on a `documentType` they never chose.
 */
function initialKycIdType(initialData: Record<string, unknown>): string {
  const value = initialData['idType'];
  return typeof value === 'string' && isKycIdType(value) ? value : '';
}

function KycIdentityForm({
  requestId,
  initialData,
  onSubmit,
  submitting,
  submitLabel = 'Continue',
}: {
  requestId: string | null;
  initialData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  submitting: boolean;
  submitLabel?: string;
}) {
  const [idType, setIdType] = useState(initialKycIdType(initialData));
  const [idNumber, setIdNumber] = useState((initialData['idNumber'] as string) || '');
  const [docFront, setDocFront] = useState<string | null>(
    (initialData['docFrontUrl'] as string) || null,
  );
  const [docBack, setDocBack] = useState<string | null>(
    (initialData['docBackUrl'] as string) || null,
  );
  const [selfie, setSelfie] = useState<string | null>((initialData['selfieUrl'] as string) || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Aadhaar's recorded format check — never rendered as "verified" (D-018).
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(Boolean(initialData['isVerified']));
  const [verificationError, setVerificationError] = useState('');

  const kycIdType: KycIdType | null = isKycIdType(idType) ? idType : null;

  // The backend requires all three slots (id_front, id_back, selfie)
  // unconditionally by ID type — `REQUIRED_DOCUMENT_LABELS` has no per-type
  // variant. A passport holder skipping "back" here would never be able to
  // clear `missingDocuments` server-side, so every ID type needs one.

  const handleVerifyAadhaar = async () => {
    if (normalizeAadhaar(idNumber).length !== 12) {
      setVerificationError(ID_NUMBER_ERRORS.aadhaar);
      return;
    }
    setVerifying(true);
    setVerificationError('');
    try {
      // Format-check only, per D-018 — never rendered as government-verified.
      const result = await verifyDocument({
        documentType: 'aadhaar',
        documentNumber: normalizeAadhaar(idNumber),
      });
      if (!result.passed) {
        throw new Error(result.reason ?? 'Verification failed.');
      }
      setIsVerified(true);
    } catch (err) {
      setVerificationError(errorMessage(err, 'Verification failed.'));
      setIsVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  // Any edit to the ID invalidates a previous format check.
  const resetVerification = () => {
    setIsVerified(false);
    setVerificationError('');
  };
  const handleIdTypeChange = (value: string) => {
    setIdType(value);
    setIdNumber('');
    setErrors((prev) => ({ ...prev, idType: '', idNumber: '' }));
    resetVerification();
  };
  const handleIdNumberChange = (value: string) => {
    setIdNumber(value);
    setErrors((prev) => ({ ...prev, idNumber: '' }));
    resetVerification();
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!kycIdType) {
      nextErrors['idType'] = 'Choose the ID type you are uploading.';
    }
    const idNumberError = kycIdType ? checkIdNumber(kycIdType, idNumber) : null;
    if (idNumberError) {
      nextErrors['idNumber'] = idNumberError;
    }
    if (!docFront) nextErrors['docFront'] = 'Upload the front of your ID.';
    if (!docBack) nextErrors['docBack'] = 'Upload the back of your ID.';
    if (!selfie) nextErrors['selfie'] = 'Upload a selfie holding your ID.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (idType === 'aadhaar' && !isVerified) {
      setVerificationError('Run the format check on your Aadhaar before continuing.');
      return;
    }
    onSubmit({
      idType,
      idNumber: sanitizeIdentifier(idNumber, 30),
      docFrontUrl: docFront,
      docBackUrl: docBack,
      selfieUrl: selfie,
      isVerified,
    });
  };

  const allSlotsFilled = docFront !== null && docBack !== null && selfie !== null;
  const aadhaarBlocked = idType === 'aadhaar' && !isVerified;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <KycSelectField
        label="ID Type"
        value={idType}
        onChange={handleIdTypeChange}
        error={errors['idType']}
        options={KYC_ID_TYPES.map((option) => ({ value: option.value, label: option.label }))}
      />

      <div className="space-y-2">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <KycInputField
              label="ID Number"
              value={idNumber}
              onChange={handleIdNumberChange}
              placeholder="Enter your ID number"
              inputMode={idType === 'aadhaar' ? 'numeric' : 'text'}
              maxLength={idType === 'aadhaar' ? 12 : 30}
              hint={kycIdType ? ID_NUMBER_ERRORS[kycIdType] : undefined}
              error={errors['idNumber']}
            />
          </div>
          {idType === 'aadhaar' && (
            <button
              type="button"
              onClick={() => {
                void handleVerifyAadhaar();
              }}
              disabled={verifying || isVerified || normalizeAadhaar(idNumber).length !== 12}
              className={`h-12 px-6 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isVerified ? 'bg-emerald-500/20 text-emerald-500 cursor-default' : 'bg-[var(--accent-primary)] text-white hover:brightness-110 disabled:opacity-40'}`}
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isVerified ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : null}
              {verifying ? 'Checking...' : isVerified ? 'Format Validated' : 'Check Format'}
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
            Aadhaar format validated.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KycFileZone
          label="Document Front"
          value={docFront}
          onChange={(path) => {
            setDocFront(path);
            setErrors((prev) => ({ ...prev, docFront: '' }));
          }}
          requestId={requestId}
          docLabel="id_front"
        />
        <KycFileZone
          label="Document Back"
          value={docBack}
          onChange={(path) => {
            setDocBack(path);
            setErrors((prev) => ({ ...prev, docBack: '' }));
          }}
          requestId={requestId}
          docLabel="id_back"
        />
      </div>
      <KycFileZone
        label="Selfie Photo"
        value={selfie}
        onChange={(path) => {
          setSelfie(path);
          setErrors((prev) => ({ ...prev, selfie: '' }));
        }}
        requestId={requestId}
        docLabel="selfie"
      />
      {Object.entries(errors)
        .filter(([, message]) => message.startsWith('Upload '))
        .map(([field, message]) => (
          <p key={field} className="text-[11px] font-medium text-[var(--state-error)]">
            {message}
          </p>
        ))}
      <button
        type="submit"
        disabled={submitting || !allSlotsFilled || !kycIdType || !idNumber || aadhaarBlocked}
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
  requestId,
  initialData,
  onSubmit,
  submitting,
  submitLabel = 'Continue',
}: {
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const panError = checkPAN(pan);
    if (panError) nextErrors['pan'] = panError;
    const gstError = checkGSTIN(gst);
    if (gstError) nextErrors['gst'] = gstError;
    const addressError = checkRegisteredAddress(address);
    if (addressError) nextErrors['address'] = addressError;
    if (!regDoc) nextErrors['regDoc'] = 'Upload the registration certificate.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      legalName,
      businessType,
      pan: sanitizeIdentifier(pan, 10),
      cin,
      gst: sanitizeIdentifier(gst, 15) || undefined,
      address: sanitizeMultiline(address, CONTRACT_LIMITS.MAX_REGISTERED_ADDRESS),
      regDocUrl: regDoc,
    });
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
            {BUSINESS_TYPE_LABELS[businessType] ?? (businessType || '—')}
          </span>
        </div>
        {cin && (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-tertiary)]">CIN / Reg. No.</span>
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{cin}</span>
          </div>
        )}
      </div>
      <KycInputField
        label="Business PAN"
        value={pan}
        onChange={(v) => {
          setPan(sanitizeIdentifier(v, 10));
          setErrors((prev) => ({ ...prev, pan: '' }));
        }}
        placeholder="AAACB1234C"
        maxLength={10}
        hint="10 characters: 5 letters, 4 digits, 1 letter."
        error={errors['pan']}
      />
      <KycInputField
        label="GST Number (optional)"
        value={gst}
        onChange={(v) => {
          setGst(sanitizeIdentifier(v, 15));
          setErrors((prev) => ({ ...prev, gst: '' }));
        }}
        placeholder="27AAACB1234C1Z5"
        maxLength={15}
        error={errors['gst']}
      />
      <KycInputField
        label="Registered Address"
        value={address}
        onChange={(v) => {
          setAddress(sanitizeMultiline(v, CONTRACT_LIMITS.MAX_REGISTERED_ADDRESS));
          setErrors((prev) => ({ ...prev, address: '' }));
        }}
        placeholder="Full address as on documents"
        hint="As printed on your registration certificate."
        error={errors['address']}
      />
      <KycFileZone
        label="Registration Certificate"
        value={regDoc}
        onChange={(path) => {
          setRegDoc(path);
          setErrors((prev) => ({ ...prev, regDoc: '' }));
        }}
        requestId={requestId}
        docLabel="registration_certificate"
      />
      {errors['regDoc'] && (
        <p className="text-[11px] font-medium text-[var(--state-error)]">{errors['regDoc']}</p>
      )}
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
  requestId,
  initialData,
  onSubmit,
  submitting,
  submitLabel = 'Continue',
}: {
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
  const [idType, setIdType] = useState(initialKycIdType(initialData));
  const [idNumber, setIdNumber] = useState((initialData['idNumber'] as string) || '');
  const [docFront, setDocFront] = useState<string | null>(
    (initialData['docFrontUrl'] as string) || null,
  );
  const [docBack, setDocBack] = useState<string | null>(
    (initialData['docBackUrl'] as string) || null,
  );
  const [selfie, setSelfie] = useState<string | null>((initialData['selfieUrl'] as string) || null);
  const [declared, setDeclared] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Business applicants must supply sig_id_front, sig_id_back and sig_selfie
  // (plus the registration certificate); a passport holder skipping "back"
  // would never clear missingDocuments server-side, so every ID type needs one.

  const kycIdType: KycIdType | null = isKycIdType(idType) ? idType : null;

  const clearError = (field: string) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };
  const handleIdTypeChange = (value: string) => {
    setIdType(value);
    setIdNumber('');
    clearError('idType');
    clearError('idNumber');
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    const nameError = checkPersonName(fullName, 'Full legal name');
    if (nameError) nextErrors['fullName'] = nameError;
    if (!designation) nextErrors['designation'] = 'Choose a designation.';
    if (!isValidEmail(email)) {
      nextErrors['email'] = 'Enter a valid email address.';
    }
    const phoneError = checkPhone(phone, false);
    if (phoneError) nextErrors['phone'] = phoneError;
    if (!kycIdType) nextErrors['idType'] = 'Choose the ID type you are uploading.';
    // For Aadhaar this runs the Verhoeff checksum, so a mistyped digit is
    // caught here rather than in an admin's face days later.
    const idNumberError = kycIdType ? checkIdNumber(kycIdType, idNumber) : null;
    if (idNumberError) nextErrors['idNumber'] = idNumberError;
    if (!docFront) nextErrors['docFront'] = 'Upload the front of the representative ID.';
    if (!docBack) nextErrors['docBack'] = 'Upload the back of the representative ID.';
    if (!selfie) nextErrors['selfie'] = 'Upload a selfie of the representative holding their ID.';
    if (!declared) {
      nextErrors['declared'] = 'Confirm you are authorized to represent this business.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({
      fullName: sanitizeText(fullName, CONTRACT_LIMITS.MAX_NAME),
      designation,
      email: sanitizeText(email, CONTRACT_LIMITS.MAX_EMAIL).toLowerCase(),
      phone: sanitizePhoneInput(phone),
      idType,
      idNumber: sanitizeIdentifier(idNumber, 30),
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
          onChange={(v) => {
            setFullName(sanitizeText(v, CONTRACT_LIMITS.MAX_NAME));
            clearError('fullName');
          }}
          placeholder="As on government ID"
          maxLength={CONTRACT_LIMITS.MAX_NAME}
          error={errors['fullName']}
        />
        <KycSelectField
          label="Designation"
          value={designation}
          onChange={(v) => {
            setDesignation(v);
            clearError('designation');
          }}
          error={errors['designation']}
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
          onChange={(v) => {
            setEmail(sanitizeText(v, CONTRACT_LIMITS.MAX_EMAIL));
            clearError('email');
          }}
          type="email"
          inputMode="email"
          maxLength={CONTRACT_LIMITS.MAX_EMAIL}
          placeholder="representative@company.com"
          error={errors['email']}
        />
        <KycInputField
          label="Phone (optional)"
          value={phone}
          onChange={(v) => {
            // Left as the applicant typed it (spaces/parentheses intact) — the
            // dialable form is derived on submit, so the field stays readable.
            setPhone(sanitizeText(v, 20));
            clearError('phone');
          }}
          type="tel"
          inputMode="tel"
          maxLength={20}
          placeholder="+91 9876543210"
          hint="7–15 digits, with an optional leading +."
          error={errors['phone']}
        />
      </div>
      <KycSelectField
        label="ID Type"
        value={idType}
        onChange={handleIdTypeChange}
        error={errors['idType']}
        options={KYC_ID_TYPES.map((option) => ({ value: option.value, label: option.label }))}
      />
      <KycInputField
        label="ID Number"
        value={idNumber}
        onChange={(v) => {
          setIdNumber(sanitizeIdentifier(v, kycIdType === 'aadhaar' ? 12 : 30));
          clearError('idNumber');
        }}
        placeholder={kycIdType === 'aadhaar' ? 'Enter 12-digit Aadhaar' : 'Enter ID number'}
        inputMode={kycIdType === 'aadhaar' ? 'numeric' : 'text'}
        maxLength={kycIdType === 'aadhaar' ? 12 : 30}
        hint={kycIdType ? ID_NUMBER_ERRORS[kycIdType] : undefined}
        error={errors['idNumber']}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <KycFileZone
          label="Document Front"
          value={docFront}
          onChange={(path) => {
            setDocFront(path);
            clearError('docFront');
          }}
          requestId={requestId}
          docLabel="sig_id_front"
        />
        <KycFileZone
          label="Document Back"
          value={docBack}
          onChange={(path) => {
            setDocBack(path);
            clearError('docBack');
          }}
          requestId={requestId}
          docLabel="sig_id_back"
        />
      </div>
      <KycFileZone
        label="Selfie Photo"
        value={selfie}
        onChange={(path) => {
          setSelfie(path);
          clearError('selfie');
        }}
        requestId={requestId}
        docLabel="sig_selfie"
      />
      {Object.entries(errors)
        .filter(([field]) => field.startsWith('doc') || field === 'selfie')
        .map(([field, message]) => (
          <p
            key={field}
            className="text-[11px] font-medium text-[var(--state-error)] flex items-center gap-1.5"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {message}
          </p>
        ))}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={declared}
            onChange={(e) => {
              setDeclared(e.target.checked);
              clearError('declared');
            }}
            aria-invalid={errors['declared'] ? true : undefined}
            className="mt-0.5 h-4 w-4 rounded border-[var(--border-subtle)] accent-[var(--accent-primary)]"
          />
          <span className="text-[12px] text-[var(--text-secondary)] leading-relaxed">
            I confirm that I am authorized to represent this business and the information provided
            is accurate.
          </span>
        </label>
        {errors['declared'] && (
          <p className="text-[11px] font-medium text-[var(--state-error)] mt-1.5">
            {errors['declared']}
          </p>
        )}
      </div>
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
          !docBack ||
          !selfie ||
          !declared
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
