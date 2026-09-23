import {
  assignPromoterSchema,
  createEventSchema,
  createTicketTierSchema,
  eventDtoSchema,
  posterUploadUrlDtoSchema,
  promoterAssignmentDtoSchema,
  ticketTierDtoSchema,
  updateEventSchema,
} from '@c1rcle/contracts';

import { apiClient } from '@/lib/api/client';
import { eventEndAtFromDraft, eventStartAtFromDraft } from '@/lib/events/event-time';
import { uploadToSignedUrl } from '@/lib/onboarding/uploadToSignedUrl';
import { submitHostSlotRequest } from '@/lib/slot-requests/slot-request-repository';

import type { EventEditorDraft } from '@/data/partner-data-source';
import type { EventDto } from '@c1rcle/contracts';

export { eventEndAtFromDraft, eventStartAtFromDraft } from '@/lib/events/event-time';

export async function publishVenueEvent(
  organizationId: string,
  draft: EventEditorDraft,
): Promise<EventDto> {
  const startAt = eventStartAtFromDraft(draft);
  if (!startAt) throw new Error('Enter a valid event date and start time.');

  const workflowId = crypto.randomUUID();
  const commandHeaders = (suffix: string) => ({
    'x-organization-id': organizationId,
    'Idempotency-Key': `${workflowId}-${suffix}`,
  });

  const imageUrl = await resolvePosterImageUrl(organizationId, draft);
  const event = await apiClient.post({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/events`,
    body: createEventSchema.parse({
      venueId: draft.venueId,
      title: draft.name.trim(),
      imageUrl,
      startAt,
      endAt: eventEndAtFromDraft(draft),
      tags: [...new Set([...draft.genres, ...draft.artists])].slice(0, 50),
      compensation: draft.selectedPromoterIds.length
        ? {
            model: draft.compensation,
            globalRatePercent:
              draft.compensation === 'standard' ? Math.round(draft.commissionRate) : null,
            tierRates: draft.compensation === 'custom' ? (draft.tierCommissions ?? {}) : {},
            salaryAmountPaise:
              draft.compensation === 'salary' ? Math.round(draft.salaryAmount * 100) : null,
            salaryPeriod: draft.compensation === 'salary' ? draft.salaryPeriod : null,
            salaryNotes: draft.compensation === 'salary' ? draft.salaryNotes || null : null,
          }
        : null,
    }),
    schema: eventDtoSchema,
    headers: commandHeaders('event'),
  });

  const serverTierIds = new Map<string, string>();
  for (const [index, tier] of draft.ticketTiers.entries()) {
    const sanitizedPricingPhases = (tier.pricingPhases ?? [])
      .map((phase) => {
        const startsAt = sanitizeIsoDateTime(phase.startsAt);
        const endsAt = sanitizeIsoDateTime(phase.endsAt);
        if (!startsAt || !endsAt) return null;
        return {
          id: phase.id,
          name: phase.name.trim() || `Phase ${phase.id}`,
          priceInPaise: Math.round(phase.priceInPaise),
          startsAt,
          endsAt,
          quantity: phase.quantity ?? null,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const createdTier = await apiClient.post({
      path: `/api/v2/events/${encodeURIComponent(event.id)}/ticket-tiers`,
      body: createTicketTierSchema.parse({
        name: tier.name.trim(),
        priceInPaise: Math.round(tier.price * 100),
        quantity: tier.quantity,
        ...(tier.accessType ? { accessType: tier.accessType } : {}),
        ...(tier.audienceType ? { audienceType: tier.audienceType } : {}),
        ...(tier.guestCount ? { guestCount: tier.guestCount } : {}),
        ...(tier.doorPrice != null ? { doorPriceInPaise: Math.round(tier.doorPrice * 100) } : {}),
        ...(sanitizedPricingPhases.length > 0 ? { pricingPhases: sanitizedPricingPhases } : {}),
        ...(tier.benefits ? { benefits: [...tier.benefits] } : {}),
        ...(tier.minAge != null ? { minAge: tier.minAge } : {}),
        ...(tier.maxAge != null ? { maxAge: tier.maxAge } : {}),
        ...(tier.minPerOrder != null ? { minPerOrder: tier.minPerOrder } : {}),
        ...(tier.maxPerUser != null ? { maxPerUser: tier.maxPerUser } : {}),
        ...(tier.tableConfig ? { tableConfig: tier.tableConfig } : {}),
        ...(tier.commissionEligible != null ? { commissionEligible: tier.commissionEligible } : {}),
        ...(tier.maxPerOrder != null ? { maxPerOrder: tier.maxPerOrder } : {}),
      }),
      schema: ticketTierDtoSchema,
      headers: commandHeaders(`tier-${String(index)}`),
    });
    serverTierIds.set(tier.id, createdTier.id);
  }

  // The editor stores compensation by its local tier ids, while the API
  // creates authoritative tier ids. Resolve that boundary before publishing;
  // otherwise publish validation rejects every custom commission.
  if (event.compensation?.model === 'custom') {
    const tierRates = Object.fromEntries(
      Object.entries(event.compensation.tierRates).map(([localTierId, rate]) => {
        const serverTierId = serverTierIds.get(localTierId);
        if (!serverTierId) throw new Error(`Commission tier ${localTierId} was not created.`);
        return [serverTierId, rate];
      }),
    );
    const updatedEvent = await apiClient.patch({
      path: `/api/v2/events/${encodeURIComponent(event.id)}`,
      body: updateEventSchema.parse({
        compensation: { ...event.compensation, tierRates },
      }),
      schema: eventDtoSchema,
      headers: { ...commandHeaders('compensation'), 'If-Match': String(event.version) },
    });
    // Keep the authoritative version for the rest of the workflow response.
    Object.assign(event, updatedEvent);
  }

  for (const [index, promoterId] of draft.selectedPromoterIds.entries()) {
    await apiClient.post({
      path: `/api/v2/events/${encodeURIComponent(event.id)}/promoter-assignments`,
      body: assignPromoterSchema.parse({
        promoterId,
        ratePercent: draft.compensation === 'standard' ? Math.round(draft.commissionRate) : 0,
        ...(draft.compensation === 'custom'
          ? {
              tierRates: Object.fromEntries(
                Object.entries(
                  draft.promoterOverrides?.[promoterId] ?? draft.tierCommissions ?? {},
                ).map(([localTierId, rate]) => {
                  const serverTierId = serverTierIds.get(localTierId);
                  if (!serverTierId)
                    throw new Error(`Commission tier ${localTierId} was not created.`);
                  return [serverTierId, { ratePercent: rate, flatPaise: 0 }];
                }),
              ),
            }
          : {}),
      }),
      schema: promoterAssignmentDtoSchema,
      headers: commandHeaders(`promoter-${String(index)}`),
    });
  }

  await apiClient.post({
    path: `/api/v2/events/${encodeURIComponent(event.id)}/review`,
    schema: eventDtoSchema,
    headers: commandHeaders('review'),
  });

  return apiClient.post({
    path: `/api/v2/events/${encodeURIComponent(event.id)}/publish`,
    schema: eventDtoSchema,
    headers: commandHeaders('publish'),
  });
}

export async function submitHostEventRequest(
  organizationId: string,
  draft: EventEditorDraft,
): Promise<void> {
  // Poster grant/upload stays client-side (blob→signed URL); everything after
  // — event create + slot-request create — happens on the BFF with the resolved
  // public URL, so the browser never hits the gateway for the submit itself.
  const posterPublicUrl = await resolvePosterImageUrl(organizationId, draft);
  await submitHostSlotRequest({
    organizationId,
    venueId: draft.venueId,
    name: draft.name.trim(),
    date: draft.date,
    time: draft.time,
    ...(draft.endTime ? { endTime: draft.endTime } : {}),
    dateLabel: draft.dateLabel,
    genres: [...draft.genres],
    artists: [...draft.artists],
    posterPublicUrl,
  });
}

export function sanitizeIsoDateTime(value: string | undefined | null): string | null {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  const parsedWithZ = new Date(`${trimmed}Z`);
  if (!Number.isNaN(parsedWithZ.getTime())) {
    return parsedWithZ.toISOString();
  }
  return null;
}

type PosterContentType = 'image/jpeg' | 'image/png' | 'image/webp';

const POSTER_MAX_BYTES = 5 * 1024 * 1024;

function posterExtension(draft: Pick<EventEditorDraft, 'artwork'>): string {
  return draft.artwork.alt?.toLowerCase().split('.').pop() ?? '';
}

function posterContentType(draft: Pick<EventEditorDraft, 'artwork'>): PosterContentType {
  switch (posterExtension(draft)) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

async function resolvePosterImageUrl(
  organizationId: string,
  draft: Pick<EventEditorDraft, 'artwork'>,
): Promise<string | null> {
  if (draft.artwork.type !== 'image' || !draft.artwork.value) return null;

  if (/^https?:\/\//i.test(draft.artwork.value)) {
    return draft.artwork.value;
  }

  if (!draft.artwork.value.startsWith('blob:')) {
    if (draft.artwork.value.startsWith('/')) {
      const origin =
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
      return `${origin}${draft.artwork.value}`;
    }
    return null;
  }

  let blob: Blob;
  if (draft.artwork.file instanceof Blob) {
    blob = draft.artwork.file;
  } else {
    // eslint-disable-next-line no-restricted-globals, no-restricted-syntax
    const response = await fetch(draft.artwork.value);
    blob = await response.blob();
  }

  if (blob.size === 0 || blob.size > POSTER_MAX_BYTES) {
    throw new Error('Poster must be under 5MB. Please choose a smaller image.');
  }

  let contentType: PosterContentType = 'image/jpeg';
  if (blob.type === 'image/png') {
    contentType = 'image/png';
  } else if (blob.type === 'image/webp') {
    contentType = 'image/webp';
  } else if (blob.type === 'image/jpeg' || blob.type === 'image/jpg') {
    contentType = 'image/jpeg';
  } else {
    contentType = posterContentType(draft);
  }

  const grant = await apiClient.post({
    path: `/api/v2/organizations/${encodeURIComponent(organizationId)}/poster/upload-url`,
    body: { contentType },
    schema: posterUploadUrlDtoSchema,
    headers: { 'x-organization-id': organizationId },
  });

  const ext = contentType.split('/')[1] ?? 'jpg';
  const fileName =
    draft.artwork.alt?.includes('.') ? draft.artwork.alt : `poster.${ext}`;

  const file = new File([blob], fileName, { type: contentType });
  await uploadToSignedUrl(grant.uploadUrl, grant.headers, file);
  return grant.publicUrl;
}
