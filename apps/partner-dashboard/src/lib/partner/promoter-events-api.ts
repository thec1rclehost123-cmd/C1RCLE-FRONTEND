import { z } from 'zod';

import { promoterAssignedEventDtoSchema, referralLinkDtoSchema } from '@c1rcle/contracts/client';

import { apiClient } from '@/lib/api/client';
import { getActiveOrgId } from '@/lib/org/active-org';

import type { PromoterEvent } from './contracts';
import type { PromoterAssignedEventDto } from '@c1rcle/contracts/client';

const payloadSchema = z.array(promoterAssignedEventDtoSchema);

export async function loadPromoterLinkedEvents(): Promise<readonly PromoterEvent[]> {
  const organizationId = getActiveOrgId();
  if (!organizationId) throw new Error('No promoter organization selected');
  const payload = await apiClient.get({
    path: `/api/v2/promoters/${encodeURIComponent(organizationId)}/events`,
    headers: { 'x-organization-id': organizationId },
    schema: payloadSchema,
  });
  return payload.map(toPromoterEvent);
}

export async function createPromoterEventLink(
  assignmentId: string,
  label = 'organic',
  code?: string,
  vanitySlug?: string,
) {
  const organizationId = getActiveOrgId();
  if (!organizationId) throw new Error('No promoter organization selected');
  return apiClient.post({
    path: `/api/v2/promoter-assignments/${encodeURIComponent(assignmentId)}/referral-links`,
    headers: {
      'x-organization-id': organizationId,
      'idempotency-key': `${Date.now().toString()}-${Math.random().toString(36).slice(2)}`,
    },
    body: {
      label,
      ...(code?.trim() ? { code: code.trim() } : {}),
      ...(vanitySlug?.trim() ? { vanitySlug: vanitySlug.trim() } : {}),
    },
    schema: referralLinkDtoSchema,
  });
}

function toPromoterEvent({ event, assignment }: PromoterAssignedEventDto): PromoterEvent {
  return {
    id: event.id,
    name: event.title,
    imageUrl: event.imageUrl,
    slug: event.slug,
    assignmentId: assignment.id,
    date: event.startAt,
    time: new Date(event.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    venue: 'Venue to be confirmed',
    host: 'Host',
    city: 'Unknown',
    status: promoterEventStatus(assignment.status),
    category: event.tags[0] ?? 'Event',
    commissionLabel: commissionLabel(assignment.terms.ratePercent, assignment.terms.flatPaise),
    commissionDetails: Object.entries(assignment.terms.tierRates ?? {}).map(
      ([tierId, terms]) => `${tierId}: ${commissionLabel(terms.ratePercent, terms.flatPaise)}`,
    ),
    clicks: 0,
    tickets: 0,
    earningsPaise: 0,
    conversion: 0,
    accent: 'linear-gradient(135deg,#ff5a1f,#6d1600)',
  };
}

function promoterEventStatus(value: unknown): PromoterEvent['status'] {
  return value === 'invited' ||
    value === 'requested' ||
    value === 'active' ||
    value === 'paused' ||
    value === 'completed' ||
    value === 'declined'
    ? value
    : 'invited';
}

function commissionLabel(ratePercent: number, flatPaise: number): string {
  const rate = `${ratePercent.toString()}%`;
  if (flatPaise === 0) return `${rate} commission`;
  return `${rate} + ₹${new Intl.NumberFormat('en-IN').format(flatPaise / 100)} per ticket`;
}
