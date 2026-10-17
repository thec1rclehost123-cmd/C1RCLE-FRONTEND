import { describe, expect, it } from 'vitest';

import {
  authBridgeResponseSchema,
  createTaxRuleSchema,
  enableTaxRuleSchema,
  reconciliationResultSchema,
  taxRuleDtoSchema,
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
        mustChangePassword: false,
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
      user: {
        id: 'u',
        email: 'a@b.com',
        displayName: 'A',
        role: 'partner',
        avatarUrl: null,
        mustChangePassword: false,
      },
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

  it('tax rule schemas accept a valid draft and reject out-of-range rates, bad dates and extras', () => {
    const draft = {
      kind: 'tds_194o',
      rateBps: 10,
      basis: 'net_payable_to_seller',
      effectiveFrom: '2026-04-01',
    };
    expect(createTaxRuleSchema.safeParse(draft).success).toBe(true);
    expect(createTaxRuleSchema.safeParse({ ...draft, rateBps: 10_001 }).success).toBe(false);
    expect(createTaxRuleSchema.safeParse({ ...draft, effectiveFrom: '1 April' }).success).toBe(
      false,
    );
    expect(createTaxRuleSchema.safeParse({ ...draft, extra: 1 }).success).toBe(false);
    expect(enableTaxRuleSchema.safeParse({ approvalRef: 'CA letter 5 Oct 2026' }).success).toBe(
      true,
    );
    expect(enableTaxRuleSchema.safeParse({ approvalRef: 'ok' }).success).toBe(false);
  });

  it('taxRuleDtoSchema accepts a draft with no approval yet', () => {
    expect(
      taxRuleDtoSchema.safeParse({
        id: 'rule_1',
        kind: 'ticket_gst',
        rateBps: 0,
        basis: 'ticket_price',
        effectiveFrom: '2026-04-01',
        effectiveTo: null,
        status: 'draft',
        approvalRef: null,
        notes: '',
        createdBy: 'admin_1',
        enabledBy: null,
        enabledAt: null,
        retiredBy: null,
        retiredAt: null,
        createdAt: '2026-10-11T10:00:00.000Z',
        updatedAt: '2026-10-11T10:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('reconciliationResultSchema accepts every finding and rejects an unknown one', () => {
    const base = { orderId: 'ord_1', paymentId: 'pay_1', reconciled: false, providerNetPaise: 100 };
    const findings = [
      { kind: 'provider_record_missing' },
      { kind: 'amount_mismatch', ourPaise: 1, providerPaise: 2 },
      { kind: 'currency_mismatch', ours: 'INR', provider: 'USD' },
      { kind: 'refund_mismatch', ourPaise: 0, providerPaise: 5 },
      { kind: 'open_dispute' },
    ];
    expect(reconciliationResultSchema.safeParse({ ...base, findings }).success).toBe(true);
    expect(
      reconciliationResultSchema.safeParse({ ...base, findings: [{ kind: 'made_up' }] }).success,
    ).toBe(false);
  });
});
