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
  const venueName = venue?.name ?? FALLBACK_VENUE;
  const city = venue?.city ?? FALLBACK_CITY;
  const availableQuantity = tiers?.reduce((sum, tier) => sum + tier.availableQuantity, 0) ?? null;
  const availability =
    tiers === null || tiers.length === 0
      ? 'unavailable'
      : availableQuantity === 0
        ? 'sold-out'
        : 'available';
  const minimumPrice =
    tiers && tiers.length > 0 ? Math.min(...tiers.map((tier) => tier.priceInPaise)) : null;
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
    cityKey: venue ? toCityKey(city) : '',
    price:
      minimumPrice === null || minimumPrice === 0
        ? null
        : { amountPaise: minimumPrice, currency: 'INR' },
    isFree: event.isFree,
    summary: event.summary,
    availability,
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
