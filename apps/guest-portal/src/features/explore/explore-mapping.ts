import type { ExploreCity, ExploreEvent } from './types/explore.types';
import type { EventDto, PublicTicketTierDto, VenueDto } from '@c1rcle/contracts';

/**
 * ─── Backend → explore card mapping ──────────────────────────────────────────
 * Pure mapping from the public discovery wire DTOs (`GET
 * /api/v2/public/discovery` + per-venue `GET /api/v2/public/venues/by-id/:id`)
 * to the presentational `ExploreEvent` the hero/discovery clients render.
 * Only published/discoverable events ever reach this module — the backend's
 * `PublicService` (via `isPublic`) guarantees that, never a draft/cancelled
 * event. No fetch, no fallback fixtures: missing venue data renders honest
 * placeholders, never invented events.
 */

const FALLBACK_IMAGE = '/c1rcle-logo.webp';
const FALLBACK_VENUE = 'Venue TBA';
const FALLBACK_CITY = 'Location unavailable';
const FALLBACK_CATEGORY = 'Events';

export function toCityKey(city: string): string {
  return city.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function toExploreEvent(
  event: EventDto,
  venue: VenueDto | null,
  tiers: readonly PublicTicketTierDto[] | null,
): ExploreEvent {
  const venueName = event.externalLocation?.name ?? venue?.name ?? FALLBACK_VENUE;
  const city = event.externalLocation?.city ?? venue?.city ?? FALLBACK_CITY;
  const purchasableTiers =
    tiers?.filter(
      (tier) =>
        tier.availabilityStatus === 'available' ||
        (tier.availabilityStatus === undefined && tier.availableQuantity > 0),
    ) ?? null;
  const availableQuantity =
    purchasableTiers?.reduce((sum, tier) => sum + tier.availableQuantity, 0) ?? null;
  const availability =
    event.salesStatus === 'ended' ||
    event.salesStatus === 'sales_paused' ||
    event.salesStatus === 'not_yet_available' ||
    event.salesStatus === 'temporarily_held' ||
    event.salesStatus === 'cancelled' ||
    event.salesStatus === 'postponed'
      ? 'unavailable'
      : tiers === null || tiers.length === 0
        ? 'unavailable'
        : purchasableTiers !== null && purchasableTiers.length > 0
          ? 'available'
          : tiers.every(
                (tier) =>
                  tier.availabilityStatus === 'sold_out' ||
                  (tier.availabilityStatus === undefined && tier.availableQuantity === 0),
              )
            ? 'sold-out'
            : 'unavailable';
  const discoveryPrice =
    event.activeStartingPricePaise !== undefined
      ? event.activeStartingPricePaise
      : event.currentStartingPricePaise;
  const minimumPrice =
    purchasableTiers && purchasableTiers.length > 0
      ? Math.min(...purchasableTiers.map((tier) => tier.priceInPaise))
      : tiers !== null
        ? (discoveryPrice ?? null)
        : discoveryPrice !== undefined
          ? discoveryPrice
          : event.startingPricePaise;
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    category: event.tags[0] ?? FALLBACK_CATEGORY,
    image: event.imageUrl ?? FALLBACK_IMAGE,
    startsAt: event.startAt,
    venueId: event.venueId,
    venueSlug: venue?.slug ?? null,
    venue: venueName,
    city,
    cityKey: venue || event.externalLocation?.city ? toCityKey(city) : '',
    price:
      minimumPrice === null || minimumPrice === 0
        ? null
        : { amountPaise: minimumPrice, currency: 'INR' },
    isFree: event.isFree,
    summary: event.summary,
    availability,
    ...(event.salesStatus ? { salesStatus: event.salesStatus } : {}),
    availableQuantity,
  };
}

export function deriveCities(events: readonly ExploreEvent[]): ExploreCity[] {
  const seen = new Map<string, string>();
  for (const event of events) {
    if (event.cityKey && !seen.has(event.cityKey)) {
      seen.set(event.cityKey, event.city);
    }
  }
  return [
    { label: 'All Cities', value: '' },
    ...[...seen.entries()].map(([value, label]) => ({ label, value })),
  ];
}
