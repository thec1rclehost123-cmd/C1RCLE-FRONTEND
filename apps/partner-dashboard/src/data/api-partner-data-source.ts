/**
 * api-partner-data-source.ts
 *
 * Provides getStaffFromApi backed by the staff API for partner dashboard screens.
 */

import { staffApi } from '@/lib/api/staff-api';

import type { StaffAccess, StaffInvite, StaffMember } from './partner-data-source';
import type { InvitationDto, OrganizationMemberDto } from '@/lib/api/staff-api';

function generateInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const emptyStaff: readonly StaffMember[] = [];
const emptyStaffInvites: readonly StaffInvite[] = [];
const staffAccessDenied: StaffAccess = { canManage: false };

function roleLabel(role: OrganizationMemberDto['role']): string {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Manager';
    case 'member':
      return 'Staff';
  }
}

function memberDisplayName(member: OrganizationMemberDto): string {
  return `Staff ${member.userId.slice(-6).toUpperCase()}`;
}

function memberToStaffMember(member: OrganizationMemberDto): StaffMember {
  const name = memberDisplayName(member);
  return {
    id: member.userId,
    name,
    initials: generateInitials(name),
    role:
      member.capabilities.length > 0
        ? `${roleLabel(member.role)} · ${member.capabilities.join(', ')}`
        : roleLabel(member.role),
    status: 'Active',
    permissions: [],
    userId: member.userId,
    email: null,
    backendRole: member.role,
    capabilities: [...member.capabilities],
  };
}

function invitationToStaffInvite(invite: InvitationDto): StaffInvite {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    capabilities: [...invite.capabilities],
    status: invite.status,
    expiresAt: invite.expiresAt,
  };
}

export interface StaffSlice {
  readonly staff: readonly StaffMember[];
  readonly staffInvites: readonly StaffInvite[];
  readonly staffAccess: StaffAccess;
}

/**
 * Fetches the live staff slice. Members and invitations are independent calls:
 * a 403 on invitations (viewer lacks `staff.manage`) still renders the roster
 * with `canManage: false`; a roster failure surfaces as `staffAccess.error`
 * while partnerships still render.
 */
export async function getStaffFromApi(organizationId: string): Promise<StaffSlice> {
  const [membersResult, invitationsResult] = await Promise.allSettled([
    staffApi.listMembers(organizationId),
    staffApi.listInvitations(organizationId),
  ]);

  if (membersResult.status === 'rejected') {
    const message =
      membersResult.reason instanceof Error
        ? membersResult.reason.message
        : String(membersResult.reason);
    return {
      staff: emptyStaff,
      staffInvites: emptyStaffInvites,
      staffAccess: { canManage: false, error: message },
    };
  }

  const staff = membersResult.value.items.map(memberToStaffMember);
  if (invitationsResult.status === 'fulfilled') {
    return {
      staff,
      staffInvites: invitationsResult.value.items.map(invitationToStaffInvite),
      staffAccess: { canManage: true },
    };
  }
  return { staff, staffInvites: emptyStaffInvites, staffAccess: staffAccessDenied };
}
