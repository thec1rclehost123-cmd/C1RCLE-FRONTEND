/**
 * ─── Onboarding input validation ─────────────────────────────────────────────
 *
 * Everything here is a **UX affordance, not a trust boundary**. The gateway is
 * the only authority that decides what an application may contain
 * (`packages/contracts/src/contracts/onboarding.ts` for the profile schema,
 * `POST /api/v2/onboarding/verify-document` for the identifier formats). The
 * wizard validates locally so an applicant finds out about a bad CIN while
 * they are still looking at the field, instead of after a round-trip 422 on
 * submit.
 *
 * Two consequences shape the rules below:
 *
 * 1. **Where the backend has a rule, this file matches it exactly.** A stricter
 *    client check would silently block applicants the server would have
 *    accepted, with no recourse — a worse outcome than a late error. So
 *    `isValidPAN`/`isValidGSTIN` mirror `FORMATS` in the backend's
 *    `domain/ports/verification.ts` rather than the stricter forms found in
 *    Indian tax literature.
 * 2. **Where the backend has no rule at all, this file may be precise.**
 *    `registrationNumber` is only `z.string().max(120)` in the contract, so the
 *    wizard is free to teach the MCA's real CIN layout — and to accept the
 *    other identifiers a sole proprietor or trust may legitimately supply —
 *    without contradicting anything.
 */

/** Contract caps (`onboardingProfileSchema`), repeated so the client cannot exceed them. */
const MAX_LEGAL_NAME = 200;
const MAX_NAME = 200;
const MAX_CITY = 120;
const MAX_AREA = 120;
const MAX_INSTAGRAM = 120;
const MAX_BIO = 2000;
const MAX_WEBSITE = 300;
const MAX_REGISTRATION_NUMBER = 120;
const MAX_REGISTERED_ADDRESS = 1000;
const MAX_EMAIL = 254;

/**
 * Strip C0/C1 control characters and Unicode format characters (zero-width
 * joiners, bidi overrides, BOM — a classic invisible-text spoofing vector)
 * without tripping `no-control-regex`, which flags literal `\x00`-style ranges.
 * Newlines are deliberately included: callers that need them preserved use
 * {@link sanitizeMultiline}, which splits on line breaks first.
 */
const INVISIBLE_OR_CONTROL = /[\p{Cc}\p{Cf}]/gu;

const REPEATED_WHITESPACE = /\s+/gu;
const REPEATED_BLANK_LINES = /\n{3,}/gu;
const NON_DIGIT = /\D/gu;
/**
 * Non-global twin of {@link NON_DIGIT}. `RegExp.prototype.test` on a `/g` regex
 * carries `lastIndex` across calls, so a shared global would make a second
 * `checkCapacity('…')` silently skip the digits the first one rejected.
 */
const NON_DIGIT_ANY = /\D/u;

/* ── Indian identifier patterns ──────────────────────────────────────────── */

/**
 * PAN — 5 letters, 4 digits, 1 letter. Byte-identical to the backend's
 * `FORMATS.pan`.
 */
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/u;

/**
 * GSTIN — 15 characters: 2-digit state code, the entity's 10-character PAN, a
 * 1-digit entity code, a fixed `Z`, and a checksum character. The shape
 * matches the backend's `FORMATS.gstin`.
 */
const GSTIN_SHAPE_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]{3}$/u;

/**
 * CIN — the MCA's 21-character layout, which is fixed and positional:
 * listing status + 5-digit unique listing number + 2-letter state + 4-digit year
 * of incorporation + 3-letter entity type + 6-digit registration number, e.g.
 * `L17110MH1980PLC014121`.
 *
 * `A`/`F` are accepted in the first position because LLP-incorporated
 * registrations use the same 21-character grid under an `A` prefix; anything
 * laid out differently falls through to the generic branch in
 * {@link classifyRegistrationNumber} rather than being rejected outright.
 */
const CIN_PATTERN = /^[LUAF][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/u;

/**
 * A registration identifier with no single canonical format — a society's
 * registration number, an LLPIN, a Udyam number, a trust's deed number.
 * Alphanumeric, 5–21 characters, and required to contain at least one digit so
 * a stray word cannot pass as a registration number.
 */
const GENERIC_REGISTRATION_PATTERN = /^(?=[A-Z0-9]*[0-9])[A-Z0-9]{5,21}$/u;

/** Government ID formats, keyed by the `documentType` the wizard sends. */
const ID_NUMBER_PATTERNS = {
  aadhaar: /^[2-9][0-9]{11}$/u,
  passport: /^[A-Z][0-9]{7,8}$/u,
  /**
   * Driving licences are laid out by the issuing state RTO, and the country has
   * two live layouts: 2-letter state + 2-digit RTO code + 4-digit year + a
   * 4- or 7-digit serial. The backend has no format for this `documentType`, so
   * both are accepted here rather than locking out an applicant holding the
   * shorter one — see the module header.
   */
  driving_licence: /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{4,7}$/u,
  voter_id: /^[A-Z]{3}[0-9]{7}$/u,
} as const satisfies Record<string, RegExp>;

export type KycIdType = keyof typeof ID_NUMBER_PATTERNS;

/** Contact digits after the profile's phone is stripped of formatting. */
const PHONE_PATTERN = /^\+?[0-9]{7,15}$/u;

/** A person's name: letters from any script, plus the marks they legitimately carry. */
const PERSON_NAME_PATTERN = /^[\p{L}\p{M}'’. -]+$/u;

/**
 * A registered entity's name: a person's name plus digits and the punctuation
 * registrars actually use (`&`, `/`, parentheses).
 */
const ORGANISATION_NAME_PATTERN = /^[\p{L}\p{M}\p{N}&,'’.()/ -]+$/u;

/** Instagram handles: letters, digits, `.` and `_`, never empty. */
const INSTAGRAM_HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9._]{0,28}[a-z0-9_])?$/u;

/**
 * Practical email shape: a non-empty local part, a dotted domain, no spaces.
 * Deliberately not RFC 5322 — a regex that precise rejects addresses that
 * deliver, and the real check is the OTP the applicant receives.
 */
const EMAIL_PATTERN =
  /^[^\s@,;:<>()[\]\\]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/iu;

const MIN_NAME_LENGTH = 2;
const MIN_ADDRESS_LENGTH = 10;

/** 0 would mean "closes immediately", which is never the intent for a capacity. */
const MIN_CAPACITY = 1;
const MAX_CAPACITY = 1_000_000;

/* ── Verhoeff (Aadhaar checksum) ─────────────────────────────────────────── */

/**
 * Verhoeff's diagonal and permutation tables.
 *
 * Ported verbatim from v1 and from the backend's
 * `packages/core/src/domain/ports/verification.ts`, which is where the
 * algorithm lives: D-018 is explicit that the checksum only proves the digits
 * are well-formed, never that the person exists. The frontend runs the same
 * maths so the applicant gets the answer immediately, and still calls
 * `POST /api/v2/onboarding/verify-document` for the recorded check — the green
 * tick is labelled "format validated" everywhere it appears for that reason.
 */
const VERHOEFF_D_TABLE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const VERHOEFF_P_TABLE = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * The digits of an Aadhaar, with the spacing and separators applicants paste in
 * removed.
 *
 * Non-digits are stripped *before* the length is considered: collapsing
 * whitespace first and capping at 12 would silently turn a pasted
 * `9999 9999 9019` into ten digits, which then fails for the wrong reason.
 * Deliberately not truncated to 12, so an over-long entry is *rejected* by
 * {@link isValidAadhaar} rather than quietly shortened into a different
 * (possibly valid) number.
 */
export function normalizeAadhaar(raw: string): string {
  return sanitizeText(raw, 32).replace(NON_DIGIT, '');
}

/**
 * v1's Aadhaar check, ported exactly: 12 digits, no leading `0`/`1` (no Aadhaar
 * is issued below `2`), and a Verhoeff checksum of `0`.
 */
export function isValidAadhaar(raw: string): boolean {
  const digits = normalizeAadhaar(raw);
  if (!/^\d{12}$/u.test(digits)) {
    return false;
  }
  if (digits.startsWith('0') || digits.startsWith('1')) {
    return false;
  }
  let checksum = 0;
  const reversed = digits.split('').map(Number).reverse();
  for (let index = 0; index < reversed.length; index += 1) {
    const digit = reversed[index] ?? 0;
    const permutation = VERHOEFF_P_TABLE[index % 8]?.[digit] ?? 0;
    checksum = VERHOEFF_D_TABLE[checksum]?.[permutation] ?? 0;
  }
  return checksum === 0;
}

/* ── Sanitizers ──────────────────────────────────────────────────────────── */

/**
 * Single-line text: invisible characters removed, whitespace runs collapsed,
 * trimmed, and hard-capped at `maxLength`. Capping here (rather than relying on
 * the contract's `.max()`) keeps the value the applicant *sees* identical to
 * the value that gets sent.
 */
export function sanitizeText(raw: string, maxLength: number): string {
  return raw
    .replace(INVISIBLE_OR_CONTROL, ' ')
    .replace(REPEATED_WHITESPACE, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Multi-line text (bios, addresses). Keeps one blank line as a paragraph break
 * and hard-caps the result; individual lines are still whitespace-collapsed.
 */
export function sanitizeMultiline(raw: string, maxLength: number): string {
  return raw
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => sanitizeText(line, maxLength))
    .join('\n')
    .replace(REPEATED_BLANK_LINES, '\n\n')
    .trim()
    .slice(0, maxLength);
}

/** Uppercase alphanumeric identifier input (PAN/GSTIN/CIN), capped in length. */
export function sanitizeIdentifier(raw: string, maxLength = MAX_REGISTRATION_NUMBER): string {
  return raw
    .replace(/[^A-Za-z0-9]/gu, '')
    .toUpperCase()
    .slice(0, maxLength);
}

/**
 * Phone input reduced to dialable characters, with a single `+` pinned to the
 * front so `+91` survives whatever gets pasted or typed into the middle.
 */
export function sanitizePhoneInput(raw: string): string {
  const cleaned = sanitizeText(raw, 20).replace(/[^\d+]/gu, '');
  const digits = cleaned.replace(/\+/gu, '');
  if (digits.length === 0) {
    return '';
  }
  return cleaned.includes('+') ? `+${digits}` : digits;
}

/**
 * True when the value is dialable: 7–15 digits, `+` permitted only in front.
 * The gateway only requires 6–20 characters, so this is intentionally a little
 * stricter than the contract — a 7-digit local number is the shortest thing a
 * human can usefully dial.
 */
export function isValidPhone(raw: string): boolean {
  return PHONE_PATTERN.test(sanitizePhoneInput(raw));
}

/**
 * Phone with a message the applicant can act on.
 *
 * @param required `false` for genuinely optional contact numbers (the
 * signatory's), where an empty value is acceptable.
 * @returns an error message, or `null` when the value is acceptable.
 */
export function checkPhone(raw: string, required = true): string | null {
  const value = sanitizePhoneInput(raw);
  if (value.length === 0) {
    return required ? 'Phone number is required.' : null;
  }
  if (!isValidPhone(value)) {
    return 'Enter a valid phone number, e.g. +91 98765 43210.';
  }
  return null;
}

/* ── Identifier validators ───────────────────────────────────────────────── */

/** @see {@link PAN_PATTERN} */
export function isValidPAN(value: string): boolean {
  return PAN_PATTERN.test(value.toUpperCase());
}

/**
 * @see {@link GSTIN_SHAPE_PATTERN}
 *
 * Beyond the shape, two structural facts hold for every GSTIN the GSTN issues,
 * so they are safe to enforce: characters 3–12 are always the entity's PAN, and
 * character 14 is always `Z`. The 2-digit state code is deliberately *not*
 * checked against a whitelist — codes get split and reassigned (28 and 97 in
 * particular), and a stale whitelist would reject valid registrants.
 */
export function isValidGSTIN(value: string): boolean {
  const candidate = value.toUpperCase();
  if (!GSTIN_SHAPE_PATTERN.test(candidate)) {
    return false;
  }
  if (candidate[13] !== 'Z') {
    return false;
  }
  return isValidPAN(candidate.slice(2, 12));
}

/** @see {@link CIN_PATTERN} */
export function isValidCIN(value: string): boolean {
  return CIN_PATTERN.test(value.toUpperCase());
}

/** Government ID number for the selected `idType`. */
export function isValidIdNumber(idType: KycIdType, value: string): boolean {
  return ID_NUMBER_PATTERNS[idType].test(value.toUpperCase());
}

/** What a recognised registration number turned out to be. */
export type RegistrationNumberKind = 'cin' | 'gstin' | 'pan' | 'generic';

/**
 * Identify a registration number, or `null` when it is not recognisable.
 *
 * `generic` is the escape hatch for entity types that have no MCA identifier
 * (a sole proprietorship has none at all, a trust has a deed, a society has a
 * registrar's number) — those are legitimate answers, so they are classified
 * rather than rejected.
 */
export function classifyRegistrationNumber(raw: string): RegistrationNumberKind | null {
  const value = sanitizeIdentifier(raw);
  if (value.length === 0) {
    return null;
  }
  if (isValidCIN(value)) {
    return 'cin';
  }
  if (isValidGSTIN(value)) {
    return 'gstin';
  }
  if (isValidPAN(value)) {
    return 'pan';
  }
  if (GENERIC_REGISTRATION_PATTERN.test(value)) {
    return 'generic';
  }
  return null;
}

/* ── Field checks ────────────────────────────────────────────────────────── */

/**
 * Whether a value overflows `maxLength` once sanitized — measured *before*
 * truncation, so an over-long input is reported rather than silently shortened.
 */
function exceedsLimit(raw: string, maxLength: number): boolean {
  return sanitizeText(raw, maxLength + 1).length > maxLength;
}

/** @returns an error message, or `null` when the value is acceptable. */
export function checkPersonName(raw: string, label = 'Name'): string | null {
  const value = sanitizeText(raw, MAX_NAME);
  if (value.length === 0) {
    return `${label} is required.`;
  }
  if (value.length < MIN_NAME_LENGTH) {
    return `${label} must be at least ${String(MIN_NAME_LENGTH)} characters.`;
  }
  if (exceedsLimit(raw, MAX_NAME)) {
    return `${label} must be ${String(MAX_NAME)} characters or fewer.`;
  }
  if (!PERSON_NAME_PATTERN.test(value)) {
    return `${label} may only contain letters, spaces, apostrophes, dots and hyphens.`;
  }
  return null;
}

/**
 * @param kind `'person'` for a person's own name, `'organisation'` for a
 * registered entity's name (which may carry digits and `&`).
 * @returns an error message, or `null` when the value is acceptable.
 */
export function checkEntityName(raw: string, kind: 'person' | 'organisation'): string | null {
  const label = kind === 'person' ? 'Name' : 'Legal name';
  const value = sanitizeText(raw, MAX_LEGAL_NAME);
  if (value.length === 0) {
    return `${label} is required.`;
  }
  if (value.length < MIN_NAME_LENGTH) {
    return `${label} must be at least ${String(MIN_NAME_LENGTH)} characters.`;
  }
  if (exceedsLimit(raw, MAX_LEGAL_NAME)) {
    return `${label} must be ${String(MAX_LEGAL_NAME)} characters or fewer.`;
  }
  const pattern = kind === 'person' ? PERSON_NAME_PATTERN : ORGANISATION_NAME_PATTERN;
  if (!pattern.test(value)) {
    return kind === 'person'
      ? `${label} may only contain letters, spaces, apostrophes, dots and hyphens.`
      : `${label} may only contain letters, digits and the punctuation . , & ' ( ) / -`;
  }
  return null;
}

export function isValidEmail(value: string): boolean {
  const candidate = value.trim();
  return candidate.length <= MAX_EMAIL && EMAIL_PATTERN.test(candidate);
}

/** City — required, and free-form on the contract apart from its length. */
export function checkCity(raw: string): string | null {
  if (sanitizeText(raw, MAX_CITY).length === 0) {
    return 'Please select a city.';
  }
  if (exceedsLimit(raw, MAX_CITY)) {
    return `City must be ${String(MAX_CITY)} characters or fewer.`;
  }
  return null;
}

/** Area / locality — optional, but bounded by the contract. */
export function checkArea(raw: string): string | null {
  return exceedsLimit(raw, MAX_AREA)
    ? `Area must be ${String(MAX_AREA)} characters or fewer.`
    : null;
}

/** Bio — optional, but bounded by the contract. */
export function checkBio(raw: string): string | null {
  return exceedsLimit(raw, MAX_BIO) ? `Bio must be ${String(MAX_BIO)} characters or fewer.` : null;
}

/**
 * Website normalization result. `value: null` means "empty and valid" — the
 * field is optional.
 */
export type WebsiteCheck =
  | { readonly ok: true; readonly value: string | null }
  | { readonly ok: false; readonly error: string };

const WEBSITE_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/iu;
const ALLOWED_WEBSITE_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Normalize a website to an absolute `http(s)` URL.
 *
 * Adds the scheme an applicant will inevitably omit, and — the part that
 * matters — refuses anything that is not plain web: a `javascript:` or `data:`
 * URL stored here would become a script-execution vector the moment an admin
 * console renders the profile, and embedded credentials make the link a
 * phishing primitive. Empty stays empty.
 */
export function checkWebsite(raw: string): WebsiteCheck {
  const cleaned = sanitizeText(raw, MAX_WEBSITE + 32).replace(REPEATED_WHITESPACE, '');
  if (cleaned.length === 0) {
    return { ok: true, value: null };
  }

  const withScheme = WEBSITE_SCHEME_PATTERN.test(cleaned) ? cleaned : `https://${cleaned}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false, error: 'Enter a valid website address, e.g. https://yourbrand.com' };
  }

  if (!ALLOWED_WEBSITE_PROTOCOLS.has(url.protocol)) {
    return { ok: false, error: 'Website must be an http:// or https:// address.' };
  }
  if (url.username !== '' || url.password !== '') {
    return { ok: false, error: 'Website must not contain a username or password.' };
  }
  const { hostname } = url;
  if (!hostname.includes('.') || hostname.endsWith('.')) {
    return { ok: false, error: 'Enter a full website address, e.g. https://yourbrand.com' };
  }

  const value = url.toString();
  return value.length > MAX_WEBSITE
    ? { ok: false, error: `Website must be ${String(MAX_WEBSITE)} characters or fewer.` }
    : { ok: true, value };
}

/**
 * Approximate capacity, as an integer. An empty field yields `null` rather than
 * an error — the contract makes `capacity` optional.
 */
export function parseCapacity(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) {
    return null;
  }
  const digits = String(raw).replace(NON_DIGIT, '');
  if (digits.length === 0) {
    return null;
  }
  const parsed = Number.parseInt(digits, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * @returns an error message, or `null` when the value is acceptable (including
 * when the field is left empty).
 */
export function checkCapacity(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined || String(raw).trim().length === 0) {
    return null;
  }
  const parsed = parseCapacity(raw);
  if (parsed === null || NON_DIGIT_ANY.test(String(raw))) {
    return 'Capacity must be a whole number.';
  }
  if (parsed < MIN_CAPACITY) {
    return `Capacity must be at least ${String(MIN_CAPACITY)}.`;
  }
  if (parsed > MAX_CAPACITY) {
    return `Capacity must be ${String(MAX_CAPACITY)} or fewer.`;
  }
  return null;
}

/** Strip the `@` / URL decoration applicants paste in, leaving the bare handle. */
export function normalizeInstagramHandle(raw: string): string {
  return sanitizeText(raw, MAX_INSTAGRAM)
    .replace(/^@+/u, '')
    .replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//iu, '')
    .replace(/^\/+|\/+$/gu, '')
    .toLowerCase()
    .slice(0, MAX_INSTAGRAM);
}

export function checkInstagramHandle(raw: string): string | null {
  const value = normalizeInstagramHandle(raw);
  if (value.length === 0) {
    return null;
  }
  return INSTAGRAM_HANDLE_PATTERN.test(value)
    ? null
    : 'Enter a valid Instagram handle, e.g. @yourusername';
}

/**
 * The registered address a business KYC document must match.
 *
 * @returns an error message, or `null` when the value is acceptable.
 */
export function checkRegisteredAddress(raw: string): string | null {
  const value = sanitizeMultiline(raw, MAX_REGISTERED_ADDRESS);
  if (value.length === 0) {
    return 'Registered address is required.';
  }
  return value.length < MIN_ADDRESS_LENGTH
    ? `Enter the full address as printed on your documents (at least ${String(MIN_ADDRESS_LENGTH)} characters).`
    : null;
}

const CIN_FORMAT_HINT = 'Enter a valid CIN (21 characters, e.g. L17110MH1980PLC014121)';

/**
 * Registration / CIN number on the profile step.
 *
 * @returns an error message, or `null` when the value is acceptable. An empty
 * field is accepted — the contract makes it optional.
 */
export function checkRegistrationNumber(raw: string): string | null {
  const value = sanitizeIdentifier(raw);
  if (value.length === 0) {
    return null;
  }
  if (value.length > MAX_REGISTRATION_NUMBER) {
    return `Registration number must be ${String(MAX_REGISTRATION_NUMBER)} characters or fewer.`;
  }
  return classifyRegistrationNumber(value) === null
    ? `${CIN_FORMAT_HINT}, your GSTIN or PAN, or your registration number.`
    : null;
}

/** GSTIN on the business KYC step — optional, but strictly formed when given. */
export function checkGSTIN(raw: string): string | null {
  // Length is measured on the *uncapped* identifier: truncating first would let
  // an over-long entry "pass" by shedding the characters that made it wrong.
  const value = sanitizeIdentifier(raw);
  if (value.length === 0) {
    return null;
  }
  if (value.length > 15) {
    return 'Enter a valid 15-character GSTIN, e.g. 27AAACB1234C1Z5';
  }
  return isValidGSTIN(value) ? null : 'Enter a valid 15-character GSTIN, e.g. 27AAACB1234C1Z5';
}

/** PAN on the business KYC step — always required. */
export function checkPAN(raw: string): string | null {
  const value = sanitizeIdentifier(raw);
  if (value.length === 0) {
    return 'Business PAN is required.';
  }
  return isValidPAN(value) ? null : 'Enter a valid PAN, e.g. AAACB1234C';
}

/** Format-specific guidance, shown under the ID field once a type is chosen. */
export const ID_NUMBER_ERRORS: Record<KycIdType, string> = {
  aadhaar: 'Aadhaar must be exactly 12 digits.',
  passport: 'Passport must be 1 letter followed by 7–8 digits, e.g. A1234567.',
  driving_licence:
    'Driving licence must be 2 letters followed by 10–13 digits, e.g. MH0120190001234.',
  voter_id: 'Voter ID must be 3 letters followed by 7 digits, e.g. ABC1234567.',
};

/** The `idType` values offered, in the order an applicant should consider them. */
export const KYC_ID_TYPES: readonly { readonly value: KycIdType; readonly label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_licence', label: 'Driving Licence' },
  { value: 'voter_id', label: 'Voter ID' },
];

/** True when `value` is one of the `idType` options above. */
export function isKycIdType(value: string): value is KycIdType {
  return Object.hasOwn(ID_NUMBER_PATTERNS, value);
}

/**
 * Government ID number, with a message that names the format actually expected.
 *
 * For Aadhaar this additionally runs the Verhoeff checksum, so a mistyped digit
 * is caught in the field rather than at the recorded format check.
 */
export function checkIdNumber(idType: KycIdType, raw: string): string | null {
  const value = sanitizeIdentifier(raw, 30);
  if (value.length === 0) {
    return 'ID number is required.';
  }
  if (idType === 'aadhaar') {
    if (!/^\d{12}$/u.test(value)) {
      return ID_NUMBER_ERRORS.aadhaar;
    }
    return isValidAadhaar(value) ? null : 'That Aadhaar fails its checksum. Re-check the digits.';
  }
  return isValidIdNumber(idType, value) ? null : ID_NUMBER_ERRORS[idType];
}

/** Contract caps, exported so the wizard's input `maxLength`s cannot drift from them. */
export const CONTRACT_LIMITS = {
  MAX_LEGAL_NAME,
  MAX_NAME,
  MAX_EMAIL,
  MAX_CITY,
  MAX_AREA,
  MAX_INSTAGRAM,
  MAX_BIO,
  MAX_WEBSITE,
  MAX_REGISTRATION_NUMBER,
  MAX_REGISTERED_ADDRESS,
  MIN_NAME_LENGTH,
  MIN_ADDRESS_LENGTH,
  MIN_CAPACITY,
  MAX_CAPACITY,
} as const;
