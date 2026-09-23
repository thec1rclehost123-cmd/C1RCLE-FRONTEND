import { getPartnerAccess } from '@/lib/org/org-repository';

import type { PartnerAccessDto } from '@c1rcle/contracts';

interface AccessEntry {
  readonly promise: Promise<PartnerAccessDto>;
}

const entries = new Map<string, AccessEntry>();

/** Shares in-flight and completed access reads between the auth provider and hook. */
export function getCachedPartnerAccess(organizationId: string): Promise<PartnerAccessDto> {
  const existing = entries.get(organizationId);
  if (existing) return existing.promise;

  const promise = getPartnerAccess(organizationId).catch((error: unknown) => {
    entries.delete(organizationId);
    throw error;
  });
  entries.set(organizationId, { promise });
  return promise;
}

export function clearPartnerAccessCache(): void {
  entries.clear();
}
