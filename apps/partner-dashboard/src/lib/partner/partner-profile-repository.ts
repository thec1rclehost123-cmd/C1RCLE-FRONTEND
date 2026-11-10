import { partnerPublicProfileDtoSchema } from '@c1rcle/contracts/client';

import { apiClient } from '@/lib/api/client';

import type { PartnerKind } from '@/data/partner-data-source';
import type { PartnerPublicProfileDto } from '@c1rcle/contracts/client';

export function getPartnerPublicProfile(
  organizationId: string,
  partnerId: string,
  kind: PartnerKind,
): Promise<PartnerPublicProfileDto> {
  return apiClient.get({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/partner-profiles/${encodeURIComponent(partnerId)}`,
    query: { kind },
    headers: { 'X-Organization-Id': organizationId },
    schema: partnerPublicProfileDtoSchema,
  });
}
