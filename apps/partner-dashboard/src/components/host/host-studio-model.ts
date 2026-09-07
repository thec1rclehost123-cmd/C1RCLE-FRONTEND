export type HostEventState = 'Live' | 'Upcoming' | 'Invitation' | 'Requested' | 'Completed';
export type HostRequestState = 'Pending' | 'Accepted' | 'Declined' | 'Needs changes';

export interface HostEventRecord {
  readonly id: string;
  readonly name: string;
  readonly venue: string;
  readonly city: string;
  readonly date: string;
  readonly time: string;
  readonly status: HostEventState;
  readonly guests: number | null;
  readonly confirmed: number | null;
  readonly poster: string;
}

export interface HostPartnerRecord {
  readonly id: string;
  readonly kind: 'venue' | 'promoter';
  readonly name: string;
  readonly city: string;
  readonly status: 'Active' | 'Pending' | 'Discover';
  readonly verified: boolean;
  readonly eventsTogether: number;
  readonly detail: string;
}

export interface HostSlotRequest {
  readonly id: string;
  readonly eventName: string;
  readonly venue: string;
  readonly date: string;
  readonly time: string;
  readonly status: HostRequestState;
  readonly updatedAt: string;
}

export const hostProfile = {
  id: 'rhea-kapoor',
  name: 'Rhea Kapoor',
  initials: 'RK',
  handle: '@rheakapoor',
  city: 'Mumbai',
  phone: '+91 98765 43210',
  email: 'rhea@thec1rcle.in',
  verified: true,
  bio: 'Independent nightlife host creating warm, music-led rooms across Mumbai.',
  categories: ['Afrobeats', 'House', 'Sundowners'],
} as const;

export const hostEvents: readonly HostEventRecord[] = [
  {
    id: 'neon-nights',
    name: 'Neon Nights: Afrobeats',
    venue: 'Skyline Rooftop',
    city: 'Mumbai',
    date: 'Thu, 16 Jul 2026',
    time: '9:00 PM',
    status: 'Live',
    guests: 340,
    confirmed: 182,
    poster: '/venue/neon-nights-poster.webp',
  },
  {
    id: 'sunset-sessions',
    name: 'Sunset Sessions',
    venue: 'AntiSocial Mumbai',
    city: 'Mumbai',
    date: 'Sat, 2 Aug 2026',
    time: '5:00 PM',
    status: 'Upcoming',
    guests: 250,
    confirmed: 168,
    poster: '/venue/events/sunset-sessions.webp',
  },
  {
    id: 'after-hours',
    name: 'After Hours',
    venue: 'The Docks',
    city: 'Mumbai',
    date: 'Fri, 8 Aug 2026',
    time: '10:00 PM',
    status: 'Requested',
    guests: null,
    confirmed: null,
    poster: '/venue/events/warehouse-rave.webp',
  },
  {
    id: 'monsoon-sessions',
    name: 'Monsoon Sessions',
    venue: 'Harbour Room',
    city: 'Mumbai',
    date: 'Sat, 16 Aug 2026',
    time: '8:00 PM',
    status: 'Invitation',
    guests: 180,
    confirmed: null,
    poster: '/venue/events/monsoon-sessions.webp',
  },
  {
    id: 'bollywood-brunch',
    name: 'Bollywood Brunch',
    venue: 'Skyline Rooftop',
    city: 'Mumbai',
    date: 'Sun, 25 May 2026',
    time: '1:00 PM',
    status: 'Completed',
    guests: 210,
    confirmed: 196,
    poster: '/venue/events/bollywood-brunch.webp',
  },
];

export const hostPartners: readonly HostPartnerRecord[] = [
  {
    id: 'skyline-rooftop',
    kind: 'venue',
    name: 'Skyline Rooftop',
    city: 'Mumbai',
    status: 'Active',
    verified: true,
    eventsTogether: 9,
    detail: 'Rooftop · 400 capacity',
  },
  {
    id: 'antisocial-mumbai',
    kind: 'venue',
    name: 'AntiSocial Mumbai',
    city: 'Mumbai',
    status: 'Active',
    verified: true,
    eventsTogether: 6,
    detail: 'Nightclub · 550 capacity',
  },
  {
    id: 'harbour-room',
    kind: 'venue',
    name: 'Harbour Room',
    city: 'Mumbai',
    status: 'Pending',
    verified: true,
    eventsTogether: 2,
    detail: 'Live room · 300 capacity',
  },
  {
    id: 'karan-shah',
    kind: 'promoter',
    name: 'Karan Shah',
    city: 'Mumbai',
    status: 'Active',
    verified: true,
    eventsTogether: 4,
    detail: 'House · Afrobeats',
  },
  {
    id: 'maya-iyer',
    kind: 'promoter',
    name: 'Maya Iyer',
    city: 'Mumbai',
    status: 'Active',
    verified: true,
    eventsTogether: 3,
    detail: 'R&B · Commercial',
  },
  {
    id: 'arjun-nair',
    kind: 'promoter',
    name: 'Arjun Nair',
    city: 'Pune',
    status: 'Discover',
    verified: false,
    eventsTogether: 0,
    detail: 'Techno · Progressive',
  },
];

export const hostSlotRequests: readonly HostSlotRequest[] = [
  {
    id: 'sr-2026-1187',
    eventName: 'After Hours',
    venue: 'The Docks',
    date: 'Fri, 8 Aug 2026',
    time: '10:00 PM',
    status: 'Pending',
    updatedAt: 'Today, 10:24 AM',
  },
  {
    id: 'sr-2026-1174',
    eventName: 'Sunset Sessions',
    venue: 'AntiSocial Mumbai',
    date: 'Sat, 2 Aug 2026',
    time: '5:00 PM',
    status: 'Accepted',
    updatedAt: 'Yesterday, 4:45 PM',
  },
  {
    id: 'sr-2026-1168',
    eventName: 'Warehouse Echoes',
    venue: 'Harbour Room',
    date: 'Sat, 16 Aug 2026',
    time: '11:00 PM',
    status: 'Needs changes',
    updatedAt: '15 Jul, 2:18 PM',
  },
];

export const hostGuests = [
  ['Aarav Mehta', 'Couple Pass', '2', 'Confirmed'],
  ['Meera Rao', 'Early Bird', '2', 'Invited'],
  ['Karan Kapoor', 'General Entry', '3', 'Confirmed'],
  ['Riya Shah', 'General Entry', '1', 'Confirmed'],
  ['Vikram Patel', 'Couple Pass', '2', 'Invited'],
] as const;

export const hostPromoters = [
  ['Karan Shah', 'Lead promoter', 'Active', '4 shared events'],
  ['Maya Iyer', 'Promoter', 'Active', '3 shared events'],
  ['Arjun Nair', 'Promoter', 'Invited', 'Invitation pending'],
] as const;

export const hostCampaigns = [
  ['Neon Nights reminder', 'SMS', '15 Jul 2026 · 6:00 PM', 'Delivered', 'Result unavailable'],
  ['Tickets running low', 'WhatsApp', '14 Jul 2026 · 5:30 PM', 'Delivered', '842 opened'],
  ['Event announcement', 'Email', '—', 'Draft', 'Result unavailable'],
] as const;

export const hostNotifications = [
  {
    id: 'invitation',
    kind: 'Events',
    title: 'New event invitation',
    body: 'Skyline Rooftop invited you to Neon Nights: Afrobeats.',
    time: '10:24 AM',
    href: '/host/events/invitations/invite-neon',
  },
  {
    id: 'deadline',
    kind: 'Events',
    title: 'Invitation response due tomorrow',
    body: 'Respond to Neon Nights: Afrobeats by tomorrow.',
    time: '9:30 AM',
    href: '/host/events/invitations/invite-neon',
  },
  {
    id: 'payout',
    kind: 'Finance',
    title: 'Payout completed',
    body: '₹1,24,500 paid to HDFC ••4412.',
    time: '9:05 AM',
    href: '/host/finance',
  },
  {
    id: 'allocation',
    kind: 'Events',
    title: 'Guest allocation updated',
    body: 'Skyline Rooftop updated guest allocations for Sunset Sessions.',
    time: '8:47 AM',
    href: '/host/events/sunset-sessions/guests',
  },
  {
    id: 'campaign',
    kind: 'System',
    title: 'Campaign scheduled',
    body: 'Neon Nights reminder is scheduled for 15 Jul.',
    time: 'Yesterday',
    href: '/host/marketing?tab=history',
  },
] as const;

export const hostAvailability = {
  venueId: 'skyline-rooftop',
  venueName: 'Skyline Rooftop',
  partnership: 'Active',
  slots: [
    { id: 'slot-jul-24', label: 'Fri, 24 Jul', time: '9:00 PM – 3:00 AM' },
    { id: 'slot-jul-25', label: 'Sat, 25 Jul', time: '8:00 PM – 2:00 AM' },
    { id: 'slot-aug-01', label: 'Sat, 1 Aug', time: '9:00 PM – 3:00 AM' },
  ],
} as const;

export const formatHostMoney = (paise: number | null): string =>
  paise === null
    ? 'Unavailable'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(paise / 100);

export const getHostEvent = (id: string): HostEventRecord | null =>
  hostEvents.find((event) => event.id === id) ?? hostEvents[0] ?? null;

export const getHostPartner = (
  kind: HostPartnerRecord['kind'],
  id: string,
): HostPartnerRecord | null =>
  hostPartners.find((partner) => partner.kind === kind && partner.id === id) ?? null;

export const getHostRequest = (id: string): HostSlotRequest | null =>
  hostSlotRequests.find((request) => request.id === id) ?? null;
