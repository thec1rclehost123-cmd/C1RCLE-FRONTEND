import type { Brand } from './primitives.js';

export type UserId = Brand<string, 'UserId'>;

/**
 * Roles map to the three applications. The backend is the authority on what a
 * role may do — the frontend only uses this to decide what to render.
 */
export type Role = 'guest' | 'partner' | 'admin';

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly displayName: string;
  readonly role: Role;
  readonly avatarUrl: string | null;
}

export interface Session {
  readonly user: User;
  /** Unix epoch milliseconds. The backend owns the real expiry. */
  readonly expiresAt: number;
}
