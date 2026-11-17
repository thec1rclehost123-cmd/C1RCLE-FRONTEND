import { ROLE_LABELS_DTO, assignableRolesFor } from '@c1rcle/contracts';

import type { AssignableRoleDto, OrganizationRoleDto } from '@c1rcle/contracts';

/**
 * What each role means to the people picking it. Labels come from the shared
 * contract so the dashboard, the scanner and the emails all say the same thing.
 */
const ROLE_HINTS: Readonly<Record<AssignableRoleDto, string>> = {
  admin: 'Runs the whole operation, finance included',
  manager: 'Runs events and the door team',
  door_supervisor: 'Watches the door, overrides scans, manages door codes',
  gate_staff: 'Scans tickets and sells at the gate',
  member: 'Read-only (legacy)',
};

export interface StaffRoleOption {
  readonly value: AssignableRoleDto;
  readonly label: string;
  readonly hint: string;
}

/**
 * Only the roles this person is allowed to hand out, highest first. The server
 * enforces the same rule; offering only valid choices just avoids refusals.
 * The legacy `member` role is not offered for new invites.
 */
export function roleOptionsFor(actorRole: OrganizationRoleDto | null): readonly StaffRoleOption[] {
  if (actorRole === null) return [];
  return assignableRolesFor(actorRole)
    .filter((role) => role !== 'member')
    .map((value) => ({ value, label: ROLE_LABELS_DTO[value], hint: ROLE_HINTS[value] }));
}
