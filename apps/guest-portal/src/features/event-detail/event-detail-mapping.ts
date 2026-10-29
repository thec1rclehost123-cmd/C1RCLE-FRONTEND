import type { EventDetailFixture, EventLifecycle } from './types/event-detail.types';
import type { EventPublicDetailDto, PublicTicketTierDto } from '@c1rcle/contracts';

/**
 * Pure mapping from the public event-detail projection and its authoritative
 * public tier list. Missing relationships stay visibly unavailable and ticket
 * tiers are never synthesized from summary price fields.
 */

const FALLBACK_IMAGE = '/c1rcle-logo.webp';
const FALLBACK_VENUE = 'Venue TBA';
const FALLBACK_CITY = 'Location unavailable';
const FALLBACK_CATEGORY = 'Events';

const STATUS_LIFECYCLE: Record<string, EventLifecycle> = {
  published: 'scheduled',
  sales_paused: 'paused',
  started: 'scheduled',
  ended: 'completed',
  cancelled: 'cancelled',
  archived: 'completed',
};

function nonEmptyString(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function formatAddress(event: EventPublicDetailDto): string {
  if (!event.venue) return FALLBACK_CITY;
  return (
    [
      event.venue.address.street,
      event.venue.address.city,
      event.venue.address.state,
      event.venue.address.zip,
      event.venue.address.country,
    ]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(', ') || FALLBACK_CITY
  );
}

export function toEventDetailFixture(
  event: EventPublicDetailDto,
  tiers: readonly PublicTicketTierDto[],
): EventDetailFixture {
  const summary = event.summary.trim();
  const description = event.description.trim();

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    category: event.tags[0] ?? FALLBACK_CATEGORY,
    image: event.imageUrl ?? FALLBACK_IMAGE,
    accentTone: 'orange',
    startsAt: event.startAt,
    endsAt: event.endAt ?? event.startAt,
    venue: event.venue?.name ?? FALLBACK_VENUE,
    venueId: event.venue?.slug ?? null,
    address: formatAddress(event),
    city: nonEmptyString(event.venue?.address.city, FALLBACK_CITY),
    hostId: event.organizer?.slug ?? null,
    host: event.organizer ? event.organizer.name.trim() : '',
    summary: summary || 'Event details not provided.',
    description: description.length > 0 ? [description] : [],
    doorNote: 'Ticket and entry terms are shown during checkout when available.',
    lifecycle: STATUS_LIFECYCLE[event.status] ?? 'scheduled',
    guests: [],
    interestedCount: 0,
    ticketNote: 'Live availability',
    ticketTiers: tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      price:
        tier.priceInPaise === 0
          ? null
          : { amountPaise: tier.priceInPaise, currency: 'INR' as const },
      availabilityLabel:
        tier.availableQuantity === 0 ? 'Sold out' : `${String(tier.availableQuantity)} available`,
      availableQuantity: tier.availableQuantity,
      ...(tier.guestCount === undefined ? {} : { guestCount: tier.guestCount }),
      ...(tier.admissionMode === undefined ? {} : { admissionMode: tier.admissionMode }),
    })),
  };
}
