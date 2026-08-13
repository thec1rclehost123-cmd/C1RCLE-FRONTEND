import type {
  AnonymousOrder,
  PromoterCanonicalLink,
  PromoterStudioEvent,
} from './promoter-studio-model';

export interface PromoterEventDetailModel {
  readonly event: PromoterStudioEvent;
  readonly link: PromoterCanonicalLink | null;
  readonly orders: readonly AnonymousOrder[];
  readonly metrics: {
    readonly tickets: string;
    readonly clicks: string;
    readonly conversion: string;
    readonly commission: string;
  };
}

export const acceptedEvents: readonly PromoterStudioEvent[] = [
  {
    id: 'neon-nights-afrobeats',
    name: 'Neon Nights: Afrobeats',
    venue: 'Skyline Rooftop',
    host: 'Rhea Kapoor',
    city: 'Mumbai',
    date: 'Thu, 16 Jul',
    time: '10:00 PM',
    category: 'Afrobeats',
    state: 'accepted',
    poster: '/venue/events/neon-nights.webp',
    commission: '₹120 per ticket',
    tickets: 340,
    clicks: 1842,
    orders: 226,
    earnedPaise: 4080000,
    linkId: 'lnk-neon',
  },
  {
    id: 'sunset-sessions',
    name: 'Sunset Sessions Vol. 4',
    venue: 'Blue Room',
    host: 'Arjun Mehta',
    city: 'Mumbai',
    date: 'Sun, 19 Jul',
    time: '5:00 PM',
    category: 'House',
    state: 'accepted',
    poster: '/venue/events/sunset-sessions.webp',
    commission: '10% of attributed sales',
    tickets: 0,
    clicks: 0,
    orders: 0,
    earnedPaise: 0,
  },
  {
    id: 'warehouse-rave',
    name: 'Warehouse Rave',
    venue: 'District Warehouse',
    host: 'Maya Shah',
    city: 'Mumbai',
    date: 'Thu, 30 Jul',
    time: '11:00 PM',
    category: 'Techno',
    state: 'accepted',
    poster: '/venue/events/warehouse-rave.webp',
    commission: '₹95 per ticket',
    tickets: 188,
    clicks: 1016,
    orders: 132,
    earnedPaise: 1786000,
    linkId: 'lnk-warehouse',
  },
] as const;

export const canonicalLinks: readonly PromoterCanonicalLink[] = [
  {
    id: 'lnk-neon',
    eventId: 'neon-nights-afrobeats',
    eventName: 'Neon Nights: Afrobeats',
    url: 'thec1rcle.app/e/neon/cz',
    createdAt: '10 Jul 2026',
    clicks: 1842,
    orders: 226,
    tickets: 340,
    earnedPaise: 4080000,
  },
  {
    id: 'lnk-warehouse',
    eventId: 'warehouse-rave',
    eventName: 'Warehouse Rave',
    url: 'thec1rcle.app/e/warehouse/cz',
    createdAt: '18 Jul 2026',
    clicks: 1016,
    orders: 132,
    tickets: 188,
    earnedPaise: 1786000,
  },
] as const;

export const anonymousOrders: readonly AnonymousOrder[] = [
  {
    id: 'C1-84F2',
    eventId: 'neon-nights-afrobeats',
    createdAt: 'Today, 7:42 PM',
    tickets: 2,
    grossPaise: 259800,
    commissionPaise: 24000,
    status: 'confirmed',
  },
  {
    id: 'C1-7BC1',
    eventId: 'neon-nights-afrobeats',
    createdAt: 'Today, 6:18 PM',
    tickets: 1,
    grossPaise: 129900,
    commissionPaise: 12000,
    status: 'confirmed',
  },
  {
    id: 'C1-29A8',
    eventId: 'warehouse-rave',
    createdAt: 'Yesterday, 11:02 PM',
    tickets: 4,
    grossPaise: 519600,
    commissionPaise: 38000,
    status: 'confirmed',
  },
  {
    id: 'C1-10DE',
    eventId: 'neon-nights-afrobeats',
    createdAt: 'Yesterday, 9:36 PM',
    tickets: 1,
    grossPaise: 129900,
    commissionPaise: -12000,
    status: 'refunded',
  },
] as const;

export const conversionRate = (orders: number, clicks: number): number =>
  clicks > 0 ? Math.round((orders / clicks) * 1000) / 10 : 0;

export const formatInr = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

export const linkForEvent = (eventId: string): PromoterCanonicalLink | undefined =>
  canonicalLinks.find((link) => link.eventId === eventId);

export const linkById = (id: string): PromoterCanonicalLink | undefined =>
  canonicalLinks.find((link) => link.id === id);

export const eventDetailById = (eventId: string): PromoterEventDetailModel | undefined => {
  const event = acceptedEvents.find((item) => item.id === eventId);
  if (!event) return undefined;
  const link = linkForEvent(event.id) ?? null;
  return {
    event,
    link,
    orders: anonymousOrders.filter((order) => order.eventId === event.id),
    metrics: {
      tickets: link?.tickets.toLocaleString('en-IN') ?? '—',
      clicks: link?.clicks.toLocaleString('en-IN') ?? '—',
      conversion: link ? `${conversionRate(link.orders, link.clicks).toString()}%` : '—',
      commission: link ? formatInr(link.earnedPaise) : '—',
    },
  };
};
