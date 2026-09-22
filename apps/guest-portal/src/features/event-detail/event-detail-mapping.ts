import type {
  EventAccentTone,
  EventDetailFixture,
  EventLifecycle,
} from './types/event-detail.types';
import type { EventDto, HostPublicDto, VenueDto } from '@c1rcle/contracts';


/**
 * ─── Backend → event detail mapping ──────────────────────────────────────────
 * Pure mapping from the public wire DTOs (`GET /api/v2/public/events/:idOrSlug`
 * + per-event venue/host by-id lookups) to the presentational
 * `EventDetailFixture` that `EventDetailView` renders. Only published events
 * ever reach this module — `GET /public/events/:idOrSlug` 404s anything else.
 * No fetch, no fallback fixtures: missing venue/host data renders honest
 * placeholders, never invented events.
 *
 * Ticket tiers and guestlist have no public read endpoints yet, so the ticket
 * section gets one tier derived from the event's real price fields and the
 * guestlist stays empty (the view skips it when there are no guests).
 */

const FALLBACK_IMAGE = '/c1rcle-logo.webp';
const FALLBACK_VENUE = 'Venue TBA';
const FALLBACK_CITY = 'India';
const FALLBACK_CATEGORY = 'Events';
const FALLBACK_HOST_NAME = 'Host TBA';
const FALLBACK_HOST_ID = 'host-tba';

const ACCENT_TONES: readonly EventAccentTone[] = ['pink', 'purple', 'red', 'orange'];

const STATUS_LIFECYCLE: Record<string, EventLifecycle> = {
  published: 'scheduled',
  sales_paused: 'paused',
  started: 'scheduled',
  ended: 'completed',
  cancelled: 'cancelled',
  archived: 'completed',
};

export function toEventDetailFixture(
  event: EventDto,
  venue: VenueDto | null,
  host: HostPublicDto | null,
): EventDetailFixture {
  const city = venue?.city ?? FALLBACK_CITY;
  const summary = event.summary.trim();
  const description = event.description.trim();
  const details = [summary, description].filter((part) => part.length > 0);

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    category: event.tags[0] ?? FALLBACK_CATEGORY,
    image: event.imageUrl ?? FALLBACK_IMAGE,
    accentTone: ACCENT_TONES[event.title.length % ACCENT_TONES.length] ?? 'purple',
    startsAt: event.startAt,
    endsAt: event.endAt ?? event.startAt,
    venue: venue?.name ?? FALLBACK_VENUE,
    venueId: event.venueId ?? 'venue-tba',
    address: city,
    city,
    hostId: host?.slug ?? FALLBACK_HOST_ID,
    host: host?.name ?? FALLBACK_HOST_NAME,
    summary: summary || `${event.title} — details below.`,
    description: details.length > 0 ? details : ['More details will be announced soon.'],
    doorNote: 'Entry rules are set by the host and shown at checkout.',
    lifecycle: STATUS_LIFECYCLE[event.status] ?? 'scheduled',
    guests: [],
    interestedCount: 0,
    ticketNote: 'Live pricing',
    ticketTiers: [
      {
        id: 'general-admission',
        name: 'General Admission',
        description: summary,
        price:
          event.isFree || event.startingPricePaise === null
            ? null
            : { amountPaise: event.startingPricePaise, currency: 'INR' },
        availabilityLabel: 'Available at checkout',
      },
    ],
  };
}
