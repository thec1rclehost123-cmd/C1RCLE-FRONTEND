import type { BookingEventFixture } from './types/booking.types';
import type { EventAccentTone } from '@/features/event-detail/types/event-detail.types';
import type { EventDto, VenueDto } from '@c1rcle/contracts';


/**
 * ─── Backend → checkout mapping ──────────────────────────────────────────────
 * Pure mapping from the public event wire DTO (`GET
 * /api/v2/public/events/:idOrSlug` + venue by-id lookup) to the
 * `BookingEventFixture` that `CheckoutView` renders. Only published events
 * ever reach this module — the public endpoint 404s anything else. No fetch,
 * no fallback fixtures: a missing venue renders honest placeholders.
 *
 * The ticket section gets one tier derived from the event's real price
 * fields — there is no public tier listing yet, and no payment is processed
 * (the flow still ends at the preview confirmation). `maximumQuantity` is a
 * UI stepper cap only.
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
    ticketTiers: [
      {
        id: 'general-admission',
        name: 'General Admission',
        description: event.summary.trim() || event.title,
        price: {
          amountPaise: event.isFree ? 0 : (event.startingPricePaise ?? 0),
          currency: 'INR',
        },
        maximumQuantity: PREVIEW_MAX_QUANTITY,
      },
    ],
  };
}
