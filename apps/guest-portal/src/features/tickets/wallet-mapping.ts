import type { TicketStatus, TicketWalletData, UserTicketItem } from './types/tickets.types';
import type {
  EntitlementDto,
  ManagedTicket,
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
  if (order?.status === 'paid' && order.fulfillmentState === 'pending') return 'processing';
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
 * Renders each independently issued entitlement as its own admission card and
 * resolves its event display data through the caller-supplied
 * resolver (public event + venue reads). Missing event details are retained
 * separately, without inferring that an active entitlement is past.
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
  managedTickets?: readonly ManagedTicket[],
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
  const unavailableTickets: UserTicketItem[] = [];

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
      const ticket: UserTicketItem = {
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
        tierId: first.tierId,
        isVip: /vip/i.test(first.tierName),
        ticketCount: 1,
        status: status === 'active' ? 'unavailable' : status,
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
      (status === 'processing'
        ? upcomingTickets
        : status === 'active'
          ? unavailableTickets
          : pastTickets
      ).push(ticket);
      continue;
    }

    const { event, venue } = details;
    const entitlementStatus = toTicketStatus(group, order);
    const status =
      event.status === 'cancelled'
        ? 'cancelled'
        : event.status === 'postponed' && entitlementStatus === 'active'
          ? 'postponed'
          : entitlementStatus;
    const endsAt =
      event.endAt ?? new Date(Date.parse(event.startAt) + 6 * 60 * 60_000).toISOString();
    const ended = Number.isNaN(Date.parse(endsAt)) ? false : Date.parse(endsAt) <= now.getTime();
    const startsAt = new Date(event.startAt);

    const ticket: UserTicketItem = {
      id: first.id,
      orderId: first.orderId,
      eventId: event.id,
      eventSlug: event.slug,
      startsAt: event.status === 'postponed' ? null : event.startAt,
      endsAt: event.status === 'postponed' ? null : (event.endAt ?? null),
      bookingReference: order?.bookingReference ?? null,
      holderName:
        first.currentHolderUserId === null && first.userId
          ? 'Unassigned · in your custody'
          : first.holderName,
      ...(first.currentHolderUserId === null && first.userId
        ? { custody: 'unassigned' as const }
        : {}),
      eventTitle: event.title,
      date:
        event.status === 'postponed'
          ? 'New date to be announced'
          : Number.isNaN(startsAt.getTime())
            ? event.title
            : dateFormatter.format(startsAt),
      time:
        event.status === 'postponed' || Number.isNaN(startsAt.getTime())
          ? ''
          : `${timeFormatter.format(startsAt)} IST`,
      venueName: venue?.name ?? 'Venue TBA',
      city: venue?.city ?? '',
      posterUrl: event.imageUrl ?? FALLBACK_POSTER,
      tierName: first.tierName,
      tierId: first.tierId,
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

    if (status === 'processing' || status === 'postponed' || (status === 'active' && !ended)) {
      upcomingTickets.push(ticket);
    } else {
      pastTickets.push(ticket);
    }
  }

  const known = new Map(
    [...upcomingTickets, ...pastTickets, ...unavailableTickets].map((ticket) => [
      ticket.id,
      ticket,
    ]),
  );
  for (const managed of managedTickets ?? []) {
    const existing = known.get(managed.id);
    if (existing) {
      existing.management = managed;
      existing.status =
        managed.eventStatus === 'postponed' && managed.status === 'active'
          ? 'postponed'
          : managed.status;
      existing.holderName = managed.holderName ?? 'Unassigned';
      existing.venueName = managed.venueName ?? 'Venue details unavailable';
      existing.city = managed.venueCity ?? '';
      existing.eventTitle = managed.eventTitle;
      existing.eventSlug = managed.eventSlug;
      existing.startsAt = managed.startsAt;
      existing.endsAt = managed.endsAt;
      existing.date = managed.eventStatus === 'postponed' ? 'New date to be announced' : '';
      existing.time = '';
      if (managed.startsAt && !Number.isNaN(Date.parse(managed.startsAt))) {
        const start = new Date(managed.startsAt);
        existing.startsAt = managed.startsAt;
        existing.endsAt = managed.endsAt;
        existing.date = dateFormatter.format(start);
        existing.time = `${timeFormatter.format(start)} IST`;
        existing.eventTitle = managed.eventTitle;
        existing.eventSlug = managed.eventSlug;
      }
      continue;
    }
    const start = managed.startsAt ? new Date(managed.startsAt) : null;
    const validDate = start && !Number.isNaN(start.getTime());
    const item: UserTicketItem = {
      id: managed.id,
      orderId: managed.orderId,
      eventId: managed.eventId,
      tierId: managed.tierId,
      tierName: managed.tierName,
      bookingReference: managed.bookingReference,
      holderName: managed.holderName ?? 'Unassigned',
      management: managed,
      eventTitle: managed.eventTitle,
      eventSlug: managed.eventSlug,
      startsAt: managed.startsAt,
      endsAt: managed.endsAt,
      date:
        managed.eventStatus === 'postponed'
          ? 'New date to be announced'
          : validDate
            ? dateFormatter.format(start)
            : '',
      time: validDate ? `${timeFormatter.format(start)} IST` : '',
      venueName: managed.venueName ?? 'Venue details unavailable',
      city: managed.venueCity ?? '',
      posterUrl: managed.posterUrl ?? FALLBACK_POSTER,
      ticketCount: 1,
      status:
        managed.eventStatus === 'postponed' && managed.status === 'active'
          ? 'postponed'
          : managed.status,
      ...(managed.ownership === 'unassigned' ? { custody: 'unassigned' as const } : {}),
    };
    const end =
      managed.endsAt ??
      (managed.startsAt
        ? new Date(Date.parse(managed.startsAt) + 6 * 60 * 60_000).toISOString()
        : null);
    if (item.status === 'processing' || item.status === 'postponed') upcomingTickets.push(item);
    else if (managed.status !== 'active' || (end && Date.parse(end) <= now.getTime()))
      pastTickets.push(item);
    else if (validDate) upcomingTickets.push(item);
    else unavailableTickets.push(item);
  }
  if (managedTickets !== undefined) {
    const all = [...upcomingTickets, ...pastTickets, ...unavailableTickets];
    upcomingTickets.length = 0;
    pastTickets.length = 0;
    unavailableTickets.length = 0;
    for (const item of all) {
      const end =
        item.endsAt ??
        (item.startsAt
          ? new Date(Date.parse(item.startsAt) + 6 * 60 * 60_000).toISOString()
          : null);
      if (item.status === 'processing' || item.status === 'postponed') upcomingTickets.push(item);
      else if (item.status === 'unavailable' || (item.status === 'active' && !end))
        unavailableTickets.push(item);
      else if (item.status === 'active' && end && Date.parse(end) > now.getTime())
        upcomingTickets.push(item);
      else pastTickets.push(item);
    }
  }
  return {
    upcomingTickets,
    pastTickets,
    unavailableTickets,
    ownershipAvailable: managedTickets !== undefined,
  };
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
