/**
 * Staff session: the 7-day, refreshable credential. Access token lives in
 * memory ONLY — never SecureStore, never AsyncStorage, per the contract
 * (`docs/api-contracts/scanner-app.md` §1). Losing it on app restart is
 * correct, not a bug: the app re-derives it via a refresh flow (Phase 0
 * open question — see `docs/scanner-app/06-v1-vs-v2-and-rollout.md`) or
 * falls back to the login screen.
 */

export interface StaffUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly role: string;
}

interface StaffAuthState {
  accessToken: string | null;
  organizationId: string | null;
  user: StaffUser | null;
  expiresAt: number | null;
}

const state: StaffAuthState = {
  accessToken: null,
  organizationId: null,
  user: null,
  expiresAt: null,
};

export function setStaffSession(input: {
  accessToken: string;
  organizationId: string;
  user: StaffUser;
  expiresAt: number;
}): void {
  state.accessToken = input.accessToken;
  state.organizationId = input.organizationId;
  state.user = input.user;
  state.expiresAt = input.expiresAt;
}

export function clearStaffSession(): void {
  state.accessToken = null;
  state.organizationId = null;
  state.user = null;
  state.expiresAt = null;
}

export function getStaffAccessToken(): string | null {
  return state.accessToken;
}

export function getOrganizationId(): string | null {
  return state.organizationId;
}

export function getStaffUser(): StaffUser | null {
  return state.user;
}

export function isStaffSessionActive(): boolean {
  return state.accessToken !== null && state.expiresAt !== null && state.expiresAt > Date.now();
}

/**
 * Mirrors the backend's `ticket.override` RBAC rule
 * (`apps/api-gateway/src/plugins/rbac.ts`: every role except `member`
 * holds it) — for gating the override/manual-check-in buttons only. This
 * is NOT a security boundary: the server holds and enforces the real
 * permission and returns 403 regardless of what this predicate says.
 * Getting this wrong shows or hides a button; it can never grant access.
 */
export function canOverride(role: string | undefined): boolean {
  return role !== undefined && role !== 'member';
}
