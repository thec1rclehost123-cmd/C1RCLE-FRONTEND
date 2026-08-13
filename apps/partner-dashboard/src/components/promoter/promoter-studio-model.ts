export type PromoterEventState = 'accepted' | 'pending' | 'requestable';

export interface PromoterStudioEvent {
  readonly id: string;
  readonly name: string;
  readonly venue: string;
  readonly host: string;
  readonly city: string;
  readonly date: string;
  readonly time: string;
  readonly category: string;
  readonly state: PromoterEventState;
  readonly poster: string;
  readonly commission: string;
  readonly tickets: number;
  readonly clicks: number;
  readonly orders: number;
  readonly earnedPaise: number;
  readonly linkId?: string;
  readonly inviteId?: string;
  readonly note?: string;
}

export interface PromoterCanonicalLink {
  readonly id: string;
  readonly eventId: string;
  readonly eventName: string;
  readonly url: string;
  readonly createdAt: string;
  readonly clicks: number;
  readonly orders: number;
  readonly tickets: number;
  readonly earnedPaise: number;
}

export interface PromoterPartnerRecord {
  readonly id: string;
  readonly kind: 'venue' | 'host';
  readonly name: string;
  readonly city: string;
  readonly category: string;
  readonly relationship: 'partnered' | 'requestable' | 'pending';
  readonly verified: boolean;
  readonly eventsTogether: number;
  readonly ticketsMoved: number;
  readonly response: string;
  readonly initials: string;
}

export interface AnonymousOrder {
  readonly id: string;
  readonly eventId: string;
  readonly createdAt: string;
  readonly tickets: number;
  readonly grossPaise: number;
  readonly commissionPaise: number;
  readonly status: 'confirmed' | 'refunded';
}

export const promoterProfile = {
  id: 'promoter-cz',
  name: 'Club Zing',
  handle: '@clubzing',
  city: 'Mumbai',
  bio: 'Independent nightlife promoter focused on house, hip-hop and culture-led rooms.',
  initials: 'CZ',
  verified: true,
  completion: 86,
} as const;

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

export const pendingInvitations: readonly PromoterStudioEvent[] = [
  {
    id: 'bollywood-brunch',
    inviteId: 'invite-bollywood-brunch',
    name: 'Bollywood Brunch',
    venue: 'The Courtyard',
    host: 'Kabir Malhotra',
    city: 'Mumbai',
    date: 'Sun, 2 Aug',
    time: '1:00 PM',
    category: 'Bollywood',
    state: 'pending',
    poster: '/venue/events/bollywood-brunch.webp',
    commission: '₹80 per ticket',
    tickets: 0,
    clicks: 0,
    orders: 0,
    earnedPaise: 0,
    note: 'Invitation expires in 4 days.',
  },
  {
    id: 'monsoon-sessions',
    inviteId: 'invite-monsoon-sessions',
    name: 'Monsoon Sessions',
    venue: 'Harbour Social',
    host: 'Zoya Khan',
    city: 'Mumbai',
    date: 'Fri, 7 Aug',
    time: '9:30 PM',
    category: 'Indie',
    state: 'pending',
    poster: '/venue/events/monsoon-sessions.webp',
    commission: '12% of attributed sales',
    tickets: 0,
    clicks: 0,
    orders: 0,
    earnedPaise: 0,
    note: 'Invitation expires in 7 days.',
  },
] as const;

export const discoverableEvents: readonly PromoterStudioEvent[] = [
  {
    id: 'after-dark',
    name: 'After Dark',
    venue: 'Kitty Su Mumbai',
    host: 'Night Shift Collective',
    city: 'Mumbai',
    date: 'Sat, 8 Aug',
    time: '10:30 PM',
    category: 'Hip-hop',
    state: 'requestable',
    poster: '/venue/events/neon-nights.webp',
    commission: '₹110 per ticket',
    tickets: 0,
    clicks: 0,
    orders: 0,
    earnedPaise: 0,
  },
  {
    id: 'terrace-frequency',
    name: 'Terrace Frequency',
    venue: 'The Terrace',
    host: 'Sunday People',
    city: 'Bengaluru',
    date: 'Sat, 15 Aug',
    time: '6:00 PM',
    category: 'House',
    state: 'requestable',
    poster: '/venue/events/sunset-sessions.webp',
    commission: '10% of attributed sales',
    tickets: 0,
    clicks: 0,
    orders: 0,
    earnedPaise: 0,
  },
  {
    id: 'industrial-echoes',
    name: 'Industrial Echoes',
    venue: 'Mill Compound',
    host: 'Substance',
    city: 'Delhi',
    date: 'Fri, 21 Aug',
    time: '11:00 PM',
    category: 'Techno',
    state: 'requestable',
    poster: '/venue/events/warehouse-rave.webp',
    commission: '₹90 per ticket',
    tickets: 0,
    clicks: 0,
    orders: 0,
    earnedPaise: 0,
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

export const partners: readonly PromoterPartnerRecord[] = [
  {
    id: 'skyline-rooftop',
    kind: 'venue',
    name: 'Skyline Rooftop',
    city: 'Mumbai',
    category: 'Rooftop',
    relationship: 'partnered',
    verified: true,
    eventsTogether: 8,
    ticketsMoved: 1264,
    response: 'Usually replies in 2h',
    initials: 'SR',
  },
  {
    id: 'district-warehouse',
    kind: 'venue',
    name: 'District Warehouse',
    city: 'Mumbai',
    category: 'Warehouse',
    relationship: 'partnered',
    verified: true,
    eventsTogether: 4,
    ticketsMoved: 712,
    response: 'Usually replies in 4h',
    initials: 'DW',
  },
  {
    id: 'rhea-kapoor',
    kind: 'host',
    name: 'Rhea Kapoor',
    city: 'Mumbai',
    category: 'Afrobeats',
    relationship: 'partnered',
    verified: true,
    eventsTogether: 6,
    ticketsMoved: 986,
    response: 'Usually replies in 1h',
    initials: 'RK',
  },
  {
    id: 'arjun-mehta',
    kind: 'host',
    name: 'Arjun Mehta',
    city: 'Mumbai',
    category: 'House',
    relationship: 'partnered',
    verified: true,
    eventsTogether: 3,
    ticketsMoved: 421,
    response: 'Usually replies today',
    initials: 'AM',
  },
  {
    id: 'kitty-su',
    kind: 'venue',
    name: 'Kitty Su Mumbai',
    city: 'Mumbai',
    category: 'Nightclub',
    relationship: 'requestable',
    verified: true,
    eventsTogether: 0,
    ticketsMoved: 0,
    response: 'Usually replies in 3h',
    initials: 'KS',
  },
  {
    id: 'night-shift',
    kind: 'host',
    name: 'Night Shift Collective',
    city: 'Mumbai',
    category: 'Hip-hop',
    relationship: 'requestable',
    verified: true,
    eventsTogether: 0,
    ticketsMoved: 0,
    response: 'Usually replies today',
    initials: 'NS',
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

export const payouts = [
  { id: 'PY-2048', date: '12 Jul 2026', amountPaise: 2100000, status: 'Paid' },
  { id: 'PY-1981', date: '28 Jun 2026', amountPaise: 1640000, status: 'Paid' },
  { id: 'PY-1872', date: '14 Jun 2026', amountPaise: 1260000, status: 'Paid' },
] as const;

export const promoterNotifications = [
  {
    id: 'n1',
    title: 'Invitation received',
    summary: 'Bollywood Brunch invited Club Zing to promote.',
    time: '8m',
    destination: '/promoter/events/invitations/invite-bollywood-brunch',
  },
  {
    id: 'n2',
    title: '12 tickets moved',
    summary: 'Neon Nights gained 12 attributed tickets today.',
    time: '1h',
    destination: '/promoter/events/neon-nights-afrobeats/orders',
  },
  {
    id: 'n3',
    title: 'Payout available',
    summary: '₹18,640 is available to request.',
    time: '3h',
    destination: '/promoter/finance',
  },
] as const;

export const promoterWriteCapabilities = {
  acceptInvitation: false,
  declineInvitation: false,
  requestEventAccess: false,
  requestPartnership: false,
  createCanonicalLink: false,
  requestPayout: false,
  saveProfile: false,
  updatePayoutAccount: false,
  updateNotifications: false,
  updateSecurity: false,
} as const;

export const eventById = (id: string): PromoterStudioEvent | undefined =>
  [...acceptedEvents, ...pendingInvitations, ...discoverableEvents].find(
    (event) => event.id === id,
  );

export const invitationById = (id: string): PromoterStudioEvent | undefined =>
  pendingInvitations.find((event) => event.inviteId === id);

export const linkById = (id: string): PromoterCanonicalLink | undefined =>
  canonicalLinks.find((link) => link.id === id);

export const linkForEvent = (eventId: string): PromoterCanonicalLink | undefined =>
  canonicalLinks.find((link) => link.eventId === eventId);

export const partnerById = (id: string): PromoterPartnerRecord | undefined =>
  partners.find((partner) => partner.id === id);

export const eligibleLinkEvents = (): readonly PromoterStudioEvent[] =>
  acceptedEvents.filter((event) => !linkForEvent(event.id));

export const conversionRate = (orders: number, clicks: number): number =>
  clicks > 0 ? Math.round((orders / clicks) * 1000) / 10 : 0;

export const formatInr = (paise: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
