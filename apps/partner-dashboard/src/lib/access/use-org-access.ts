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
  // The server has already validated the httpOnly session cookie to provide
  // the initial user. The same-origin BFF forwards that cookie directly, so
  // authorization can start while the separate in-memory token refresh is
  // still settling; waiting for `hydrated` serialized two authenticated
  // network round trips on every fresh page load.
  const session = useSessionStore();
  const userId = session.session?.user.id ?? null;

  const [result, setResult] = useState<FetchResult>(IDLE_RESULT);

  useEffect(() => {
    if (!orgId || !userId) return;

    let isMounted = true;

    getCachedPartnerAccess(orgId, userId)
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
  }, [orgId, userId]);

  // A result fetched for a different (or no) org is stale — treat it as still loading
  // rather than flashing the previous org's access while the new request is in flight.
  const { access, error, isSuspended } = orgId && result.orgId === orgId ? result : IDLE_RESULT;
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
