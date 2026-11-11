import { describe, expect, it } from 'vitest';

import { verifyPhoneSchema } from './contracts/onboarding.js';

describe('verifyPhoneSchema', () => {
  it('requires an E.164 phone number and a provider token', () => {
    expect(
      verifyPhoneSchema.safeParse({ phoneNumber: '+14155552671', idToken: 'provider-token' })
        .success,
    ).toBe(true);
    expect(
      verifyPhoneSchema.safeParse({ phoneNumber: '4155552671', idToken: 'provider-token' }).success,
    ).toBe(false);
    expect(verifyPhoneSchema.safeParse({ phoneNumber: '+14155552671', idToken: '' }).success).toBe(
      false,
    );
  });
});
