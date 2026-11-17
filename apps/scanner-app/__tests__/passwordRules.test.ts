import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  newPasswordProblem,
} from '../src/auth/passwordRules';

const TEMP = 'Tmp8chrs';

function check(newPassword: string, confirmation = newPassword): string | null {
  return newPasswordProblem({ temporaryPassword: TEMP, newPassword, confirmation });
}

describe('newPasswordProblem', () => {
  it('accepts a password within the gateway bounds that is new and confirmed', () => {
    expect(check('doorkeeper-99')).toBeNull();
    expect(check('x'.repeat(MIN_PASSWORD_LENGTH))).toBeNull();
    expect(check('x'.repeat(MAX_PASSWORD_LENGTH))).toBeNull();
  });

  it('rejects anything shorter than the minimum', () => {
    expect(check('short')).toMatch(/at least 8/);
    expect(check('x'.repeat(MIN_PASSWORD_LENGTH - 1))).toMatch(/at least 8/);
  });

  it('rejects anything longer than the maximum', () => {
    expect(check('x'.repeat(MAX_PASSWORD_LENGTH + 1))).toMatch(/at most 128/);
  });

  it('refuses to keep the temporary password', () => {
    expect(check(TEMP)).toMatch(/different from your temporary/);
  });

  it('requires the confirmation to match', () => {
    expect(check('doorkeeper-99', 'doorkeeper-98')).toMatch(/do not match/);
  });

  it('reports the most basic problem first', () => {
    // Too short AND mismatched: the length message wins.
    expect(check('abc', 'xyz')).toMatch(/at least 8/);
  });
});
