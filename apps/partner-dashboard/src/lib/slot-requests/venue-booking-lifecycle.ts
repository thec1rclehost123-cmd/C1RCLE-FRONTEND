import { slotRequestDtoSchema } from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { getActiveOrgId } from '@/lib/org/active-org';

export async function cancelAcceptedVenueBooking(
  slotRequestId: string,
  reason: string,
  idempotencyKey: string,
) {
  const organizationId = getActiveOrgId();
  if (!organizationId) throw new Error('Select a Venue workspace before cancelling its booking.');
  return apiClient.post({
    path: `/api/v2/venues/slot-requests/${encodeURIComponent(slotRequestId)}/cancel-by-venue`,
    body: { reason },
    schema: slotRequestDtoSchema,
    headers: { 'x-organization-id': organizationId, 'Idempotency-Key': idempotencyKey },
  });
}
