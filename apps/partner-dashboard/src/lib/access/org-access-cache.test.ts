import { afterEach, describe, expect, it, vi } from 'vitest';

import { getCachedPartnerAccess, clearPartnerAccessCache } from './org-access-cache';

import type { PartnerAccessDto } from '@c1rcle/contracts';

const getPartnerAccessMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/org/org-repository', () => ({ getPartnerAccess: getPartnerAccessMock }));

const ACCESS: PartnerAccessDto = {
  organizationId: 'org-1',
  userId: 'user-1',
  partnerType: 'venue',
  role: 'owner',
  permissions: ['VIEW_FINANCIALS'],
  tabVisibility: null,
};

afterEach(() => {
  clearPartnerAccessCache();
  getPartnerAccessMock.mockReset();
});

describe('getCachedPartnerAccess', () => {
  it('shares concurrent reads for the same organization', async () => {
    let resolveRead!: (value: PartnerAccessDto) => void;
    getPartnerAccessMock.mockReturnValue(
      new Promise<PartnerAccessDto>((resolve) => {
        resolveRead = resolve;
      }),
    );

    const first = getCachedPartnerAccess('org-1', 'user-1');
    const second = getCachedPartnerAccess('org-1', 'user-1');

    expect(first).toBe(second);
    expect(getPartnerAccessMock).toHaveBeenCalledTimes(1);
    resolveRead(ACCESS);
    await expect(Promise.all([first, second])).resolves.toEqual([ACCESS, ACCESS]);
  });

  it('does not retain settled permissions and retries after failure', async () => {
    getPartnerAccessMock.mockRejectedValueOnce(new Error('temporary failure'));
    await expect(getCachedPartnerAccess('org-1', 'user-1')).rejects.toThrow('temporary failure');

    getPartnerAccessMock.mockResolvedValueOnce(ACCESS);
    await expect(getCachedPartnerAccess('org-1', 'user-1')).resolves.toEqual(ACCESS);
    getPartnerAccessMock.mockResolvedValueOnce({ ...ACCESS, permissions: [] });
    await expect(getCachedPartnerAccess('org-1', 'user-1')).resolves.toEqual({
      ...ACCESS,
      permissions: [],
    });

    expect(getPartnerAccessMock).toHaveBeenCalledTimes(3);
  });

  it('does not share permission reads between users in the same organization', async () => {
    let resolveFirst!: (value: PartnerAccessDto) => void;
    let resolveSecond!: (value: PartnerAccessDto) => void;
    getPartnerAccessMock
      .mockReturnValueOnce(new Promise<PartnerAccessDto>((resolve) => (resolveFirst = resolve)))
      .mockReturnValueOnce(new Promise<PartnerAccessDto>((resolve) => (resolveSecond = resolve)));

    const first = getCachedPartnerAccess('org-1', 'user-1');
    const second = getCachedPartnerAccess('org-1', 'user-2');

    expect(first).not.toBe(second);
    expect(getPartnerAccessMock).toHaveBeenCalledTimes(2);
    resolveFirst(ACCESS);
    resolveSecond({ ...ACCESS, userId: 'user-2', permissions: [] });
    await Promise.all([first, second]);
  });
});
