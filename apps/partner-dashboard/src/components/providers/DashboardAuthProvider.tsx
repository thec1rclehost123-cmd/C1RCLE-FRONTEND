'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { getAuthClient, getAccessToken } from '@c1rcle/auth';
import type { AuthClient, AuthUser } from '@c1rcle/auth';
import type { DashboardProfile, PartnerMembership, PartnerType, StaffRole } from '@/lib/rbac/types';

// V2 gateway endpoints (see API_V2_ROUTE_MANIFEST.csv). PARTNER_CONTEXT_ENDPOINT
// has no live v2 route yet (contract gap flagged to backend) — failures degrade
// gracefully to default permissions until the route ships.
const ME_ENDPOINT = '/api/v2/auth/session';
const PARTNER_CONTEXT_ENDPOINT = '/api/v2/partner/context';

// ── Atomic permissions object — always set together to avoid race conditions ──
interface PermissionsState {
  tabVisibility: Partial<Record<string, boolean>> | null;
  actionPermissions: Partial<Record<string, boolean>> | null;
  piiPolicy: Partial<Record<string, boolean>> | null;
}

const EMPTY_PERMISSIONS: PermissionsState = {
  tabVisibility: null,
  actionPermissions: null,
  piiPolicy: null,
};

interface MeActiveMembership {
  partnerId: string;
  partnerType: PartnerType;
  role: StaffRole;
  joinedAt: number;
  isActive: boolean;
  partnerName?: string;
  membershipId?: string;
}

interface MeApiResponse {
  user: {
    uid: string;
    email: string;
    displayName?: string;
    username?: string;
    isApproved?: boolean;
    isBanned?: boolean;
    kycStatus?: string;
    onboardingEntityType?: string;
    subscriptionPlan?: string;
    tier?: string;
    // May be present here (injected by gateway) OR at the top-level activeMembership field.
    activeMembership?: MeActiveMembership;
    _staffTabVisibility?: Record<string, boolean>;
    _staffActionPermissions?: Record<string, boolean>;
    _staffPiiPolicy?: Record<string, boolean>;
    mustChangePassword?: boolean;
  } | null;
  // Gateway puts activeMembership here when loadMemberships succeeds.
  activeMembership?: MeActiveMembership | null;
  // buildGuestAuthBootstrap nests onboardingRequest inside onboarding.
  onboarding?: {
    onboardingRequest?: {
      status: string;
      type?: string;
    } | null;
  } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: DashboardProfile | null;
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

export function DashboardAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const authClient: AuthClient = getAuthClient();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isPartnerSuspended, setIsPartnerSuspended] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  // Atomic permissions — always updated together to prevent mid-render inconsistency
  const [permissions, setPermissions] = useState<PermissionsState>(EMPTY_PERMISSIONS);
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>([]);
  const [serverDefaultTabVisibility, setServerDefaultTabVisibility] = useState<Partial<
    Record<string, boolean>
  > | null>(null);
  // membershipId for periodic permission refresh (staff only)
  const [membershipId, setMembershipId] = useState<string | null>(null);
  const lastProfileFetchRef = useRef<number>(0);

  useEffect(() => {
    if (!loading && user && profile?.mustChangePassword) {
      const isDashboardPath = pathname
        ? pathname.startsWith('/venue') ||
          pathname.startsWith('/host') ||
          pathname.startsWith('/promoter') ||
          pathname === '/'
        : false;

      if (isDashboardPath && pathname !== '/auth/change-password') {
        router.replace('/auth/change-password');
      }
    }
  }, [loading, user, profile, pathname, router]);

  // V2 Auth state listener - replaces Firebase onAuthStateChanged
  useEffect(() => {
    const unsubscribe = authClient.onAuthStateChanged((authUser: AuthUser | null) => {
      setUser(authUser);
      if (!authUser) {
        setProfile(null);
        setIsApproved(false);
        setIsBanned(false);
        setIsPartnerSuspended(false);
        setOnboardingStatus(null);
        setKycStatus(null);
        setEntityType(null);
        setSubscriptionPlan(null);
        setPermissions(EMPTY_PERMISSIONS);
        setGrantedPermissions([]);
        setServerDefaultTabVisibility(null);
        setMembershipId(null);
        setLoading(false);
      } else {
        // A new user just signed in. Immediately clear any stale profile
        // data from the previous account and gate all guards with loading=true.
        // Without this, Account A's profile stays visible while Account B's
        // /api/auth/me fetch is in-flight — causing the wrong account to render.
        setProfile(null);
        setIsApproved(false);
        setIsBanned(false);
        setIsPartnerSuspended(false);
        setPermissions(EMPTY_PERMISSIONS);
        setLoading(true);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;

    // Reset loading to true BEFORE the async fetch so that any guard
    // (login page useEffect, RoleGuard, etc.) sees authLoading=true and
    // doesn't act on stale isApproved=false while we're still fetching.
    setLoading(true);

    // AbortController cancels in-flight fetches when the user changes.
    const controller = new AbortController();

    const fetchUserData = async () => {
      try {
        const data = await apiClient.get<MeApiResponse>(ME_ENDPOINT, {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        const userData = data.user;
        const onboardingRequest = data.onboarding?.onboardingRequest || null;

        if (!userData) {
          if (!controller.signal.aborted) setLoading(false);
          return;
        }

        // V2 Phase 0 session carries no approval field — absence means the
        // backend has no approval gate yet (role 'partner' is server-set at
        // signup). An explicit value always wins once the contract grows it.
        const approvedByDoc = userData.isApproved ?? true;
        setIsApproved(approvedByDoc);
        setIsBanned(userData.isBanned || false);

        if (!approvedByDoc) {
          if (onboardingRequest) {
            setOnboardingStatus(onboardingRequest.status);
          } else {
            // V2 session carries no onboarding block — derive it from the
            // live onboarding service until the session contract grows it.
            apiClient
              .get('/api/v2/onboarding/me', { signal: controller.signal })
              .then((r: any) => {
                const req = r?.request ?? null;
                if (req && !controller.signal.aborted) setOnboardingStatus(req.status);
              })
              .catch(() => {});
          }
        } else {
          setOnboardingStatus(null);
        }

        setKycStatus(userData.kycStatus ?? null);
        setEntityType(userData.onboardingEntityType ?? null);

        let activeMembership: PartnerMembership | null = null;

        // activeMembership may live in data.user.activeMembership (injected by gateway)
        // OR at data.activeMembership (top-level) — check both for resilience.
        const rawMembership = userData.activeMembership || data.activeMembership || null;

        if (rawMembership) {
          activeMembership = {
            uid: user.id,
            partnerId: rawMembership.partnerId,
            partnerType: rawMembership.partnerType === 'club' ? 'venue' : rawMembership.partnerType,
            role: rawMembership.role,
            joinedAt: rawMembership.joinedAt,
            isActive: rawMembership.isActive,
            partnerName: rawMembership.partnerName || undefined,
          };
        }

        if (approvedByDoc && activeMembership) {
          const plan = userData.subscriptionPlan || userData.tier || 'basic';
          setSubscriptionPlan(plan);

          // Fetch server-computed coarse permissions and default tab visibility.
          // Must happen server-side — frontend never derives permissions from role.
          apiClient
            .get(PARTNER_CONTEXT_ENDPOINT, { signal: controller.signal })
            .then((ctx: any) => {
              if (ctx && !controller.signal.aborted) {
                const payload = ctx.data || ctx;
                setGrantedPermissions(payload.permissions ?? []);
                setServerDefaultTabVisibility(payload.tabVisibility ?? null);
                setIsPartnerSuspended(payload.isSuspended ?? false);
              }
            })
            .catch(() => {});
        }

        // Set permissions atomically — all three fields in a single state update
        setPermissions({
          tabVisibility: userData._staffTabVisibility ?? null,
          actionPermissions: userData._staffActionPermissions ?? null,
          piiPolicy: userData._staffPiiPolicy ?? null,
        });

        // Capture membershipId for periodic staff-permission refresh
        setMembershipId(userData.activeMembership?.membershipId ?? null);

        setProfile({
          uid: user.id,
          email: user.email || '',
          displayName: userData.displayName || userData.username || 'User',
          activeMembership,
          mustChangePassword: userData.mustChangePassword ?? false,
        });
        lastProfileFetchRef.current = Date.now();
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // expected — user changed mid-fetch
        console.error('Error fetching user data in auth provider:', err);
        if (!controller.signal.aborted) setLoading(false);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchUserData();

    // Cancel any in-flight request when user changes or component unmounts
    return () => controller.abort();
  }, [user]);

  // Re-fetch profile when tab becomes visible after 60s — ensures staff see
  // updated permissions after the venue owner reassigns their access profile.
  useEffect(() => {
    if (!user) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastProfileFetchRef.current;
        if (elapsed > 60 * 1000) {
          apiClient
            .get<MeApiResponse>(ME_ENDPOINT)
            .then((data) => {
              if (!data?.user) return;
              const userData = data.user;
              // Atomic update — all three permissions together
              setPermissions({
                tabVisibility: userData._staffTabVisibility ?? null,
                actionPermissions: userData._staffActionPermissions ?? null,
                piiPolicy: userData._staffPiiPolicy ?? null,
              });
              lastProfileFetchRef.current = Date.now();
            })
            .catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  // Permission sync via authenticated gateway polling. This preserves the
  // staff-permission refresh path without direct Firestore access in the browser.
  useEffect(() => {
    if (!user || !membershipId) return;
    let cancelled = false;

    const syncPermissions = async () => {
      try {
        const data = await apiClient.get<MeApiResponse>(ME_ENDPOINT);
        if (cancelled || !data?.user) return;
        const userData = data.user;
        const newTabVisibility = userData._staffTabVisibility ?? null;
        const newActionPermissions = userData._staffActionPermissions ?? null;
        const newPiiPolicy = userData._staffPiiPolicy ?? null;
        // Only update state if something actually changed — avoids context re-renders
        // on every 30s poll when permissions haven't changed (new object === re-render).
        setPermissions((prev) => {
          if (
            JSON.stringify(prev.tabVisibility) === JSON.stringify(newTabVisibility) &&
            JSON.stringify(prev.actionPermissions) === JSON.stringify(newActionPermissions) &&
            JSON.stringify(prev.piiPolicy) === JSON.stringify(newPiiPolicy)
          ) {
            return prev; // same reference → no re-render
          }
          return {
            tabVisibility: newTabVisibility,
            actionPermissions: newActionPermissions,
            piiPolicy: newPiiPolicy,
          };
        });
        const newMembershipId = userData.activeMembership?.membershipId ?? membershipId;
        if (newMembershipId !== membershipId) {
          setMembershipId(newMembershipId);
        }
        lastProfileFetchRef.current = Date.now();
      } catch (err) {
        console.error('Error refreshing staff permissions:', err);
      }
    };

    syncPermissions().catch(() => {});
    const intervalId = window.setInterval(() => {
      syncPermissions().catch(() => {});
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [user, membershipId]);

  const signIn = async (email: string, password: string) => {
    await authClient.signIn(email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    await authClient.signUp(email, password, displayName);
  };

  const signInWithGoogle = async () => {
    await authClient.signInWithGoogle();
  };

  const signOut = async () => {
    await authClient.signOut();
  };

  const switchPartner = async (_partnerId: string) => {
    if (!user) return;
    try {
      setLoading(true);
      // V2: Partner switching is handled by the backend session.
      // For now, call refresh to re-validate the session, then reload.
      await authClient.refreshSession();
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch partner:', err);
    } finally {
      setLoading(false);
    }
  };

  const canDo = (action: string) =>
    !permissions.actionPermissions || permissions.actionPermissions[action] === true;

  const getIdToken = async () => {
    return getAccessToken() ?? '';
  };

  const isDashboardPath = pathname
    ? pathname.startsWith('/venue') ||
      pathname.startsWith('/host') ||
      pathname.startsWith('/promoter') ||
      pathname === '/'
    : false;

  const isBypassPath = pathname
    ? pathname.startsWith('/onboard') || pathname.startsWith('/login')
    : false;

  const redirectPending =
    !loading &&
    user &&
    profile?.mustChangePassword &&
    isDashboardPath &&
    pathname !== '/auth/change-password';

  if ((loading && !isBypassPath) || redirectPending) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-border-subtle border-t-white rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em]">
          {redirectPending ? 'Redirecting' : 'Authorizing Access'}
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isApproved,
        isBanned,
        isPartnerSuspended,
        onboardingStatus,
        kycStatus,
        entityType,
        subscriptionPlan,
        tabVisibility: permissions.tabVisibility ?? serverDefaultTabVisibility,
        actionPermissions: permissions.actionPermissions,
        piiPolicy: permissions.piiPolicy,
        grantedPermissions,
        hasPermission: (permission: string) => grantedPermissions.includes(permission),
        canDo,
        getIdToken,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        switchPartner,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useDashboardAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useDashboardAuth must be used within DashboardAuthProvider');
  }
  return context;
}
