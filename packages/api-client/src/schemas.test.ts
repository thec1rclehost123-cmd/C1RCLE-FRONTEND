import { describe, expect, it } from 'vitest';

import {
  roleSchema,
  userSchema,
  sessionSchema,
  pageInfoSchema,
  noContentSchema,
  eventDtoSchema,
  organizationDtoSchema,
  venueDtoSchema,
  authBridgeResponseSchema,
  loginRequestSchema,
  signupRequestSchema,
} from './schemas.js';

/* ─── roleSchema ─────────────────────────────────────────────────────────── */

describe('roleSchema', () => {
  it('accepts guest', () => {
    expect(roleSchema.safeParse('guest').success).toBe(true);
  });

  it('accepts partner', () => {
    expect(roleSchema.safeParse('partner').success).toBe(true);
  });

  it('accepts admin', () => {
    expect(roleSchema.safeParse('admin').success).toBe(true);
  });

  it('rejects unknown role', () => {
    expect(roleSchema.safeParse('superadmin').success).toBe(false);
  });

  it('rejects non-string', () => {
    expect(roleSchema.safeParse(3).success).toBe(false);
  });
});

/* ─── userSchema ─────────────────────────────────────────────────────────── */

const VALID_USER = {
  id: 'usr_1',
  email: 'partner@example.com',
  displayName: 'Sky Partner',
  role: 'partner',
  avatarUrl: null,
};

describe('userSchema', () => {
  it('accepts the canonical user', () => {
    expect(userSchema.safeParse(VALID_USER).success).toBe(true);
  });

  it('accepts an https avatar', () => {
    expect(
      userSchema.safeParse({ ...VALID_USER, avatarUrl: 'https://cdn.example.com/a.png' }).success,
    ).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(userSchema.safeParse({ ...VALID_USER, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a non-url avatar', () => {
    expect(userSchema.safeParse({ ...VALID_USER, avatarUrl: 'nope' }).success).toBe(false);
  });

  it('rejects a missing displayName', () => {
    expect(userSchema.safeParse({ ...VALID_USER, displayName: undefined }).success).toBe(false);
  });

  it('rejects an unknown role', () => {
    expect(userSchema.safeParse({ ...VALID_USER, role: 'owner' }).success).toBe(false);
  });
});

/* ─── sessionSchema ──────────────────────────────────────────────────────── */

describe('sessionSchema', () => {
  it('accepts user + epoch ms', () => {
    expect(
      sessionSchema.safeParse({ user: VALID_USER, expiresAt: 1_800_000_000_000 }).success,
    ).toBe(true);
  });

  it('rejects an ISO string expiry', () => {
    expect(
      sessionSchema.safeParse({ user: VALID_USER, expiresAt: '2026-08-11T00:00:00Z' }).success,
    ).toBe(false);
  });

  it('rejects a missing user', () => {
    expect(sessionSchema.safeParse({ expiresAt: 1 }).success).toBe(false);
  });
});

/* ─── pageInfoSchema ─────────────────────────────────────────────────────── */

const VALID_PAGE_INFO = { page: 1, pageSize: 20, total: 3, hasNextPage: false };

describe('pageInfoSchema', () => {
  it('accepts the canonical page info', () => {
    expect(pageInfoSchema.safeParse(VALID_PAGE_INFO).success).toBe(true);
  });

  it('rejects a missing hasNextPage', () => {
    expect(pageInfoSchema.safeParse({ page: 1, pageSize: 20, total: 3 }).success).toBe(false);
  });

  it('rejects a string page', () => {
    expect(pageInfoSchema.safeParse({ ...VALID_PAGE_INFO, page: '1' }).success).toBe(false);
  });
});

/* ─── noContentSchema ────────────────────────────────────────────────────── */

describe('noContentSchema', () => {
  it('accepts undefined (204, no body)', () => {
    expect(noContentSchema.safeParse(undefined).success).toBe(true);
  });

  it('rejects a body', () => {
    expect(noContentSchema.safeParse({}).success).toBe(false);
  });
});

/* ─── eventDtoSchema ─────────────────────────────────────────────────────── */

const VALID_EVENT = {
  id: 'evt_1',
  organizationId: 'org_1',
  venueId: 'ven_1',
  slug: 'summer-fiesta',
  title: 'Summer Fiesta',
  summary: 'A great event',
  description: 'Full description',
  imageUrl: 'https://cdn.example.com/event.png',
  startAt: '2026-08-15T18:00:00Z',
  endAt: '2026-08-16T02:00:00Z',
  status: 'draft',
  isPublic: false,
  tags: ['music'],
  startingPricePaise: 50000,
  isFree: false,
  cancellationReason: null,
  version: 1,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

describe('eventDtoSchema', () => {
  it('accepts a valid event', () => {
    expect(eventDtoSchema.safeParse(VALID_EVENT).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(eventDtoSchema.safeParse({ ...VALID_EVENT, status: 'invalid' }).success).toBe(false);
  });
});

/* ─── organizationDtoSchema ──────────────────────────────────────────────── */

const VALID_ORG = {
  id: 'org_1',
  name: 'Test Org',
  slug: 'test-org',
  role: 'owner',
  status: 'active',
  version: 1,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

describe('organizationDtoSchema', () => {
  it('accepts a valid organization', () => {
    expect(organizationDtoSchema.safeParse(VALID_ORG).success).toBe(true);
  });

  it('rejects invalid role', () => {
    expect(organizationDtoSchema.safeParse({ ...VALID_ORG, role: 'viewer' }).success).toBe(false);
  });
});

/* ─── venueDtoSchema ─────────────────────────────────────────────────────── */

const VALID_VENUE = {
  id: 'ven_1',
  organizationId: 'org_1',
  name: 'Test Venue',
  slug: 'test-venue',
  status: 'active',
  description: 'A venue',
  capacity: 500,
  city: 'Mumbai',
  version: 1,
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

describe('venueDtoSchema', () => {
  it('accepts a valid venue', () => {
    expect(venueDtoSchema.safeParse(VALID_VENUE).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(venueDtoSchema.safeParse({ ...VALID_VENUE, status: 'closed' }).success).toBe(false);
  });
});

/* ─── auth schemas ───────────────────────────────────────────────────────── */

describe('loginRequestSchema', () => {
  it('accepts valid login', () => {
    expect(loginRequestSchema.safeParse({ email: 'a@b.com', password: 'pass123' }).success).toBe(true);
  });

  it('rejects short password', () => {
    expect(loginRequestSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('signupRequestSchema', () => {
  it('accepts valid signup', () => {
    expect(
      signupRequestSchema.safeParse({
        email: 'a@b.com',
        password: 'longpassword',
        displayName: 'Test',
      }).success,
    ).toBe(true);
  });

  it('rejects short password', () => {
    expect(
      signupRequestSchema.safeParse({
        email: 'a@b.com',
        password: 'short',
        displayName: 'Test',
      }).success,
    ).toBe(false);
  });

  it('rejects missing displayName', () => {
    expect(
      signupRequestSchema.safeParse({
        email: 'a@b.com',
        password: 'longpassword',
      }).success,
    ).toBe(false);
  });
});

describe('authBridgeResponseSchema', () => {
  it('accepts valid auth response', () => {
    expect(
      authBridgeResponseSchema.safeParse({
        user: VALID_USER,
        accessToken: 'token123',
        expiresAt: 1_800_000_000_000,
      }).success,
    ).toBe(true);
  });
});
