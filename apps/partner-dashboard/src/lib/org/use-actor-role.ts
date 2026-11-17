'use client';

import { useEffect, useState } from 'react';

import { getOrganizations } from '@/lib/org/org-repository';

import type { OrganizationRoleDto } from '@c1rcle/contracts';

/**
 * The signed-in person's own role in one organization (`null` while loading or
 * when they have none). Read from the organizations list the gateway already
 * scopes to the caller, so it is the server's answer, never a local guess.
 */
export function useActorRole(
  organizationId: string | null | undefined,
): OrganizationRoleDto | null {
  const [role, setRole] = useState<OrganizationRoleDto | null>(null);
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    getOrganizations()
      .then((organizations) => {
        if (cancelled) return;
        setRole(
          organizations.find((organization) => organization.id === organizationId)?.role ?? null,
        );
      })
      .catch(() => {
        if (!cancelled) setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);
  return organizationId ? role : null;
}
