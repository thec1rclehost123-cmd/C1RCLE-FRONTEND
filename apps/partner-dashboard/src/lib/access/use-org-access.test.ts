import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';
import { markHydrated } from '@c1rcle/auth';

import { useOrgAccess } from './use-org-access';

import type { PartnerAccessDto } from '@c1rcle/contracts';

const getMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/client', () => ({
  apiClient: { get: getMock },
}));

// The hook now gates its fetch on the session store's one-time `hydrated`
// flag (see use-org-access.ts) — these tests exercise steady-state fetch
// behavior post-bootstrap, so mark it settled once for the whole file.
markHydrated();

const ACCESS_FIXTURE: PartnerAccessDto = {
  organizationId: 'org-1',
  userId: 'user-1',
  partnerType: 'venue',
  role: 'owner',
  permissions: ['VIEW_FINANCIALS', 'MANAGE_EVENTS'],
  tabVisibility: { finance: false },
};

afterEach(() => {
  getMock.mockReset();
});

describe('useOrgAccess', () => {
  it('returns idle state and issues no request when there is no org id', () => {
    const { result } = renderHook(() => useOrgAccess(null));

    expect(getMock).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.partnerType).toBeNull();
    expect(result.current.permissions).toEqual([]);
  });

  it('maps a partnerAccessDtoSchema fixture to partnerType, permissions, and tabVisibility', async () => {
    getMock.mockResolvedValue(ACCESS_FIXTURE);

    const { result } = renderHook(() => useOrgAccess('org-1'));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.partnerType).toBe('venue');
    expect(result.current.permissions).toEqual(['VIEW_FINANCIALS', 'MANAGE_EVENTS']);
    expect(result.current.tabVisibility).toEqual({ finance: false });
    expect(getMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v2/organizations/org-1/access' }),
    );
  });

  it('hasPermission reflects the granted permission list', async () => {
    getMock.mockResolvedValue(ACCESS_FIXTURE);

    const { result } = renderHook(() => useOrgAccess('org-1'));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPermission('VIEW_FINANCIALS')).toBe(true);
    expect(result.current.hasPermission('MANAGE_PAYOUTS')).toBe(false);
  });

  it('tabVisible defaults to true for every tab when tabVisibility is null', async () => {
    getMock.mockResolvedValue({ ...ACCESS_FIXTURE, tabVisibility: null });

    const { result } = renderHook(() => useOrgAccess('org-1'));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tabVisible('anything')).toBe(true);
  });

  it('tabVisible is false only for a tab explicitly set to false', async () => {
    getMock.mockResolvedValue(ACCESS_FIXTURE);

    const { result } = renderHook(() => useOrgAccess('org-1'));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.tabVisible('finance')).toBe(false);
    expect(result.current.tabVisible('overview')).toBe(true);
  });

  it('maps a 403 to isSuspended, not error', async () => {
    getMock.mockRejectedValue(
      new ApiClientError({
        code: 'forbidden',
        message: 'Suspended',
        status: 403,
        requestId: undefined,
        fieldErrors: undefined,
      }),
    );

    const { result } = renderHook(() => useOrgAccess('org-1'));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuspended).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('maps a non-403 failure to error, not isSuspended', async () => {
    getMock.mockRejectedValue(
      new ApiClientError({
        code: 'server',
        message: 'boom',
        status: 500,
        requestId: undefined,
        fieldErrors: undefined,
      }),
    );

    const { result } = renderHook(() => useOrgAccess('org-1'));
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSuspended).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it('re-fetches and re-enters loading when the org id changes', async () => {
    getMock.mockResolvedValue(ACCESS_FIXTURE);

    const { result, rerender } = renderHook(({ orgId }) => useOrgAccess(orgId), {
      initialProps: { orgId: 'org-1' },
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    getMock.mockResolvedValue({ ...ACCESS_FIXTURE, organizationId: 'org-2', partnerType: 'host' });
    act(() => {
      rerender({ orgId: 'org-2' });
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.partnerType).toBe('host');
  });
});
