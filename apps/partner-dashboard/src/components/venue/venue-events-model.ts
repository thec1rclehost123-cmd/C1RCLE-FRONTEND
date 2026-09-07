export type EventStatus = 'Live' | 'Confirmed' | 'Draft' | 'Past' | 'Cancelled';

export type VenueEventTab = 'upcoming' | 'live' | 'drafts' | 'past';

export interface VenueEvent {
  readonly id: string;
  readonly name: string;
  readonly status: EventStatus;
  readonly statusDetail: string;
  readonly meta: string;
  readonly metaShort: string;
  readonly category: string;
  readonly format: string;
  readonly ticketsSold: number;
  readonly capacity: number;
  readonly pct: string;
  readonly pctN: number;
  readonly revenuePaise: number;
  readonly revenue: string;
  readonly price: string;
  readonly tint: string;
  readonly card: string;
  readonly artworkSrc: string;
  readonly artworkAlt: string;
  readonly venue: string;
  readonly city: string;
  readonly dateIso: string;
  readonly dateLabel: string;
  readonly dayLabel: string;
  readonly day: string;
  readonly month: string;
  readonly time: string;
  readonly host: string;
  readonly isTonight?: boolean;
}

export interface VenueEventSource {
  readonly totalCount: number;
  readonly events: readonly VenueEvent[];
  readonly tabCounts: Readonly<Record<VenueEventTab, number>>;
  readonly pagination: {
    readonly pageSize: number;
    readonly hasPreviousPage: boolean;
    readonly hasNextPage: boolean;
  };
}

const percentage = (sold: number, capacity: number): number =>
  capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;

const formatInr = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

const createEvent = (event: Omit<VenueEvent, 'pct' | 'pctN' | 'revenue'>): VenueEvent => {
  const soldPercent = percentage(event.ticketsSold, event.capacity);
  return {
    ...event,
    pct: `${String(soldPercent)}%`,
    pctN: soldPercent,
    revenue: formatInr(event.revenuePaise),
  };
};

/**
 * Focused Venue Events source for the approved Events milestone.
 *
 * This replaces the Events slice that previously lived inside the monolithic
 * Venue Studio fixture. Existing Event Detail and Create Event consumers are
 * re-exported to this same source until their own approved milestones begin.
 */
export const EVENTS: readonly VenueEvent[] = [
  createEvent({
    id: 'neon-nights-afrobeats',
    name: 'Neon Nights: Afrobeats',
    status: 'Live',
    statusDetail: 'On going',
    meta: 'Kitty Su Mumbai · Sat, 24 May 2025 · 10:00 PM',
    metaShort: 'Kitty Su Mumbai · 24 May 2025',
    category: 'Afrobeats',
    format: 'Club Night',
    ticketsSold: 842,
    capacity: 1_000,
    revenuePaise: 67_280_000,
    price: '₹800',
    tint: 'linear-gradient(135deg,#f44a22,#551213)',
    card: 'linear-gradient(158deg,#d1490c,#7a1f00 52%,#2a0f04)',
    artworkSrc: '/venue/neon-nights-poster.webp',
    artworkAlt: 'Neon Nights: Afrobeats event artwork',
    venue: 'Kitty Su Mumbai',
    city: 'Mumbai',
    dateIso: '2025-05-24',
    dateLabel: '24 May 2025',
    dayLabel: 'Sat',
    day: '24',
    month: 'MAY',
    time: '10:00 PM',
    host: 'Rhea Kapoor',
    isTonight: true,
  }),
  createEvent({
    id: 'sunset-sessions-vol-4',
    name: 'Sunset Sessions Vol. 4',
    status: 'Confirmed',
    statusDetail: 'Upcoming',
    meta: 'Aurus, Lower Parel · Sun, 25 May 2025 · 5:00 PM',
    metaShort: 'Aurus, Lower Parel · 25 May 2025',
    category: 'House',
    format: 'Sunset Party',
    ticketsSold: 623,
    capacity: 800,
    revenuePaise: 49_840_000,
    price: '₹800',
    tint: 'linear-gradient(135deg,#f59e0b,#6d2709)',
    card: 'linear-gradient(158deg,#b8860b,#6b4e0a 52%,#241a04)',
    artworkSrc: '/venue/events/sunset-sessions.webp',
    artworkAlt: 'Sunset Sessions Vol. 4 event artwork',
    venue: 'Aurus, Lower Parel',
    city: 'Mumbai',
    dateIso: '2025-05-25',
    dateLabel: '25 May 2025',
    dayLabel: 'Sun',
    day: '25',
    month: 'MAY',
    time: '5:00 PM',
    host: 'Rhea Kapoor',
  }),
  createEvent({
    id: 'warehouse-rave',
    name: 'Warehouse Rave',
    status: 'Live',
    statusDetail: 'On going',
    meta: 'antiSOCIAL · Sat, 24 May 2025 · 11:00 PM',
    metaShort: 'antiSOCIAL · 24 May 2025',
    category: 'Techno',
    format: 'Rave',
    ticketsSold: 1_124,
    capacity: 1_500,
    revenuePaise: 78_630_000,
    price: '₹700',
    tint: 'linear-gradient(135deg,#4b5563,#101216)',
    card: 'linear-gradient(158deg,#4b5563,#1f2937 52%,#0c1013)',
    artworkSrc: '/venue/events/warehouse-rave.webp',
    artworkAlt: 'Warehouse Rave event artwork',
    venue: 'antiSOCIAL',
    city: 'Delhi',
    dateIso: '2025-05-24',
    dateLabel: '24 May 2025',
    dayLabel: 'Sat',
    day: '24',
    month: 'MAY',
    time: '11:00 PM',
    host: 'Pulse Collective',
  }),
  createEvent({
    id: 'bollywood-brunch',
    name: 'Bollywood Brunch',
    status: 'Confirmed',
    statusDetail: 'Upcoming',
    meta: 'Hitchki BKC · Sun, 1 Jun 2025 · 1:00 PM',
    metaShort: 'Hitchki BKC · 1 Jun 2025',
    category: 'Bollywood',
    format: 'Brunch',
    ticketsSold: 312,
    capacity: 600,
    revenuePaise: 23_400_000,
    price: '₹750',
    tint: 'linear-gradient(135deg,#d35b2b,#7a1b20)',
    card: 'linear-gradient(158deg,#be185d,#6d1a3a 52%,#240612)',
    artworkSrc: '/venue/events/bollywood-brunch.webp',
    artworkAlt: 'Bollywood Brunch event artwork',
    venue: 'Hitchki BKC',
    city: 'Mumbai',
    dateIso: '2025-06-01',
    dateLabel: '1 Jun 2025',
    dayLabel: 'Sun',
    day: '01',
    month: 'JUN',
    time: '1:00 PM',
    host: 'Rhea Kapoor',
  }),
  createEvent({
    id: 'monsoon-sessions',
    name: 'Monsoon Sessions',
    status: 'Draft',
    statusDetail: 'Setup pending',
    meta: 'Bonobo, Bandra · Sun, 8 Jun 2025 · 8:00 PM',
    metaShort: 'Bonobo, Bandra · 8 Jun 2025',
    category: 'Deep House',
    format: 'Club Night',
    ticketsSold: 0,
    capacity: 700,
    revenuePaise: 0,
    price: '₹900',
    tint: 'linear-gradient(135deg,#0d7084,#082839)',
    card: 'linear-gradient(158deg,#0d7a6e,#064a42 52%,#03231f)',
    artworkSrc: '/venue/events/monsoon-sessions.webp',
    artworkAlt: 'Monsoon Sessions event artwork',
    venue: 'Bonobo, Bandra',
    city: 'Mumbai',
    dateIso: '2025-06-08',
    dateLabel: '8 Jun 2025',
    dayLabel: 'Sun',
    day: '08',
    month: 'JUN',
    time: '8:00 PM',
    host: 'Rhea Kapoor',
  }),
];

export const EV_STATUS_DOT: Record<EventStatus, string> = {
  Live: '#34d399',
  Confirmed: '#f59e0b',
  Draft: '#f87171',
  Past: '#92969d',
  Cancelled: '#f87171',
};

export const eventCardBg = (index: number, fallback: string): string => {
  const event = EVENTS[index];
  return event
    ? `position:absolute;inset:0;background-image:url(${event.artworkSrc});background-size:cover;background-position:center;`
    : `position:absolute;inset:0;background:${fallback};`;
};

export const venueEventSource: VenueEventSource = {
  totalCount: 128,
  events: EVENTS,
  tabCounts: {
    upcoming: 8,
    live: 2,
    drafts: 3,
    past: 115,
  },
  pagination: {
    pageSize: 5,
    hasPreviousPage: false,
    hasNextPage: false,
  },
};
