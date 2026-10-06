import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getStaffFromApi } from './api-partner-data-source';

const mocks = vi.hoisted(() => ({
  listMembers: vi.fn(),
  listInvitations: vi.fn(),
}));

vi.mock('@/lib/api/staff-api', () => ({
  staffApi: {
    listMembers: mocks.listMembers,
    listInvitations: mocks.listInvitations,
  },
}));

const member = {
  userId: 'user-abc123',
  role: 'manager',
  capabilities: ['venue'],
  joinedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
} as const;

const invite = {
  id: 'inv-1',
  organizationId: 'org-1',
  email: 'teammate@email.com',
  role: 'member',
  capabilities: ['venue'],
  status: 'pending',
  invitedBy: 'user-owner',
  expiresAt: new Date('2026-02-01T00:00:00.000Z').toISOString(),
  acceptedAt: null,
  version: 1,
  createdAt: new Date('2026-01-15T00:00:00.000Z').toISOString(),
  updatedAt: new Date('2026-01-15T00:00:00.000Z').toISOString(),
} as const;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getStaffFromApi', () => {
  it('maps members and invitations with manage access', async () => {
    mocks.listMembers.mockResolvedValue({ items: [member], pageInfo: {} });
    mocks.listInvitations.mockResolvedValue({ items: [invite], pageInfo: {} });

    const slice = await getStaffFromApi('org-1');

    expect(slice.staff).toHaveLength(1);
    expect(slice.staff[0]?.backendRole).toBe('manager');
    expect(slice.staff[0]?.capabilities).toEqual(['venue']);
    expect(slice.staffInvites).toHaveLength(1);
    expect(slice.staffInvites[0]?.email).toBe('teammate@email.com');
    expect(slice.staffAccess).toEqual({ canManage: true });
  });

  it('still renders the roster when invitations are forbidden', async () => {
    mocks.listMembers.mockResolvedValue({ items: [member], pageInfo: {} });
    mocks.listInvitations.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }));

    const slice = await getStaffFromApi('org-1');

    expect(slice.staff).toHaveLength(1);
    expect(slice.staffInvites).toEqual([]);
    expect(slice.staffAccess).toEqual({ canManage: false });
  });

  it('surfaces a roster failure without throwing', async () => {
    mocks.listMembers.mockRejectedValue(new Error('backend down'));
    mocks.listInvitations.mockResolvedValue({ items: [], pageInfo: {} });

    const slice = await getStaffFromApi('org-1');

    expect(slice.staff).toEqual([]);
    expect(slice.staffAccess.canManage).toBe(false);
    expect(slice.staffAccess.error).toBe('backend down');
  });
});
