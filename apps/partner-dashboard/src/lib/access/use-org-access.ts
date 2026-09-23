'use client';

import { useCallback, useEffect, useState } from 'react';

import { isApiClientError } from '@c1rcle/api-client';
import { useSessionStore } from '@c1rcle/auth';

import { getActiveOrgId } from '@/lib/org/active-org';

import { getCachedPartnerAccess } from './org-access-cache';

import type { PartnerAccessDto } from '@c1rcle/contracts';

type PartnerPermission = PartnerAccessDto['permissions'][number];

export interface OrgAccessState {
  partnerType: PartnerAccessDto['partnerType'] | null;
  role: string | null;
  permissions: string[];
  tabVisibility: Record<string, boolean> | null;
  isLoading: boolean;
  error: Error | null;
  isSuspended: boolean;
  hasPermission: (permission: string) => boolean;
  tabVisible: (tab: string) => boolean;
}

/** `orgId` is the org this result was fetched for — lets render derive staleness without an effect setState. */
interface FetchResult {
  orgId: string | null;
  access: PartnerAccessDto | null;
  error: Error | null;
  isSuspended: boolean;
}

const IDLE_RESULT: FetchResult = { orgId: null, access: null, error: null, isSuspended: false };

export function useOrgAccess(orgIdOverride?: string | null): OrgAccessState {
  const orgId = orgIdOverride !== undefined ? orgIdOverride : getActiveOrgId();
  // `SessionProvider` hydrates the session before its background `refresh()`
  // re-scopes the gateway session cookie to this origin (see
  // session-provider.tsx). Firing the request earlier means the BFF has no
  // cookie to forward and the gateway 401s. Gate on `hydrated` — the flag
  // flips once bootstrap settles, signed in or not — so the first access
  // read always rides a real session.
  const hydrated = useSessionStore().hydrated;

  const [result, setResult] = useState<FetchResult>(IDLE_RESULT);

  useEffect(() => {
    if (!orgId || !hydrated) return;

    let isMounted = true;

    getCachedPartnerAccess(orgId)
      .then((data) => {
        if (isMounted) {
          setResult({ orgId, access: data, error: null, isSuspended: false });
        }
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        if (isApiClientError(err) && err.status === 403) {
          setResult({ orgId, access: null, error: null, isSuspended: true });
        } else {
          setResult({
            orgId,
            access: null,
            error: err instanceof Error ? err : new Error(String(err)),
            isSuspended: false,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [orgId, hydrated]);

  // A result fetched for a different (or no) org is stale — treat it as still loading
  // rather than flashing the previous org's access while the new request is in flight.
  const { access, error, isSuspended } =
    orgId && result.orgId === orgId ? result : IDLE_RESULT;
  const isLoading = orgId !== null && result.orgId !== orgId;

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!access) return false;
      return access.permissions.includes(permission as PartnerPermission);
    },
    [access],
  );

  const tabVisible = useCallback(
    (tab: string): boolean => {
      if (!access) return true;
      return access.tabVisibility?.[tab] !== false;
    },
    [access],
  );

  return {
    partnerType: access?.partnerType ?? null,
    role: access?.role ?? null,
    permissions: access?.permissions ?? [],
    tabVisibility: access?.tabVisibility ?? null,
    isLoading,
    error,
    isSuspended,
    hasPermission,
    tabVisible,
  };
}
