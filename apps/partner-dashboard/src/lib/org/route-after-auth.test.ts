import { beforeEach, describe, expect, it, vi } from 'vitest';

import { redirectToFirstPendingInvite, resolveLandingPath } from './route-after-auth';

const mocks = vi.hoisted(() => ({
  listMyInvitations: vi.fn(),
  getPartnerAccess: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('@/lib/api/staff-api', () => ({
  staffApi: { listMyInvitations: mocks.listMyInvitations },
}));

vi.mock('@/lib/org/org-repository', () => ({
  getOrganizations: vi.fn(),
  getPartnerAccess: mocks.getPartnerAccess,
}));

const router = { push: mocks.push, replace: mocks.replace } as unknown as Parameters<
  typeof redirectToFirstPendingInvite
>[0];

function invite(id: string, status: 'pending' | 'accepted' = 'pending') {
  return {
    id,
    organizationId: 'org-1',
    email: 'staff@example.com',
    role: 'member',
    capabilities: ['venue'],
    status,
    invitedBy: 'user_owner',
    expiresAt: new Date('2026-10-12T00:00:00.000Z').toISOString(),
    acceptedAt: null,
    version: 1,
    createdAt: new Date('2026-09-28T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-09-28T00:00:00.000Z').toISOString(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('redirectToFirstPendingInvite', () => {
  it('routes a zero-org login to its pending invite', async () => {
    mocks.listMyInvitations.mockResolvedValue({
      items: [invite('inv-1')],
      pageInfo: { page: 1, pageSize: 50, total: 1, hasNextPage: false },
    });

    await expect(redirectToFirstPendingInvite(router)).resolves.toBe(true);
    expect(mocks.push).toHaveBeenCalledWith('/invitations/inv-1/accept');
  });

  it('leaves settled users alone when nothing is pending', async () => {
    mocks.listMyInvitations.mockResolvedValue({
      items: [invite('inv-done', 'accepted')],
      pageInfo: { page: 1, pageSize: 50, total: 1, hasNextPage: false },
    });

    await expect(redirectToFirstPendingInvite(router)).resolves.toBe(false);
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('falls through to the caller on lookup failure', async () => {
    mocks.listMyInvitations.mockRejectedValue(new Error('network down'));

    await expect(redirectToFirstPendingInvite(router)).resolves.toBe(false);
    expect(mocks.push).not.toHaveBeenCalled();
  });
});

describe('resolveLandingPath', () => {
  function access(partnerType: string, tabVisibility: Record<string, boolean> | null) {
    return {
      organizationId: 'org-1',
      userId: 'u1',
      partnerType,
      role: 'STAFF',
      permissions: [],
      tabVisibility,
    };
  }

  it('lands owners on the studio overview', async () => {
    mocks.getPartnerAccess.mockResolvedValue(access('venue', null));

    await expect(resolveLandingPath('org-1')).resolves.toBe('/partner/venue/overview');
  });

  it('lands restricted roles on their first visible tab', async () => {
    mocks.getPartnerAccess.mockResolvedValue(
      access('venue', { overview: false, events: false, finance: false, settings: false }),
    );

    await expect(resolveLandingPath('org-1')).resolves.toBe('/partner/venue/slot-requests');
  });

  it('resolves the host studio from host capabilities', async () => {
    mocks.getPartnerAccess.mockResolvedValue(access('host', null));

    await expect(resolveLandingPath('org-1')).resolves.toBe('/partner/host/overview');
  });

  it('falls back to the picker when access is unreachable', async () => {
    mocks.getPartnerAccess.mockRejectedValue(new Error('network down'));

    await expect(resolveLandingPath('org-1')).resolves.toBe('/partner/select-organization');
  });
});
