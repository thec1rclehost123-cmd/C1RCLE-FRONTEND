import { describe, expect, it } from 'vitest';

import {
  authBridgeResponseSchema,
  onboardingProfileSchema,
  partnerAccessDtoSchema,
  sessionSchema,
} from '../src/client.js';

/**
 * Smoke test for the generated `@c1rcle/contracts` mirror. Behavioural parity
 * against the backend copy is enforced separately by
 * `C1RCLE-BACKEND/scripts/contract-parity.mjs`.
 */
describe('@c1rcle/contracts (generated mirror)', () => {
  it('authBridgeResponseSchema accepts an epoch-ms expiry and rejects an ISO string', () => {
    const base = {
      user: {
        id: 'usr_1',
        email: 'a@b.com',
        displayName: 'A',
        role: 'partner',
        avatarUrl: null,
      },
      accessToken: 'tok',
    };
    expect(
      authBridgeResponseSchema.safeParse({ ...base, expiresAt: 1_800_000_000_000 }).success,
    ).toBe(true);
    expect(
      authBridgeResponseSchema.safeParse({ ...base, expiresAt: '2026-08-29T00:00:00Z' }).success,
    ).toBe(false);
  });

  it('sessionSchema is { user, expiresAt } with no wrapper', () => {
    const parsed = sessionSchema.safeParse({
      user: { id: 'u', email: 'a@b.com', displayName: 'A', role: 'partner', avatarUrl: null },
      expiresAt: 1_800_000_000_000,
    });
    expect(parsed.success).toBe(true);
  });

  it('onboardingProfileSchema requires the 4 core fields and rejects unknown keys', () => {
    const ok = {
      legalName: 'X',
      contactPerson: 'Y',
      phone: '9999999999',
      city: 'Pune',
    };
    expect(onboardingProfileSchema.safeParse(ok).success).toBe(true);
    expect(onboardingProfileSchema.safeParse({ ...ok, role: 'owner' }).success).toBe(false);
    expect(onboardingProfileSchema.safeParse({ legalName: 'X' }).success).toBe(false);
  });

  it('partnerAccessDtoSchema accepts a null tabVisibility', () => {
    const parsed = partnerAccessDtoSchema.safeParse({
      organizationId: 'org_1',
      userId: 'usr_1',
      partnerType: 'venue',
      role: 'OWNER',
      permissions: ['VIEW_FINANCIALS'],
      tabVisibility: null,
    });
    expect(parsed.success).toBe(true);
  });
});
