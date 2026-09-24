'use client';

import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getAccessToken, login, logout, signup, useSession } from '@c1rcle/auth';

import { useOrgAccess } from '@/lib/access/use-org-access';
import { getMyOnboardingRequest } from '@/lib/onboarding/onboarding-repository';
import { getActiveOrgId, setActiveOrg } from '@/lib/org/active-org';
import { getOrganizations, getPartnerAccess } from '@/lib/org/org-repository';

import type { DashboardProfile, PartnerMembership, PartnerType, StaffRole } from '@/lib/rbac/types';
import type { OnboardingRequestDto } from '@c1rcle/contracts';
import type { ReactNode } from 'react';

/**
 * ─── Real wiring, legacy-shaped context ──────────────────────────────────────
 *
 * This file used to run entirely against a mock Firebase client
 * (`onAuthStateChanged`, `signInWithEmailAndPassword`, `/api/auth/me`'s
 * fixture route, …). It now reads the real session (`@c1rcle/auth`'s
 * `useSession`), the real org graph (`org-repository.ts`,
 * `use-org-access.ts` — same modules `staging`'s auth-foundation work
 * proved), and the real onboarding application
 * (`onboarding-repository.ts`). The `AuthContextValue` shape below is
 * unchanged on purpose — 46 files across this app read it, and none of them
 * need to know the data underneath moved from a Firebase mock to the real
 * gateway. Only the internals here changed.
 *
 * Two known, honest gaps (not silently patched over — see inline comments
 * at their state):
 *  - `isBanned` has no backend concept in V2 yet (V1's `users/{uid}.isBanned`
 *    never got ported) — always `false` until that exists.
 *  - `actionPermissions`/`canDo` were a fine-grained per-action staff
 *    permission map (`canEditEvent`, `canManageDoorMode`, …) that V2's RBAC
 *    doesn't have a server-side equivalent for yet (it has coarse
 *    org-role/permission strings, not per-UI-action booleans). `canDo`
 *    keeps its original formula — "no map set ⇒ allow" — which is exactly
 *    what already ran for every owner in the old code; the difference is
 *    non-owner staff now also get it, since there is nothing server-side to
 *    restrict them with yet. This is a UI-visibility hint only, not the
 *    authorization boundary — the gateway's own RBAC still enforces the
 *    real permission check on every write regardless of what a button shows.
 *
 * Also dropped, not silently kept broken: the old `mustChangePassword`
 * force-redirect (a staff-invite flow with no V2 backend field to read it
 * from — `profile.mustChangePassword` never had a real source even before
 * this rewrite) and `getCachedFirebaseIdToken` (replaced by
 * `@c1rcle/auth`'s in-memory `getAccessToken`, which needs no caching layer
 * of its own).
 */

interface AuthContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deliberate, unchanged from before this rewrite: `onboard/PageClient.tsx` and `verify/PageClient.tsx` still read Firebase-shaped `.uid`/`.getIdToken()` directly off this field (pre-existing Phase 7 migration gap, not introduced here). Real callers should use `@c1rcle/auth`'s `useSession()` directly instead of narrowing this field.
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
  /** Resolved tab visibility for non-OWNER staff; null means show all tabs */
  tabVisibility: Partial<Record<string, boolean>> | null;
  /** Resolved action permissions for non-OWNER staff; null means all allowed */
  actionPermissions: Partial<Record<string, boolean>> | null;
  /** Resolved PII policy for non-OWNER staff; null means full visibility */
  piiPolicy: Partial<Record<string, boolean>> | null;
  /** Coarse-grained permissions returned by the server for this role (e.g. VIEW_FINANCIALS) */
  grantedPermissions: string[];
  /** Returns true if the server has granted the given coarse permission for this membership */
  hasPermission: (permission: string) => boolean;
  /** Returns true if owner (null) or the specific action is permitted */
  canDo: (action: string) => boolean;
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
  const pathname = usePathname();
  const session = useSession();

  // Lazy initializer, not an effect: `getActiveOrgId()` already returns
  // `null` when `document` isn't available (SSR), so there is nothing an
  // effect would add here except an extra render.
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() => getActiveOrgId());
  const [memberships, setMemberships] = useState<PartnerMembership[]>([]);
  const [onboardingRequest, setOnboardingRequest] = useState<OnboardingRequestDto | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const orgAccess = useOrgAccess(activeOrgId);

  useEffect(() => {
    // A mutable object property, not a plain `let` — TypeScript narrows a
    // bare `let cancelled = false` to a constant `false` within this
    // closure (it cannot see the mutation the returned cleanup performs
    // asynchronously), which makes every `if (cancelled)` check downstream
    // read as dead code to the linter even though it is the actual
    // unmount-race guard. A property on an object isn't narrowed the same
    // way, so the checks below are real.
    const lifecycle = { cancelled: false };

    // The whole body runs inside this async function (never directly in the
    // effect) so every `setState` call happens from a microtask continuation,
    // not synchronously during the effect's own invocation.
    async function loadAccountData() {
      if (session.isLoading) return;
      const currentUser = session.user;
      if (!session.isAuthenticated || !currentUser) {
        setMemberships([]);
        setOnboardingRequest(null);
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        const [orgs, request] = await Promise.all([getOrganizations(), getMyOnboardingRequest()]);
        if (lifecycle.cancelled) return;

        const resolved = await Promise.all(
          orgs.map(async (org): Promise<PartnerMembership | null> => {
            try {
              const access = await getPartnerAccess(org.id);
              return {
                uid: currentUser.id,
                partnerId: org.id,
                partnerType: access.partnerType as PartnerType,
                role: toStaffRole(org.role),
                isActive: org.id === activeOrgId,
                partnerName: org.name,
              };
            } catch {
              // A member the caller can list but not yet resolve access for
              // (e.g. a suspended org) is dropped from the switcher rather
              // than shown broken.
              return null;
            }
          }),
        );
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- real unmount-race guard; the linter can't see the cleanup function's mutation of `lifecycle.cancelled` from here.
        if (lifecycle.cancelled) return;

        const resolvedMemberships = resolved.filter((m): m is PartnerMembership => m !== null);
        setMemberships(resolvedMemberships);
        setOnboardingRequest(request);

        // First login, single org, no active-org cookie yet — pick it rather
        // than force a one-item picker. Multiple orgs or zero orgs are left
        // for the user (or the existing select-organization redirect) to
        // resolve explicitly.
        const [only, ...rest] = resolvedMemberships;
        if (!activeOrgId && only && rest.length === 0) {
          await setActiveOrg(only.partnerId);
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- real unmount-race guard; see the comment on `lifecycle` above.
          if (!lifecycle.cancelled) setActiveOrgIdState(only.partnerId);
        }
      } catch {
        if (!lifecycle.cancelled) {
          setMemberships([]);
          setOnboardingRequest(null);
        }
      } finally {
        if (!lifecycle.cancelled) setDataLoading(false);
      }
    }

    void loadAccountData();
    return () => {
      lifecycle.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeOrgId is read, not a trigger; re-running per active-org change would refetch the whole membership list for no reason.
  }, [session.isLoading, session.isAuthenticated, session.user?.id]);

  const isApproved = onboardingRequest?.status === 'approved';
  // No `isBanned` concept exists in V2 yet — see the file-level comment.
  const isBanned = false;
  const onboardingStatus = onboardingRequest?.status ?? null;
  // No distinct KYC status separate from the overall application status
  // exists server-side yet — same value, kept as a separate field because
  // 7 call sites already read `kycStatus` specifically.
  const kycStatus = onboardingRequest?.status ?? null;
  const entityType = onboardingRequest?.profile.entityType ?? null;
  const subscriptionPlan = onboardingRequest?.plan ?? null;

  const signIn = useCallback(async (email: string, password: string) => {
    await login({ email, password });
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    await signup({ email, password, displayName });
  }, []);

  const signInWithGoogle = useCallback(
    () => Promise.reject(new Error('Google sign-in is not supported on the V2 API.')),
    [],
  );

  const signOut = useCallback(async () => {
    await logout();
  }, []);

  const switchPartner = useCallback(async (partnerId: string) => {
    await setActiveOrg(partnerId);
    window.location.reload();
  }, []);

  const canDo = useCallback(
    // See the file-level comment: no per-action staff permission map exists
    // server-side yet, so this always evaluates the "unrestricted" branch.
    (_action: string) => true,
    [],
  );

  const getIdToken = useCallback(() => Promise.resolve(getAccessToken() ?? ''), []);

  const hasPermission = useCallback(
    (permission: string) => orgAccess.hasPermission(permission),
    [orgAccess],
  );

  const loading = session.isLoading || (session.isAuthenticated && dataLoading);

  const authContextValue = useMemo<AuthContextValue>(() => {
    const activeMembership: PartnerMembership | null =
      activeOrgId && orgAccess.partnerType && session.user
        ? {
            uid: session.user.id,
            partnerId: activeOrgId,
            partnerType: orgAccess.partnerType as PartnerType,
            role: toStaffRole(orgAccess.role ?? 'member'),
            isActive: true,
          }
        : null;

    const profile: DashboardProfile | null = session.user
      ? {
          uid: session.user.id,
          email: session.user.email,
          displayName: session.user.displayName,
          activeMembership,
        }
      : null;

    return {
      user: session.user,
      profile,
      memberships,
      loading,
      isApproved,
      isBanned,
      isPartnerSuspended: orgAccess.isSuspended,
      onboardingStatus,
      kycStatus,
      entityType,
      subscriptionPlan,
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
    };
  }, [
    activeOrgId,
    session.user,
    orgAccess.partnerType,
    orgAccess.role,
    orgAccess.isSuspended,
    orgAccess.tabVisibility,
    orgAccess.permissions,
    memberships,
    loading,
    isApproved,
    isBanned,
    onboardingStatus,
    kycStatus,
    entityType,
    subscriptionPlan,
    hasPermission,
    canDo,
    getIdToken,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    switchPartner,
  ]);

  const isBypassPath = pathname
    ? pathname.startsWith('/onboard') || pathname.startsWith('/login')
    : false;

  if (loading && !isBypassPath) {
    return (
      <div className="partner-v3-auth-loading" role="status" aria-live="polite">
        <div className="partner-v3-spinner" aria-hidden="true" />
        <p>Authorizing Access</p>
      </div>
    );
  }

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useDashboardAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useDashboardAuth must be used within DashboardAuthProvider');
  }
  return context;
}
