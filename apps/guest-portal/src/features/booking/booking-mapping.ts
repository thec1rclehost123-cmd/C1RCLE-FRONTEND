import type {
  BookingEventFixture,
  BookingTicketAddon,
  BookingTicketTier,
} from './types/booking.types';
import type { EventAccentTone } from '@/features/event-detail/types/event-detail.types';
import type {
  EventDto,
  EventPublicDetailDto,
  PublicTicketAddonDto,
  PublicTicketTierDto,
  VenueDto,
} from '@c1rcle/contracts';

/**
 * ─── Backend → checkout mapping ──────────────────────────────────────────────
 * Pure mapping from the public event wire DTO (`GET
 * /api/v2/public/events/:idOrSlug` + venue by-id lookup) to the
 * `BookingEventFixture` that `CheckoutView` renders. Only published events
 * ever reach this module — the public endpoint 404s anything else. No fetch,
 * no fallback fixtures: a missing venue renders honest placeholders.
 *
 * Ticket tiers always come from `GET /api/v2/public/events/:idOrSlug/tiers`.
 * The mapper deliberately cannot synthesize a tier: checkout must never send
 * a made-up id or price to inventory or a payment provider.
 * Zero-price tiers cap at 1 (the server fulfills exactly one RSVP ticket per
 * account per event); others keep the UI stepper cap.
 */

const FALLBACK_VENUE = 'Venue TBA';
const FALLBACK_CITY = 'India';
const FALLBACK_CATEGORY = 'Events';
const PREVIEW_MAX_QUANTITY = 10;

const ACCENT_TONES: readonly EventAccentTone[] = ['pink', 'purple', 'red', 'orange'];

export function toBookingEventFixture(
  event: EventDto,
  venue: VenueDto | null,
  tiers: readonly PublicTicketTierDto[],
  addons: readonly PublicTicketAddonDto[] = [],
): BookingEventFixture {
  const city = venue?.city ?? FALLBACK_CITY;
  return {
    id: event.slug,
    eventId: event.id,
    title: event.title,
    category: event.tags[0] ?? FALLBACK_CATEGORY,
    // Do not present the brand logo as event artwork when no poster exists.
    image: event.imageUrl ?? '',
    accentTone: ACCENT_TONES[event.title.length % ACCENT_TONES.length] ?? 'purple',
    startsAt: event.startAt,
    venue: venue?.name ?? FALLBACK_VENUE,
    address: city,
    city,
    doorNote: 'Entry rules are set by the host and shown at checkout.',
    ticketTiers: toRealTiers(tiers),
    ticketAddons: toRealAddons(addons),
    purchasable: tiers.some((tier) => tier.availableQuantity > 0),
  };
}

/** Reuse the event detail page's already-loaded public projection for overlay checkout. */
export function toBookingEventFromPublicDetail(
  event: EventPublicDetailDto,
  tiers: readonly PublicTicketTierDto[],
): BookingEventFixture {
  const city = event.venue?.address.city ?? FALLBACK_CITY;
  return {
    id: event.slug,
    eventId: event.id,
    title: event.title,
    category: event.tags[0] ?? FALLBACK_CATEGORY,
    image: event.imageUrl ?? '',
    accentTone: ACCENT_TONES[event.title.length % ACCENT_TONES.length] ?? 'purple',
    startsAt: event.startAt,
    venue: event.venue?.name ?? FALLBACK_VENUE,
    address: city,
    city,
    doorNote: 'Entry rules are set by the host and shown at checkout.',
    ticketTiers: toRealTiers(tiers),
    purchasable: tiers.some((tier) => tier.availableQuantity > 0),
  };
}

function toRealAddons(addons: readonly PublicTicketAddonDto[]): BookingTicketAddon[] {
  return addons.map((addon) => ({
    id: addon.id,
    name: addon.name,
    description: addon.description,
    kind: addon.kind,
    priceInPaise: addon.priceInPaise,
    availableQuantity: addon.availableQuantity,
    maxPerEntitlement: addon.maxPerEntitlement,
  }));
}

function toRealTiers(tiers: readonly PublicTicketTierDto[]): BookingTicketTier[] {
  // Sold-out tiers stay unselectable — the stepper caps at their live
  // availability, so a zero-availability tier offers no quantity.
  return tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    description: tier.description || tier.name,
    price: { amountPaise: tier.priceInPaise, currency: 'INR' },
    ...(tier.coverAmountPaise === undefined ? {} : { coverAmountPaise: tier.coverAmountPaise }),
    // RSVP fulfills exactly one ticket per account — the stepper must not
    // offer more. Paid tiers cap at live availability (bounded by the UI cap).
    maximumQuantity:
      tier.priceInPaise === 0
        ? Math.min(1, tier.availableQuantity)
        : Math.min(tier.availableQuantity, PREVIEW_MAX_QUANTITY),
    ...(tier.guestCount === undefined ? {} : { guestCount: tier.guestCount }),
    ...(tier.admissionMode === undefined ? {} : { admissionMode: tier.admissionMode }),
    ...(tier.audienceType === undefined ? {} : { audienceType: tier.audienceType }),
    ...(tier.minAge === undefined ? {} : { minAge: tier.minAge }),
    ...(tier.maxAge === undefined ? {} : { maxAge: tier.maxAge }),
  }));
}
