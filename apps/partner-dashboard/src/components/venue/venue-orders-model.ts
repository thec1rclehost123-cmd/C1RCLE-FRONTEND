import { formatInrOrUnavailable } from './venue-finance-model';

export type VenueOrderStatus = 'Paid' | 'Pending' | 'Refunded';

export interface VenueOrderSource {
  readonly id: string;
  readonly purchaser: string;
  readonly email: string;
  readonly placedAt: string;
  readonly event: string;
  readonly ticketQuantity: number;
  readonly totalPaise: number;
  readonly status: VenueOrderStatus;
}

export interface VenueOrder extends VenueOrderSource {
  readonly initials: string;
  readonly total: string;
}

const initialsFor = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('en-IN') ?? '')
    .join('');

export const venueOrderSource: readonly VenueOrderSource[] = [
  {
    id: 'C1-251145',
    purchaser: 'Shelby Adams',
    email: 'shelby.adams@example.com',
    placedAt: '16 Jul 2025, 10:15 PM',
    event: 'Neon Nights: Afrobeats',
    ticketQuantity: 2,
    totalPaise: 399_800,
    status: 'Paid',
  },
  {
    id: 'C1-250982',
    purchaser: 'Aayush Divase',
    email: 'aayush@example.com',
    placedAt: '16 Jul 2025, 9:42 PM',
    event: 'Neon Nights: Afrobeats',
    ticketQuantity: 1,
    totalPaise: 79_900,
    status: 'Paid',
  },
  {
    id: 'C1-250841',
    purchaser: 'Riya Mehta',
    email: 'riya.mehta@example.com',
    placedAt: '15 Jul 2025, 8:18 PM',
    event: 'Sunset Sessions Vol. 4',
    ticketQuantity: 4,
    totalPaise: 799_600,
    status: 'Paid',
  },
  {
    id: 'C1-250706',
    purchaser: 'Kabir Shah',
    email: 'kabir.shah@example.com',
    placedAt: '15 Jul 2025, 6:05 PM',
    event: 'Warehouse Rave',
    ticketQuantity: 3,
    totalPaise: 389_700,
    status: 'Refunded',
  },
  {
    id: 'C1-250655',
    purchaser: 'Maya Iyer',
    email: 'maya.iyer@example.com',
    placedAt: '14 Jul 2025, 11:30 PM',
    event: 'Bollywood Brunch',
    ticketQuantity: 2,
    totalPaise: 259_800,
    status: 'Paid',
  },
  {
    id: 'C1-250524',
    purchaser: 'Arjun Kapoor',
    email: 'arjun.kapoor@example.com',
    placedAt: '14 Jul 2025, 7:52 PM',
    event: 'Sunset Sessions Vol. 4',
    ticketQuantity: 6,
    totalPaise: 1_199_400,
    status: 'Pending',
  },
  {
    id: 'C1-250418',
    purchaser: 'Tara Singh',
    email: 'tara.singh@example.com',
    placedAt: '13 Jul 2025, 9:16 PM',
    event: 'Warehouse Rave',
    ticketQuantity: 2,
    totalPaise: 399_800,
    status: 'Paid',
  },
  {
    id: 'C1-250307',
    purchaser: 'Neil Dsouza',
    email: 'neil.dsouza@example.com',
    placedAt: '13 Jul 2025, 5:03 PM',
    event: 'Neon Nights: Afrobeats',
    ticketQuantity: 1,
    totalPaise: 129_900,
    status: 'Paid',
  },
];

export const venueOrders: readonly VenueOrder[] = venueOrderSource.map((order) => ({
  ...order,
  initials: initialsFor(order.purchaser),
  total: formatInrOrUnavailable(order.totalPaise),
}));
