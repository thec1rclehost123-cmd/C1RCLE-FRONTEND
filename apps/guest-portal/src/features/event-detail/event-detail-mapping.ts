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
  postponed: 'postponed',
  started: 'scheduled',
  ended: 'completed',
  cancelled: 'cancelled',
  archived: 'completed',
};

const eventDateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Kolkata',
});

export function formatEventDateTimeRange(startsAt: string, endsAt: string): string {
  const start = eventDateFormatter.format(new Date(startsAt));
  return Date.parse(endsAt) > Date.parse(startsAt)
    ? `${start} – ${eventDateFormatter.format(new Date(endsAt))}`
    : start;
}

function nonEmptyString(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function formatAddress(event: EventPublicDetailDto): string {
  if (event.externalLocation) return event.externalLocation.address ?? FALLBACK_CITY;
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

function tierAvailabilityLabel(tier: PublicTicketTierDto): string {
  switch (tier.availabilityStatus) {
    case 'sold_out':
      return 'Sold out';
    case 'temporarily_held':
      return 'Temporarily reserved';
    case 'not_yet_available':
      return 'Not on sale yet';
    case 'sales_ended':
      return 'Sales ended';
    case 'sales_paused':
      return 'Sales paused';
    case 'pricing_unavailable':
      return 'Price unavailable';
    case 'available':
      return tier.availableQuantity === 0
        ? 'Sold out'
        : `${String(tier.availableQuantity)} available`;
    case undefined:
      return tier.availableQuantity === 0
        ? 'Sold out'
        : `${String(tier.availableQuantity)} available`;
    default:
      return tier.availableQuantity === 0
        ? 'Sold out'
        : `${String(tier.availableQuantity)} available`;
  }
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
    venue: event.externalLocation?.name ?? event.venue?.name ?? FALLBACK_VENUE,
    venueId: event.venue?.slug ?? null,
    address: formatAddress(event),
    city: nonEmptyString(event.externalLocation?.city ?? event.venue?.address.city, FALLBACK_CITY),
    ...(event.externalLocation?.mapUrl ? { mapUrl: event.externalLocation.mapUrl } : {}),
    hostId: event.organizer?.slug ?? null,
    host: event.organizer ? event.organizer.name.trim() : '',
    summary: summary || 'Event details not provided.',
    description: description.length > 0 ? [description] : [],
    ...(event.media ? { media: event.media } : {}),
    doorNote: 'Ticket and entry terms are shown during checkout when available.',
    lifecycle:
      event.salesStatus === 'ended'
        ? 'completed'
        : event.salesStatus === 'cancelled'
          ? 'cancelled'
          : event.salesStatus === 'postponed'
            ? 'postponed'
            : event.salesStatus === 'sold_out'
              ? 'sold_out'
              : event.salesStatus === 'sales_paused'
                ? 'paused'
                : (STATUS_LIFECYCLE[event.status] ?? 'scheduled'),
    ...(event.salesStatus ? { salesStatus: event.salesStatus } : {}),
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
      basePrice:
        (tier.basePriceInPaise ?? tier.priceInPaise) === 0
          ? null
          : {
              amountPaise: tier.basePriceInPaise ?? tier.priceInPaise,
              currency: 'INR' as const,
            },
      ...(tier.pricingPhase === undefined ? {} : { pricingPhase: tier.pricingPhase }),
      ...(tier.availabilityStatus === undefined
        ? {}
        : { availabilityStatus: tier.availabilityStatus }),
      availabilityLabel: tierAvailabilityLabel(tier),
      availableQuantity: tier.availableQuantity,
      ...(tier.audienceType === undefined ? {} : { audienceType: tier.audienceType }),
      ...(tier.minAge === undefined ? {} : { minAge: tier.minAge }),
      ...(tier.maxAge === undefined ? {} : { maxAge: tier.maxAge }),
      ...(tier.guestCount === undefined ? {} : { guestCount: tier.guestCount }),
      ...(tier.admissionMode === undefined ? {} : { admissionMode: tier.admissionMode }),
    })),
  };
}
