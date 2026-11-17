/**
 * Rules for the password a new staff member chooses on first sign-in.
 *
 * The gateway's `changePasswordSchema` accepts 8 to 128 characters; these
 * checks mirror that so the person hears about a problem on the handset
 * instead of after a round trip. They are a convenience only: the gateway
 * remains the authority and re-validates everything.
 *
 * Kept free of React and of the API client so it can be tested on its own.
 */

/** Same bounds as the gateway's `changePasswordSchema.newPassword`. */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export interface NewPasswordInput {
  /** The temporary password they just signed in with. */
  readonly temporaryPassword: string;
  readonly newPassword: string;
  readonly confirmation: string;
}

/** First problem found, in the order a person would want to fix them; null when fine. */
export function newPasswordProblem(input: NewPasswordInput): string | null {
  const { temporaryPassword, newPassword, confirmation } = input;
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${String(MIN_PASSWORD_LENGTH)} characters.`;
  }
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return `Use at most ${String(MAX_PASSWORD_LENGTH)} characters.`;
  }
  if (newPassword === temporaryPassword) {
    return 'Choose a password that is different from your temporary one.';
  }
  if (newPassword !== confirmation) {
    return 'The two passwords do not match.';
  }
  return null;
}
