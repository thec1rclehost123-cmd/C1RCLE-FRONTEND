import { getPartnerAccess } from '@/lib/org/org-repository';

import type { PartnerAccessDto } from '@c1rcle/contracts';

interface AccessEntry {
  readonly promise: Promise<PartnerAccessDto>;
}

const inFlight = new Map<string, AccessEntry>();

/** Shares concurrent reads only within a user/org pair; settled permissions are never cached. */
export function getCachedPartnerAccess(
  organizationId: string,
  userId: string,
): Promise<PartnerAccessDto> {
  const key = `${userId}:${organizationId}`;
  const existing = inFlight.get(key);
  if (existing) return existing.promise;

  const promise = getPartnerAccess(organizationId).finally(() => {
    if (inFlight.get(key)?.promise === promise) inFlight.delete(key);
  });
  inFlight.set(key, { promise });
  return promise;
}

export function clearPartnerAccessCache(): void {
  inFlight.clear();
}
