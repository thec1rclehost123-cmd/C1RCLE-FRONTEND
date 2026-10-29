import type { TicketStatus, TicketWalletData, UserTicketItem } from './types/tickets.types';
import type {
  EntitlementDto,
  EventCoverWalletItemDto,
  EventDto,
  OrderDto,
  VenueDto,
} from '@c1rcle/contracts';

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
const EVENT_LOOKUP_CONCURRENCY = 4;

function toTicketStatus(
  items: readonly EntitlementDto[],
  order: OrderDto | undefined,
): TicketStatus {
  if (order?.status === 'refund_requested') return 'refund_pending';
  if (order?.eventCancellation) return 'cancelled';
  if (items.every((item) => item.status === 'void') && (order?.refundedPaise ?? 0) > 0) {
    return 'refunded';
  }
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
  orders: readonly OrderDto[] = [],
  eventCovers: readonly EventCoverWalletItemDto[] = [],
): Promise<TicketWalletData> {
  const ordersById = new Map(orders.map((order) => [order.id, order]));
  const eventCoversByEntitlement = new Map(
    eventCovers.map((cover) => [cover.entitlementId, cover]),
  );
  const groups = new Map<string, EntitlementDto[]>();
  // Each entitlement is an independent admission credential. Grouping by
  // order/tier would show one QR for several separately-scannable units.
  for (const entitlement of entitlements) groups.set(entitlement.id, [entitlement]);

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

  const resolvedGroups: {
    group: EntitlementDto[];
    first: EntitlementDto;
    details: WalletEventDetails | null;
    order: OrderDto | undefined;
  }[] = [];
  const groupList = [...groups.values()];
  for (let start = 0; start < groupList.length; start += EVENT_LOOKUP_CONCURRENCY) {
    const batch = groupList.slice(start, start + EVENT_LOOKUP_CONCURRENCY);
    const resolvedBatch = await Promise.all(
      batch.map(async (group) => {
        const first = group[0];
        if (!first) return null;
        return {
          group,
          first,
          details: await detailsOf(first.eventId),
          order: ordersById.get(first.orderId),
        };
      }),
    );
    resolvedGroups.push(
      ...resolvedBatch.filter((entry): entry is NonNullable<typeof entry> => entry !== null),
    );
  }

  for (const { group, first, details, order } of resolvedGroups) {
    if (!details) {
      const status = toTicketStatus(group, order);
      pastTickets.push({
        id: first.id,
        eventId: first.eventId,
        orderId: first.orderId,
        eventSlug: null,
        startsAt: null,
        endsAt: null,
        bookingReference: order?.bookingReference ?? null,
        holderName:
          first.currentHolderUserId === null && first.userId
            ? 'Unassigned · in your custody'
            : first.holderName,
        ...(first.currentHolderUserId === null && first.userId
          ? { custody: 'unassigned' as const }
          : {}),
        eventTitle: order?.eventCancellation?.eventTitle ?? 'Event details unavailable',
        date: '',
        time: '',
        venueName: 'Venue unavailable',
        city: '',
        posterUrl: FALLBACK_POSTER,
        tierName: first.tierName,
        isVip: /vip/i.test(first.tierName),
        ticketCount: 1,
        status: order?.eventCancellation ? status : 'unavailable',
        ...(first.ticketAddons?.length
          ? {
              ticketAddons: first.ticketAddons.map(({ id, name, kind, status }) => ({
                id,
                name,
                kind,
                status,
              })),
            }
          : {}),
        ...coverSummary(eventCoversByEntitlement.get(first.id)),
      });
      continue;
    }

    const { event, venue } = details;
    const status = toTicketStatus(group, order);
    const endsAt = event.endAt ?? event.startAt;
    const ended = Number.isNaN(Date.parse(endsAt)) ? false : Date.parse(endsAt) <= now.getTime();
    const startsAt = new Date(event.startAt);

    const ticket: UserTicketItem = {
      id: first.id,
      orderId: first.orderId,
      eventId: event.id,
      eventSlug: event.slug,
      startsAt: event.startAt,
      endsAt: event.endAt ?? null,
      bookingReference: order?.bookingReference ?? null,
      holderName:
        first.currentHolderUserId === null && first.userId
          ? 'Unassigned · in your custody'
          : first.holderName,
      ...(first.currentHolderUserId === null && first.userId
        ? { custody: 'unassigned' as const }
        : {}),
      eventTitle: event.title,
      date: Number.isNaN(startsAt.getTime()) ? event.title : dateFormatter.format(startsAt),
      time: Number.isNaN(startsAt.getTime()) ? '' : `${timeFormatter.format(startsAt)} IST`,
      venueName: venue?.name ?? 'Venue TBA',
      city: venue?.city ?? '',
      posterUrl: event.imageUrl ?? FALLBACK_POSTER,
      tierName: first.tierName,
      isVip: /vip/i.test(first.tierName),
      ticketCount: 1,
      status,
      ...(first.ticketAddons?.length
        ? {
            ticketAddons: first.ticketAddons.map(({ id, name, kind, status }) => ({
              id,
              name,
              kind,
              status,
            })),
          }
        : {}),
      ...coverSummary(eventCoversByEntitlement.get(first.id)),
    };

    if (status === 'active' && !ended) {
      upcomingTickets.push(ticket);
    } else {
      pastTickets.push(ticket);
    }
  }

  return { upcomingTickets, pastTickets };
}

function coverSummary(cover: EventCoverWalletItemDto | undefined) {
  if (!cover) return {};
  return {
    eventCover: {
      status: cover.status,
      issuedPaise: cover.issuedPaise,
      remainingPaise: cover.remainingPaise,
      reservedPaise: cover.reservedPaise,
      redeemedPaise: cover.redeemedPaise,
      refundedPaise: cover.refundedPaise,
      history: cover.history,
    },
  };
}
