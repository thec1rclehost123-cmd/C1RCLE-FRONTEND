import type {
  TicketStatus,
  TicketWalletData,
  UserTicketItem,
} from './types/tickets.types';
import type { EntitlementDto, EventDto, VenueDto } from '@c1rcle/contracts';

export interface WalletEventDetails {
  event: EventDto;
  venue: VenueDto | null;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

const FALLBACK_POSTER = '/c1rcle-logo.webp';

function toTicketStatus(items: readonly EntitlementDto[]): TicketStatus {
  if (items.every((item) => item.status === 'void')) return 'cancelled';
  if (items.every((item) => item.status === 'redeemed')) return 'used';
  return 'active';
}

/**
 * ─── Wallet → ticket cards ───────────────────────────────────────────────────
 * Groups a buyer's entitlements by order + tier (one card per tier bundle —
 * a 2-unit order renders one card with `ticketCount: 2`, not two cards) and
 * resolves each card's event display data through the caller-supplied
 * resolver (public event + venue reads). Entitlements whose event no longer
 * resolves are skipped, never invented.
 *
 * Recency split: a card is past when it can no longer admit anyone
 * (`redeemed`/`void`) or its event has ended (`endAt ?? startAt` in the
 * past); otherwise it is upcoming.
 */
export async function toTicketWalletData(
  entitlements: readonly EntitlementDto[],
  resolve: (eventId: string) => Promise<WalletEventDetails | null>,
  now: Date = new Date(),
): Promise<TicketWalletData> {
  const groups = new Map<string, EntitlementDto[]>();
  for (const entitlement of entitlements) {
    const key = `${entitlement.orderId}::${entitlement.tierId}`;
    const group = groups.get(key);
    if (group) {
      group.push(entitlement);
    } else {
      groups.set(key, [entitlement]);
    }
  }

  const cache = new Map<string, Promise<WalletEventDetails | null>>();
  const detailsOf = (eventId: string): Promise<WalletEventDetails | null> => {
    const cached = cache.get(eventId);
    if (cached) return cached;
    const fetched = resolve(eventId);
    cache.set(eventId, fetched);
    return fetched;
  };

  const upcomingTickets: UserTicketItem[] = [];
  const pastTickets: UserTicketItem[] = [];

  for (const group of groups.values()) {
    const first = group[0];
    if (!first) continue;
    const details = await detailsOf(first.eventId);
    if (!details) continue;

    const { event, venue } = details;
    const status = toTicketStatus(group);
    const endsAt = event.endAt ?? event.startAt;
    const ended = Number.isNaN(Date.parse(endsAt)) ? false : Date.parse(endsAt) <= now.getTime();
    const startsAt = new Date(event.startAt);

    const ticket: UserTicketItem = {
      id: first.id,
      orderId: first.orderId,
      eventTitle: event.title,
      date: Number.isNaN(startsAt.getTime()) ? event.title : dateFormatter.format(startsAt),
      time: Number.isNaN(startsAt.getTime()) ? '' : `${timeFormatter.format(startsAt)} IST`,
      venueName: venue?.name ?? 'Venue TBA',
      city: venue?.city ?? '',
      posterUrl: event.imageUrl ?? FALLBACK_POSTER,
      tierName: first.tierName,
      isVip: /vip/i.test(first.tierName),
      ticketCount: group.length,
      qrPayload: first.id,
      status,
    };

    if (status === 'active' && !ended) {
      upcomingTickets.push(ticket);
    } else {
      pastTickets.push(ticket);
    }
  }

  return { upcomingTickets, pastTickets };
}
