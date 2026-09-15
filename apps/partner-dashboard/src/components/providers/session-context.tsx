'use client';

import { createContext, useCallback, useContext, useMemo } from 'react';

import { useSessionStore, login, signup, logout, getAccessToken } from '@c1rcle/auth';

import { useOrgAccess } from '@/lib/access/use-org-access';
import { getActiveOrgId, setActiveOrg } from '@/lib/org/active-org';

import type { DashboardProfile, PartnerMembership, PartnerType, StaffRole } from '@/lib/rbac/types';
import type { ReactNode } from 'react';

const PARTNER_TYPES: readonly PartnerType[] = ['venue', 'host', 'promoter', 'club'];
const STAFF_ROLES: readonly StaffRole[] = ['owner', 'admin', 'manager', 'staff', 'promoter'];

function toPartnerType(value: string | null): PartnerType {
  return (PARTNER_TYPES as readonly string[]).includes(value ?? '')
    ? (value as PartnerType)
    : 'venue';
}

function toStaffRole(value: string | null): StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value ?? '') ? (value as StaffRole) : 'owner';
}

interface SessionAuthContextValue {
  /*
   * Deliberately loose: a handful of legacy consumers still read Firebase-shaped
   * fields (`.uid`) off `user`. Narrowing this to the real `User` DTO from
   * @c1rcle/contracts is tracked as separate debt; the V2 screens (login, signup,
   * onboard) use `useSession()` directly instead.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  profile: DashboardProfile | null;
  memberships: PartnerMembership[];
  loading: boolean;
  /** True when there is a usable session (an active organization or at least a signed-in user). */
  isApproved: boolean;
  isPartnerSuspended: boolean;
  /**
   * Linkage from the pre-Phase-7 `DashboardAuthProvider` surface. The V2 auth
   * user carries no onboarding status — the wizard reads it via
   * `GET /api/bff/onboarding/me` — so this is always `null`, and the login
   * page (still unmigrated) falls back to its generic "no partner access"
   * message. Narrowing the type and dropping the field is tracked with the
   * login-page migration.
   */
  onboardingStatus: string | null;
  /** Resolved tab visibility; null means show all tabs */
  tabVisibility: Partial<Record<string, boolean>> | null;
  /** Permissions returned by the server for this membership */
  grantedPermissions: string[];
  /** Returns true if the server has granted the given permission for this membership */
  hasPermission: (permission: string) => boolean;
  /** Returns true if owner (null) or the specific action is permitted */
  canDo: (action: string) => boolean;
  /** Returns the current access token, or empty string if not signed in */
  getIdToken: () => Promise<string>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchPartner: (partnerId: string) => Promise<void>;
  /**
   * Linkage from the pre-Phase-7 surface. The V2 auth has no Google identity
   * provider, so this always rejects — the legacy login page's Google button
   * surfaces the error until that page is migrated too.
   */
  signInWithGoogle: () => Promise<void>;
}

const SessionAuthContext = createContext<SessionAuthContextValue | undefined>(undefined);

/**
 * Re-homed dashboard auth context (formerly `DashboardAuthProvider`).
 *
 * Provides the richer, app-level signal used by the studio components on top of
 * the raw `@c1rcle/auth` session store and the `useOrgAccess` permission model.
 * The `useDashboardAuth` alias is kept for backwards compatibility with the
 * ~40 legacy consumers imported against the old module path.
 */
export function SessionAuthProvider({ children }: { children: ReactNode }) {
  const sessionState = useSessionStore();
  const activeOrgId = getActiveOrgId();
  const orgAccess = useOrgAccess(activeOrgId);

  const loading = sessionState.status === 'unknown' || orgAccess.isLoading;
  const user = sessionState.session?.user ?? null;

  /*
   * Foundation-branch semantics (kept for the unmigrated login page, whose
   * post-login redirect keys off `isApproved`): true when there is *any*
   * usable session — an active organization OR a signed-in user without an
   * active-org cookie yet. Dashboard guards do not rely on this alone; they
   * additionally require an active role/membership, which stays null until an
   * org is activated.
   */
  const isApproved = activeOrgId !== null || user !== null;
  const isPartnerSuspended = orgAccess.isSuspended;

  const signIn = useCallback(async (email: string, password: string) => {
    await login({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    await signup({ email, password, displayName });
  }, []);

  const signOut = useCallback(async () => {
    await logout();
  }, []);

  const switchPartner = useCallback(async (partnerId: string) => {
    await setActiveOrg(partnerId);
  }, []);

  const signInWithGoogle = useCallback((): Promise<void> => {
    return Promise.reject(new Error('Google sign-in is not supported on the V2 API'));
  }, []);

  const getIdToken = useCallback((): Promise<string> => {
    return Promise.resolve(getAccessToken() ?? '');
  }, []);

  const hasPermission = useCallback(
    (permission: string) => orgAccess.hasPermission(permission),
    [orgAccess],
  );

  const canDo = useCallback(
    (action: string) => orgAccess.hasPermission(action),
    [orgAccess],
  );

  const profile = useMemo<DashboardProfile | null>(() => {
    if (!user) return null;
    return {
      uid: user.id,
      email: user.email,
      displayName: user.displayName || 'User',
      activeMembership: activeOrgId
        ? {
            uid: user.id,
            partnerId: activeOrgId,
            partnerType: toPartnerType(orgAccess.partnerType),
            role: toStaffRole(orgAccess.role),
            joinedAt: 0,
            isActive: true,
          }
        : null,
    };
  }, [user, activeOrgId, orgAccess.partnerType, orgAccess.role]);

  const authContextValue = useMemo<SessionAuthContextValue>(
    () => ({
      user,
      profile,
      memberships: activeOrgId && profile?.activeMembership ? [profile.activeMembership] : [],
      loading,
      isApproved,
      isPartnerSuspended,
      onboardingStatus: null,
      tabVisibility: orgAccess.tabVisibility,
      grantedPermissions: orgAccess.permissions,
      hasPermission,
      canDo,
      getIdToken,
      signIn,
      signUp,
      signOut,
      switchPartner,
      signInWithGoogle,
    }),
    [
      user,
      profile,
      activeOrgId,
      loading,
      isApproved,
      isPartnerSuspended,
      orgAccess.tabVisibility,
      orgAccess.permissions,
      hasPermission,
      canDo,
      getIdToken,
      signIn,
      signUp,
      signOut,
      switchPartner,
      signInWithGoogle,
    ],
  );

  return <SessionAuthContext.Provider value={authContextValue}>{children}</SessionAuthContext.Provider>;
}

export function useSessionContext() {
  const context = useContext(SessionAuthContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within SessionAuthProvider');
  }
  return context;
}

export function useDashboardAuth() {
  const context = useContext(SessionAuthContext);
  if (context === undefined) {
    throw new Error('useDashboardAuth must be used within SessionAuthProvider');
  }
  return context;
}
