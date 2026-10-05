import { describe, expect, it } from 'vitest';

import {
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
  classifyRegistrationNumber,
  isKycIdType,
  isValidAadhaar,
  isValidEmail,
  normalizeAadhaar,
  normalizeInstagramHandle,
  parseCapacity,
  sanitizeIdentifier,
  sanitizeMultiline,
  sanitizePhoneInput,
  sanitizeText,
} from './validation';

/* ── Verhoeff / Aadhaar ───────────────────────────────────────────────────── */

describe('Aadhaar', () => {
  it('accepts a checksum-valid 12-digit number', () => {
    expect(isValidAadhaar('999999990019')).toBe(true);
  });

  it('ignores the spacing and stray characters applicants paste in', () => {
    expect(normalizeAadhaar('9999 9999 0019')).toBe('999999990019');
    expect(isValidAadhaar('9999 9999 0019')).toBe(true);
    // Separators are stripped before the length is judged — capping first would
    // silently reduce this to ten digits.
    expect(normalizeAadhaar('9999-9999-0019')).toBe('999999990019');
  });

  it('rejects a mistyped digit via the Verhoeff checksum', () => {
    expect(isValidAadhaar('999999990018')).toBe(false);
    expect(isValidAadhaar('123412341234')).toBe(false);
  });

  it('rejects numbers that are not exactly 12 digits', () => {
    expect(isValidAadhaar('99999999001')).toBe(false);
    // Not truncated into a different — possibly valid — number.
    expect(isValidAadhaar('9999999900199')).toBe(false);
    expect(isValidAadhaar('')).toBe(false);
  });

  it('rejects leading 0/1 — no Aadhaar is issued below 2', () => {
    expect(isValidAadhaar('099999990019')).toBe(false);
    expect(isValidAadhaar('199999990019')).toBe(false);
  });
});

describe('checkIdNumber', () => {
  it('names the Aadhaar format when the length is wrong', () => {
    expect(checkIdNumber('aadhaar', '1234')).toBe('Aadhaar must be exactly 12 digits.');
  });

  it('distinguishes a checksum failure from a length failure', () => {
    expect(checkIdNumber('aadhaar', '123412341234')).toBe(
      'That Aadhaar fails its checksum. Re-check the digits.',
    );
    expect(checkIdNumber('aadhaar', '999999990019')).toBeNull();
  });

  it('requires a value', () => {
    expect(checkIdNumber('passport', '   ')).toBe('ID number is required.');
  });

  it('checks the other government ID formats', () => {
    expect(checkIdNumber('passport', 'A1234567')).toBeNull();
    expect(checkIdNumber('passport', 'A123')).toMatch(/7–8 digits/u);
    // Both live driving-licence layouts: the short one and the 7-digit serial one.
    expect(checkIdNumber('driving_licence', 'MH0120190001')).toBeNull();
    expect(checkIdNumber('driving_licence', 'MH0120190001234')).toBeNull();
    expect(checkIdNumber('driving_licence', 'MH01')).toMatch(/Driving licence/u);
    expect(checkIdNumber('voter_id', 'ABC1234567')).toBeNull();
    expect(checkIdNumber('voter_id', 'AB1234567')).toMatch(/3 letters/u);
  });

  it('is case- and space-insensitive, like the IDs are written in practice', () => {
    expect(checkIdNumber('passport', ' a1234567 ')).toBeNull();
  });
});

describe('isKycIdType', () => {
  it('accepts exactly the four offered types', () => {
    for (const value of ['aadhaar', 'passport', 'driving_licence', 'voter_id']) {
      expect(isKycIdType(value)).toBe(true);
    }
  });

  it('rejects anything else, including near-misses from a stale draft', () => {
    for (const value of ['', 'pan', 'Aadhaar', 'driving licence', 'id_front']) {
      expect(isKycIdType(value)).toBe(false);
    }
  });
});

/* ── Business identifiers ─────────────────────────────────────────────────── */

describe('PAN', () => {
  it('accepts 5 letters, 4 digits, 1 letter', () => {
    expect(checkPAN('AAACB1234C')).toBeNull();
    expect(checkPAN('aaacb1234c')).toBeNull();
  });

  it('rejects other shapes', () => {
    for (const value of ['AAACB1234', 'AAAAA1234B1', '1234C']) {
      expect(checkPAN(value)).toMatch(/valid PAN/u);
    }
  });

  it('requires a PAN at all', () => {
    expect(checkPAN('')).toBe('Business PAN is required.');
  });

  it('is not fooled by an over-long entry that truncates into a valid PAN', () => {
    expect(checkPAN('AAACB1234C1')).toMatch(/valid PAN/u);
  });
});

describe('GSTIN', () => {
  it('accepts a well-formed GSTIN and rejects a malformed one', () => {
    expect(checkGSTIN('27AAACB1234C1Z5')).toBeNull();
    expect(checkGSTIN('27AAACB1234C1Z5')).toBeNull();
    expect(checkGSTIN('27AAACB1234C1A5')).toMatch(/valid 15-character GSTIN/u);
    expect(checkGSTIN('27AAACB1234C1Z')).toMatch(/valid 15-character GSTIN/u);
  });

  it('is optional — empty is valid', () => {
    expect(checkGSTIN('')).toBeNull();
  });

  it('is not fooled by an over-long entry that truncates into a valid GSTIN', () => {
    expect(checkGSTIN('27AAACB1234C1Z55')).toMatch(/valid 15-character GSTIN/u);
  });
});

describe('classifyRegistrationNumber', () => {
  it('recognises each canonical form', () => {
    expect(classifyRegistrationNumber('L17110MH1980PLC014121')).toBe('cin');
    expect(classifyRegistrationNumber('U24219MH2020PTC123456')).toBe('cin');
    expect(classifyRegistrationNumber('27AAACB1234C1Z5')).toBe('gstin');
    expect(classifyRegistrationNumber('AAACB1234C')).toBe('pan');
  });

  it('falls back to generic for the identifiers sole proprietors actually hold', () => {
    expect(classifyRegistrationNumber('MH19AB1234')).toBe('generic');
    expect(classifyRegistrationNumber('REG12345')).toBe('generic');
    // Dashes are stripped before classification, which is what makes a Udyam
    // or LLPIN number land in `generic` rather than being rejected.
    expect(classifyRegistrationNumber('UDYAM-MH-19-0000001')).toBe('generic');
  });

  it('rejects a word with no digits in it', () => {
    expect(classifyRegistrationNumber('PUNE')).toBeNull();
    expect(classifyRegistrationNumber('')).toBeNull();
  });
});

describe('checkRegistrationNumber', () => {
  it('accepts an empty field — the contract makes it optional', () => {
    expect(checkRegistrationNumber('')).toBeNull();
  });

  it('accepts every recognised form and rejects the unrecognisable', () => {
    expect(checkRegistrationNumber('L17110MH1980PLC014121')).toBeNull();
    expect(checkRegistrationNumber('27AAACB1234C1Z5')).toBeNull();
    expect(checkRegistrationNumber('MH19AB1234')).toBeNull();
    expect(checkRegistrationNumber('PUNE')).toMatch(/valid CIN/u);
  });

  it('treats a field of pure punctuation as empty, not as an error', () => {
    expect(checkRegistrationNumber('!!!')).toBeNull();
  });
});

describe('checkRegisteredAddress', () => {
  it('requires an address long enough to match a certificate', () => {
    expect(checkRegisteredAddress('1 Main St')).toMatch(/at least 10 characters/u);
    expect(checkRegisteredAddress('221B Linking Road, Mumbai')).toBeNull();
    expect(checkRegisteredAddress('')).toMatch(/required/u);
  });
});

/* ── Contact fields ───────────────────────────────────────────────────────── */

describe('isValidEmail', () => {
  it('accepts ordinary addresses', () => {
    for (const value of ['a@b.co', 'jane.doe+kyc@company.co.in', "o'brien@example.com"]) {
      expect(isValidEmail(value)).toBe(true);
    }
  });

  it('rejects the shapes that are certainly typos', () => {
    for (const value of ['', 'jane', 'jane@', '@company.com', 'jane@company', 'jane doe@x.com']) {
      expect(isValidEmail(value)).toBe(false);
    }
  });
});

describe('phone', () => {
  it('reduces input to dialable characters with one leading +', () => {
    expect(sanitizePhoneInput('+91 (98765) 43210')).toBe('+919876543210');
    expect(sanitizePhoneInput('91+987-654-3210')).toBe('+919876543210');
    expect(sanitizePhoneInput('abc')).toBe('');
  });

  it('is required on the profile step', () => {
    expect(checkPhone('')).toBe('Phone number is required.');
    expect(checkPhone('  ')).toBe('Phone number is required.');
  });

  it('is optional for the signatory', () => {
    expect(checkPhone('', false)).toBeNull();
  });

  it('rejects lengths that could not be dialled', () => {
    expect(checkPhone('98765')).toMatch(/valid phone number/u);
    expect(checkPhone('+919876543210')).toBeNull();
  });
});

describe('checkWebsite', () => {
  it('treats an empty field as valid and absent', () => {
    expect(checkWebsite('')).toEqual({ ok: true, value: null });
    expect(checkWebsite('   ')).toEqual({ ok: true, value: null });
  });

  it('adds the scheme an applicant inevitably omits', () => {
    expect(checkWebsite('yourbrand.com')).toEqual({ ok: true, value: 'https://yourbrand.com/' });
    expect(checkWebsite('https://yourbrand.com')).toEqual({
      ok: true,
      value: 'https://yourbrand.com/',
    });
  });

  it('refuses non-web schemes — this value is rendered as a link by an admin', () => {
    // Stored and rendered, `javascript:` would be a script-execution vector.
    for (const value of ['javascript:alert(1)', 'data:text/html,<script>', 'ftp://x.com']) {
      const result = checkWebsite(value);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toMatch(/http:\/\/ or https:\/\//u);
      }
    }
  });

  it('refuses embedded credentials — the link would be a phishing primitive', () => {
    const result = checkWebsite('https://c1rcle.com@evil.example');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/username or password/u);
  });

  it('requires a dotted host', () => {
    expect(checkWebsite('localhost').ok).toBe(false);
    expect(checkWebsite('yourbrand.').ok).toBe(false);
  });
});

/* ── Profile fields ───────────────────────────────────────────────────────── */

describe('capacity', () => {
  it('parses digits and treats an empty field as absent', () => {
    expect(parseCapacity('250')).toBe(250);
    expect(parseCapacity(250)).toBe(250);
    expect(parseCapacity('')).toBeNull();
    expect(parseCapacity(null)).toBeNull();
  });

  it('is optional', () => {
    expect(checkCapacity('')).toBeNull();
    expect(checkCapacity(null)).toBeNull();
  });

  it('demands a whole number', () => {
    expect(checkCapacity('12.5')).toMatch(/whole number/u);
    expect(checkCapacity('a lot')).toMatch(/whole number/u);
  });

  it('rejects a capacity that is not a plausible headcount', () => {
    expect(checkCapacity('0')).toMatch(/at least 1/u);
    expect(checkCapacity('-5')).toMatch(/whole number/u);
    expect(checkCapacity('1000001')).toMatch(/1000000 or fewer/u);
    expect(checkCapacity('1000000')).toBeNull();
  });

  it('does not leak regex state between calls', () => {
    // A shared /g regex would carry `lastIndex` and let this second check slip
    // through after the first one consumed a match.
    expect(checkCapacity('12abc')).toMatch(/whole number/u);
    expect(checkCapacity('12')).toBeNull();
  });
});

describe('names', () => {
  it('accepts a person name from any script', () => {
    expect(checkPersonName('Jane Doe')).toBeNull();
    expect(checkPersonName("O'Brien")).toBeNull();
    expect(checkPersonName('अजय कुमार')).toBeNull();
  });

  it('requires a real name', () => {
    expect(checkPersonName('', 'Full legal name')).toBe('Full legal name is required.');
    expect(checkPersonName('J')).toMatch(/at least 2 characters/u);
  });

  it('rejects digits and symbols in a person name', () => {
    expect(checkPersonName('Jane <script>')).toMatch(/may only contain/u);
  });

  it('allows digits and registrar punctuation in an organisation name', () => {
    expect(checkEntityName('C1RCLE Events & Co.', 'organisation')).toBeNull();
    expect(checkEntityName('Studio 11', 'organisation')).toBeNull();
    expect(checkEntityName('C1RCLE <script>', 'organisation')).toMatch(/may only contain/u);
    expect(checkEntityName('Studio 11', 'person')).toMatch(/may only contain/u);
  });
});

describe('bounded text fields', () => {
  it('requires a city and bounds it', () => {
    expect(checkCity('')).toBe('Please select a city.');
    expect(checkCity('Pune')).toBeNull();
    expect(checkCity('P'.repeat(121))).toMatch(/120 characters or fewer/u);
  });

  it('leaves area and bio optional but bounded', () => {
    expect(checkArea('')).toBeNull();
    expect(checkBio('')).toBeNull();
    expect(checkArea('a'.repeat(121))).toMatch(/120 characters/u);
    expect(checkBio('a'.repeat(2001))).toMatch(/2000 characters/u);
  });
});

describe('Instagram handle', () => {
  it('strips the decoration applicants paste in', () => {
    expect(normalizeInstagramHandle('@C1RCLE')).toBe('c1rcle');
    expect(normalizeInstagramHandle('https://www.instagram.com/C1RCLE/')).toBe('c1rcle');
  });

  it('is optional, and validates when present', () => {
    expect(checkInstagramHandle('')).toBeNull();
    expect(checkInstagramHandle('@c1rcle')).toBeNull();
    expect(checkInstagramHandle('c 1rcle')).toMatch(/valid Instagram handle/u);
  });
});

/* ── Sanitizers ───────────────────────────────────────────────────────────── */

describe('sanitizers', () => {
  it('strips invisible characters that could hide a spoofed value', () => {
    // A zero-width joiner inside a name is invisible to the applicant but
    // survives a naive comparison server-side.
    expect(sanitizeText('C1RCLE\u200BLE', 200)).toBe('C1RCLE LE');
    expect(sanitizeText('C1RC\u202ELE', 200)).toBe('C1RC LE'); // bidi override
    expect(sanitizeText('C1RCLE\u0007', 200)).toBe('C1RCLE'); // control character
  });

  it('collapses whitespace and trims', () => {
    expect(sanitizeText('  C1RCLE   Events  ', 200)).toBe('C1RCLE Events');
  });

  it('caps at the length it is given', () => {
    expect(sanitizeText('abcdefghij', 4)).toBe('abcd');
  });

  it('folds newlines down to a space in the single-line variant', () => {
    expect(sanitizeText('line1\nline2', 200)).toBe('line1 line2');
    expect(sanitizeMultiline('line1\n\n\n\nline2', 200)).toBe('line1\n\nline2');
  });

  it('uppercases identifiers and drops everything that is not alphanumeric', () => {
    expect(sanitizeIdentifier('aaacb-1234 c', 10)).toBe('AAACB1234C');
    expect(sanitizeIdentifier('L17110MH1980PLC014121', 120)).toBe('L17110MH1980PLC014121');
  });
});
