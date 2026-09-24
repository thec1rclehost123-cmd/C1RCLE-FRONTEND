import { z } from 'zod';

import { slotRequestDtoSchema } from '@c1rcle/contracts';

import { bffClient } from '@/lib/bff/bff-client';
import { csrfHeaders } from '@/lib/onboarding/csrf';
import { getActiveOrgId } from '@/lib/org/active-org';

import type { PartnerNotification, SlotRequestActionKind, SlotRequestDirection, SlotRequestsData } from '@/data/partner-data-source';

export type { SlotRequestActionKind };

/**
 * Client gateway for the slot-request feature. Every call goes to the app's
 * own `/api/bff/slot-requests` routes (session-cookie auth, CSRF on writes) —
 * the BFF owns gateway forwarding and org scoping server-side; nothing here
 * knows a gateway URL. Used by the page screen to fetch live data, by the
 * review actions (accept/reject/cancel) and by the host event editor's
 * submit-for-approval flow.
 */

export const slotRequestsDataSchema = z.object({
  dataStatus: z.enum(['fixture', 'live']),
  accent: z.enum(['orange', 'lavender']),
  direction: z.enum(['incoming', 'outgoing']),
  requests: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['pending', 'approved', 'rejected', 'cancelled']),
      direction: z.enum(['incoming', 'outgoing']),
      partnerName: z.string(),
      partnerRoleLabel: z.enum(['Host', 'Venue']),
      partnerInitials: z.string(),
      event: z.object({
        name: z.string(),
        description: z.string(),
        date: z.string(),
        time: z.string(),
        venue: z.string(),
        ticketTier: z.string().optional(),
        note: z.string().optional(),
        artists: z.array(z.string()).optional(),
        promoters: z.array(z.string()).optional(),
        tiers: z
          .array(z.object({ name: z.string(), price: z.string(), quantity: z.string() }))
          .optional(),
        pricing: z.array(z.string()).optional(),
        tables: z.string().optional(),
        codes: z.string().optional(),
      }),
    }),
  ),
});

export const slotRequestSubmitResultSchema = z.object({
  eventId: z.string(),
  slotRequestId: z.string(),
});

export const partnerNotificationSchema = z.object({
  id: z.string(),
  description: z.string(),
  time: z.string(),
  type: z.enum(['payout', 'request', 'marketing', 'operations', 'system']),
  icon: z.enum(['finance', 'partner', 'marketing', 'operations', 'request']),
  href: z.string().optional(),
  unread: z.boolean(),
});

export const slotRequestNotificationsSchema = z.object({
  dataStatus: z.enum(['fixture', 'live']),
  notifications: z.array(partnerNotificationSchema),
});

export interface HostSlotRequestSubmitInput {
  readonly organizationId: string;
  readonly venueId: string;
  readonly name: string;
  readonly date: string;
  readonly time: string;
  readonly endTime?: string;
  readonly dateLabel: string;
  readonly genres: readonly string[];
  readonly artists: readonly string[];
  readonly posterPublicUrl?: string | null;
}

function currentOrganizationId(): string {
  const organizationId = getActiveOrgId();
  if (!organizationId) throw new Error('No active organization selected.');
  return organizationId;
}

export async function loadSlotRequestsData(
  direction: SlotRequestDirection,
): Promise<SlotRequestsData> {
  const organizationId = currentOrganizationId();
  return bffClient.get({
    path: '/api/bff/slot-requests',
    query: { direction, organizationId },
    schema: slotRequestsDataSchema,
    timeoutMs: 30000,
  });
}

export async function loadSlotRequestNotifications(
  direction: SlotRequestDirection,
): Promise<PartnerNotification[]> {
  const organizationId = currentOrganizationId();
  const data = await bffClient.get({
    path: '/api/bff/notifications',
    query: { direction, organizationId },
    schema: slotRequestNotificationsSchema,
    timeoutMs: 30000,
  });
  return data.notifications;
}

export async function applySlotRequestAction(
  slotRequestId: string,
  kind: SlotRequestActionKind,
): Promise<void> {
  const organizationId = currentOrganizationId();
  await bffClient.post({
    path: `/api/bff/slot-requests/${slotRequestId}/${kind}`,
    query: { organizationId },
    schema: slotRequestDtoSchema,
    headers: csrfHeaders(),
  });
}

export async function submitHostSlotRequest(
  input: HostSlotRequestSubmitInput,
): Promise<{ readonly eventId: string; readonly slotRequestId: string }> {
  return bffClient.post({
    path: '/api/bff/slot-requests',
    body: { draft: input },
    schema: slotRequestSubmitResultSchema,
    headers: csrfHeaders(),
  });
}