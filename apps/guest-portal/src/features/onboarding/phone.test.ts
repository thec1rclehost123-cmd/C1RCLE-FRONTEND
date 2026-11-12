import { describe, expect, it } from 'vitest';

import { phoneAuthErrorMessage } from './phone';

describe('phoneAuthErrorMessage', () => {
  it.each([
    ['auth/invalid-phone-number', 'Enter your phone number with its country code.'],
    ['auth/invalid-verification-code', 'That code is incorrect. Check it and try again.'],
    ['auth/code-expired', 'That code has expired. Request a new one.'],
    ['auth/too-many-requests', 'Too many attempts. Please wait before trying again.'],
    ['auth/network-request-failed', 'Network issue. Check your connection and try again.'],
  ])('maps %s to a safe message', (code, message) => {
    expect(phoneAuthErrorMessage({ code, message: 'secret provider detail' }, 'verify')).toBe(
      message,
    );
  });

  it('does not expose provider internals for unknown errors', () => {
    expect(phoneAuthErrorMessage(new Error('private details'), 'send')).toBe(
      'A verification code could not be sent. Please try again later.',
    );
  });
});
