import type { BookingEventFixture, BookingTicketTier } from './types/booking.types';
import type { EventAccentTone } from '@/features/event-detail/types/event-detail.types';
import type { EventDto, PublicTicketTierDto, VenueDto } from '@c1rcle/contracts';


/**
 * ─── Backend → checkout mapping ──────────────────────────────────────────────
 * Pure mapping from the public event wire DTO (`GET
 * /api/v2/public/events/:idOrSlug` + venue by-id lookup) to the
 * `BookingEventFixture` that `CheckoutView` renders. Only published events
 * ever reach this module — the public endpoint 404s anything else. No fetch,
 * no fallback fixtures: a missing venue renders honest placeholders.
 *
 * Ticket tiers come from `GET /api/v2/public/events/:idOrSlug/tiers` when the
 * caller passes them (real ids the RSVP endpoint accepts). Without tiers the
 * section falls back to one tier derived from the event's price fields — the
 * previous preview behavior, kept for paid events with no public tier read.
 * Zero-price tiers cap at 1 (the server fulfills exactly one RSVP ticket per
 * account per event); others keep the UI stepper cap.
 */

const FALLBACK_IMAGE = '/c1rcle-logo.webp';
const FALLBACK_VENUE = 'Venue TBA';
const FALLBACK_CITY = 'India';
const FALLBACK_CATEGORY = 'Events';
const PREVIEW_MAX_QUANTITY = 10;

const ACCENT_TONES: readonly EventAccentTone[] = ['pink', 'purple', 'red', 'orange'];

export function toBookingEventFixture(
  event: EventDto,
  venue: VenueDto | null,
  tiers: readonly PublicTicketTierDto[] | null = null,
): BookingEventFixture {
  const city = venue?.city ?? FALLBACK_CITY;
  return {
    id: event.slug,
    title: event.title,
    category: event.tags[0] ?? FALLBACK_CATEGORY,
    image: event.imageUrl ?? FALLBACK_IMAGE,
    accentTone: ACCENT_TONES[event.title.length % ACCENT_TONES.length] ?? 'purple',
    startsAt: event.startAt,
    venue: venue?.name ?? FALLBACK_VENUE,
    address: city,
    city,
    doorNote: 'Entry rules are set by the host and shown at checkout.',
    ticketTiers: tiers !== null ? toRealTiers(tiers) : [toFallbackTier(event)],
  };
}

function toRealTiers(tiers: readonly PublicTicketTierDto[]): BookingTicketTier[] {
  // Sold-out tiers stay unselectable — the stepper caps at their live
  // availability, so a zero-availability tier offers no quantity.
  return tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    description: tier.description || tier.name,
    price: { amountPaise: tier.priceInPaise, currency: 'INR' },
    // RSVP fulfills exactly one ticket per account — the stepper must not
    // offer more. Paid tiers cap at live availability (bounded by the UI cap).
    maximumQuantity:
      tier.priceInPaise === 0
        ? Math.min(1, tier.availableQuantity)
        : Math.min(tier.availableQuantity, PREVIEW_MAX_QUANTITY),
  }));
}

function toFallbackTier(event: EventDto): BookingTicketTier {
  return {
    id: 'general-admission',
    name: 'General Admission',
    description: event.summary.trim() || event.title,
    price: {
      amountPaise: event.isFree ? 0 : (event.startingPricePaise ?? 0),
      currency: 'INR',
    },
    maximumQuantity: PREVIEW_MAX_QUANTITY,
  };
}
