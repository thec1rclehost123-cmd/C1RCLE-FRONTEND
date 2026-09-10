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

interface AuthContextValue {
  /*
   * Deliberately loose: onboard/PageClient.tsx and verify/PageClient.tsx (both pre-Phase-7,
   * unmigrated) still read Firebase-shaped fields (`.uid`, `.getIdToken()`) off `user` that
   * don't exist on the real `User` DTO from @c1rcle/contracts. Narrowing this breaks their
   * typecheck; that migration is Phase 7 (onboard rebuild + verify deletion), out of scope here.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  profile: DashboardProfile | null;
  memberships: PartnerMembership[];
  loading: boolean;
  isApproved: boolean;
  isBanned: boolean;
  isPartnerSuspended: boolean;
  onboardingStatus: string | null;
  kycStatus: string | null;
  entityType: string | null;
  subscriptionPlan: string | null;
  /** Resolved tab visibility; null means show all tabs */
  tabVisibility: Partial<Record<string, boolean>> | null;
  /** Resolved action permissions; null means all allowed */
  actionPermissions: Partial<Record<string, boolean>> | null;
  /** Resolved PII policy; null means full visibility */
  piiPolicy: Partial<Record<string, boolean>> | null;
  /** Permissions returned by the server for this role */
  grantedPermissions: string[];
  /** Returns true if the server has granted the given permission for this membership */
  hasPermission: (permission: string) => boolean;
  /** Returns true if owner (null) or the specific action is permitted */
  canDo: (action: string) => boolean;
  /** Returns the current access token, or empty string if not signed in */
  /** Returns the current access token, or empty string if not signed in */
  getIdToken: () => Promise<string>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  switchPartner: (partnerId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** V2's org roles are `owner|admin|manager|member`; the frontend's staff-role
 * vocabulary has no `member` — `staff` is the closest existing label. */
function toStaffRole(role: string): StaffRole {
  return role === 'member' ? 'staff' : (role as StaffRole);
}

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const sessionState = useSessionStore();
  const activeOrgId = getActiveOrgId();
  const orgAccess = useOrgAccess(activeOrgId);

  const loading = sessionState.status === 'unknown' || orgAccess.isLoading;
  const user = sessionState.session?.user ?? null;

  const isApproved = activeOrgId !== null || user !== null;
  const isPartnerSuspended = orgAccess.isSuspended;

  const signIn = useCallback(async (email: string, password: string) => {
    await login({ email, password });
    await login({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    await signup({ email, password, displayName });
    await signup({ email, password, displayName });
  }, []);

  const signInWithGoogle = useCallback((): Promise<void> => {
    return Promise.reject(new Error('Google sign-in is not supported on V2 API'));
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    await logout();
  }, []);

  const switchPartner = useCallback(async (partnerId: string) => {
    await setActiveOrg(partnerId);
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
            // Not sourced from the API — `GET /organizations/:id/access` carries no join
            // date, and nothing downstream reads this field. `0` is an honest "unknown"
            // rather than a fabricated timestamp (also keeps this memo pure).
            joinedAt: 0,
            isActive: true,
          }
        : null,
      mustChangePassword: false,
    };
  }, [user, activeOrgId, orgAccess.partnerType, orgAccess.role]);

  const authContextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      memberships: activeOrgId && profile?.activeMembership ? [profile.activeMembership] : [],
      loading,
      isApproved,
      isBanned: false,
      isPartnerSuspended,
      onboardingStatus: null,
      kycStatus: null,
      entityType: null,
      subscriptionPlan: 'basic',
      tabVisibility: orgAccess.tabVisibility,
      actionPermissions: null,
      piiPolicy: null,
      grantedPermissions: orgAccess.permissions,
      hasPermission,
      canDo,
      getIdToken,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      switchPartner,
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
      signInWithGoogle,
      signOut,
      switchPartner,
    ],
  );

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useDashboardAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useDashboardAuth must be used within DashboardAuthProvider');
  }
  return context;
}
