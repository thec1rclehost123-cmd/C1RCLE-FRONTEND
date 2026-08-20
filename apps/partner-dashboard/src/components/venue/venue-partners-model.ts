export type VenuePartnerKind = 'host' | 'promoter';
export type VenuePartnerStatus = 'Active' | 'Invite pending';
export type VenueStaffRole = 'Owner' | 'Manager' | 'Door staff' | 'Marketing' | 'Finance';

export interface VenuePartnerEvent {
  readonly id: string;
  readonly name: string;
  readonly date: string;
  readonly outcome: string;
}

export interface VenuePartnerUpcomingEvent {
  readonly id: string;
  readonly name: string;
  readonly date: string;
}

export interface VenuePartnerCredibility {
  readonly trackedEvents: number;
  readonly performanceValue: number;
  readonly rebookRate: number;
}

export interface VenuePartner {
  readonly id: string;
  readonly kind: VenuePartnerKind;
  readonly name: string;
  readonly initials: string;
  readonly city: string;
  readonly recentEvent: string;
  readonly recentEventDate: string;
  readonly status: VenuePartnerStatus;
  readonly phone: string | null;
  readonly instagram: string | null;
  readonly verified: boolean;
  readonly tone: 'violet' | 'red' | 'blue' | 'amber' | 'rose' | 'green';
  readonly credibility: VenuePartnerCredibility;
  readonly eventHistory: readonly VenuePartnerEvent[];
  /** Host-only. Null for promoters. */
  readonly eventType: string | null;
  readonly experienceYears: number;
  /** Host-only. Null for promoters. */
  readonly avgTicketsSold: number | null;
  /** Host-only. Null for promoters. */
  readonly avgAttendance: number | null;
  /** Host-only capacity they typically run events at. Null for promoters. */
  readonly capacity: number | null;
  /** Host-only count of distinct venues worked with. Null for promoters. */
  readonly venuesWorkedWith: number | null;
  /** Host-only. Null for promoters. */
  readonly upcomingEvents: readonly VenuePartnerUpcomingEvent[] | null;
  /** Promoter-only audience reach. Null for hosts. */
  readonly audienceReach: number | null;
  /** Promoter-only conversion rate, percent. Null for hosts. */
  readonly conversionRate: number | null;
  /** "Active/accepting" for hosts, "Active/available" for promoters. */
  readonly activeAccepting: boolean;
}

export interface VenueStaffMember {
  readonly id: string;
  readonly name: string;
  readonly initials: string;
  readonly email: string;
  readonly role: VenueStaffRole;
  readonly access: string;
  readonly status: 'Active' | 'Invite pending';
  readonly permissions: readonly string[];
}

export interface DiscoverablePartner extends VenuePartner {
  readonly genre: string;
}

type PartnerProfile = Pick<
  VenuePartner,
  | 'credibility'
  | 'eventHistory'
  | 'eventType'
  | 'experienceYears'
  | 'avgTicketsSold'
  | 'avgAttendance'
  | 'capacity'
  | 'venuesWorkedWith'
  | 'upcomingEvents'
  | 'audienceReach'
  | 'conversionRate'
  | 'activeAccepting'
>;

const partnerProfiles: Readonly<Record<string, PartnerProfile>> = {
  'host-rhea': {
    credibility: { trackedEvents: 18, performanceValue: 312, rebookRate: 82 },
    eventHistory: [
      { id: 'rhea-neon', name: 'Neon Nights', date: '24 May 2025', outcome: '340 guests' },
      {
        id: 'rhea-sessions',
        name: 'Saturday Sessions',
        date: '10 May 2025',
        outcome: '298 guests',
      },
      { id: 'rhea-rooftop', name: 'Rooftop Social', date: '19 Apr 2025', outcome: '276 guests' },
    ],
    eventType: 'Club night',
    experienceYears: 4,
    avgTicketsSold: 310,
    avgAttendance: 285,
    capacity: 350,
    venuesWorkedWith: 6,
    upcomingEvents: [{ id: 'rhea-upcoming-1', name: 'Neon Nights: Reload', date: '14 Jun 2025' }],
    audienceReach: null,
    conversionRate: null,
    activeAccepting: true,
  },
  'host-arjun': {
    credibility: { trackedEvents: 14, performanceValue: 284, rebookRate: 79 },
    eventHistory: [
      { id: 'arjun-afterhours', name: 'Afterhours', date: '16 May 2025', outcome: '301 guests' },
      {
        id: 'arjun-district',
        name: 'District Saturdays',
        date: '3 May 2025',
        outcome: '267 guests',
      },
    ],
    eventType: 'Day party',
    experienceYears: 3,
    avgTicketsSold: 270,
    avgAttendance: 250,
    capacity: 300,
    venuesWorkedWith: 4,
    upcomingEvents: [{ id: 'arjun-upcoming-1', name: 'Afterhours Vol. 2', date: '20 Jun 2025' }],
    audienceReach: null,
    conversionRate: null,
    activeAccepting: true,
  },
  'host-maya': {
    credibility: { trackedEvents: 11, performanceValue: 246, rebookRate: 73 },
    eventHistory: [
      { id: 'maya-backroom', name: 'Backroom', date: '10 May 2025', outcome: '254 guests' },
      { id: 'maya-vibe', name: 'Vibe Check', date: '25 Apr 2025', outcome: '238 guests' },
    ],
    eventType: 'Private event',
    experienceYears: 2,
    avgTicketsSold: 230,
    avgAttendance: 210,
    capacity: 260,
    venuesWorkedWith: 3,
    upcomingEvents: [{ id: 'maya-upcoming-1', name: 'Backroom Sessions', date: '22 Jun 2025' }],
    audienceReach: null,
    conversionRate: null,
    activeAccepting: true,
  },
  'host-kabir': {
    credibility: { trackedEvents: 9, performanceValue: 221, rebookRate: 67 },
    eventHistory: [
      {
        id: 'kabir-district',
        name: 'District Saturdays',
        date: '3 May 2025',
        outcome: '231 guests',
      },
      { id: 'kabir-afterdark', name: 'After Dark', date: '12 Apr 2025', outcome: '211 guests' },
    ],
    eventType: 'Club night',
    experienceYears: 2,
    avgTicketsSold: 210,
    avgAttendance: 195,
    capacity: 240,
    venuesWorkedWith: 3,
    upcomingEvents: [],
    audienceReach: null,
    conversionRate: null,
    activeAccepting: false,
  },
  'host-zoya': {
    credibility: { trackedEvents: 16, performanceValue: 296, rebookRate: 81 },
    eventHistory: [
      { id: 'zoya-vibe', name: 'Vibe Check', date: '25 Apr 2025', outcome: '305 guests' },
      { id: 'zoya-social', name: 'Sunday Social', date: '6 Apr 2025', outcome: '287 guests' },
    ],
    eventType: 'Festival',
    experienceYears: 5,
    avgTicketsSold: 290,
    avgAttendance: 270,
    capacity: 320,
    venuesWorkedWith: 7,
    upcomingEvents: [{ id: 'zoya-upcoming-1', name: 'Vibe Check: Summer', date: '28 Jun 2025' }],
    audienceReach: null,
    conversionRate: null,
    activeAccepting: true,
  },
  'host-vihaan': {
    credibility: { trackedEvents: 7, performanceValue: 208, rebookRate: 64 },
    eventHistory: [
      {
        id: 'vihaan-sessions',
        name: 'Saturday Sessions',
        date: '9 May 2025',
        outcome: '219 guests',
      },
      { id: 'vihaan-house', name: 'House Rules', date: '18 Apr 2025', outcome: '197 guests' },
    ],
    eventType: 'Day party',
    experienceYears: 1,
    avgTicketsSold: 190,
    avgAttendance: 175,
    capacity: 220,
    venuesWorkedWith: 2,
    upcomingEvents: [{ id: 'vihaan-upcoming-1', name: 'Saturday Sessions X', date: '5 Jul 2025' }],
    audienceReach: null,
    conversionRate: null,
    activeAccepting: true,
  },
  'promoter-karan': {
    credibility: { trackedEvents: 24, performanceValue: 6840, rebookRate: 88 },
    eventHistory: [
      { id: 'karan-neon', name: 'Neon Nights', date: '24 May 2025', outcome: '340 tickets' },
      {
        id: 'karan-sessions',
        name: 'Saturday Sessions',
        date: '10 May 2025',
        outcome: '312 tickets',
      },
      { id: 'karan-rooftop', name: 'Rooftop Social', date: '19 Apr 2025', outcome: '286 tickets' },
    ],
    eventType: null,
    experienceYears: 5,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: 42_000,
    conversionRate: 8.4,
    activeAccepting: true,
  },
  'promoter-aisha': {
    credibility: { trackedEvents: 19, performanceValue: 5190, rebookRate: 84 },
    eventHistory: [
      {
        id: 'aisha-bollywood',
        name: 'Bollywood Bash',
        date: '17 May 2025',
        outcome: '326 tickets',
      },
      { id: 'aisha-fridays', name: 'Urban Fridays', date: '2 May 2025', outcome: '274 tickets' },
    ],
    eventType: null,
    experienceYears: 4,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: 35_000,
    conversionRate: 7.6,
    activeAccepting: true,
  },
  'promoter-rohit': {
    credibility: { trackedEvents: 12, performanceValue: 2940, rebookRate: 69 },
    eventHistory: [
      { id: 'rohit-afterhours', name: 'Afterhours', date: '10 May 2025', outcome: '247 tickets' },
      {
        id: 'rohit-district',
        name: 'District Saturdays',
        date: '26 Apr 2025',
        outcome: '236 tickets',
      },
    ],
    eventType: null,
    experienceYears: 2,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: 21_000,
    conversionRate: 5.9,
    activeAccepting: false,
  },
  'promoter-sneha': {
    credibility: { trackedEvents: 15, performanceValue: 4110, rebookRate: 77 },
    eventHistory: [
      { id: 'sneha-vibe', name: 'Vibe Check', date: '25 Apr 2025', outcome: '291 tickets' },
      { id: 'sneha-backroom', name: 'Backroom', date: '11 Apr 2025', outcome: '256 tickets' },
    ],
    eventType: null,
    experienceYears: 3,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: 28_000,
    conversionRate: 6.8,
    activeAccepting: true,
  },
  'promoter-vikram': {
    credibility: { trackedEvents: 21, performanceValue: 5730, rebookRate: 86 },
    eventHistory: [
      {
        id: 'vikram-district',
        name: 'District Saturdays',
        date: '3 May 2025',
        outcome: '319 tickets',
      },
      { id: 'vikram-afterdark', name: 'After Dark', date: '12 Apr 2025', outcome: '284 tickets' },
    ],
    eventType: null,
    experienceYears: 5,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: 39_000,
    conversionRate: 8.1,
    activeAccepting: true,
  },
  'promoter-tara': {
    credibility: { trackedEvents: 10, performanceValue: 2380, rebookRate: 71 },
    eventHistory: [
      { id: 'tara-social', name: 'Sunday Social', date: '4 May 2025', outcome: '248 tickets' },
      { id: 'tara-indie', name: 'Indie Evenings', date: '13 Apr 2025', outcome: '218 tickets' },
    ],
    eventType: null,
    experienceYears: 2,
    avgTicketsSold: null,
    avgAttendance: null,
    capacity: null,
    venuesWorkedWith: null,
    upcomingEvents: null,
    audienceReach: 18_000,
    conversionRate: 5.4,
    activeAccepting: true,
  },
};

const partner = (
  id: string,
  kind: VenuePartnerKind,
  name: string,
  city: string,
  recentEvent: string,
  recentEventDate: string,
  status: VenuePartnerStatus,
  tone: VenuePartner['tone'],
  details: Pick<VenuePartner, 'phone' | 'instagram' | 'verified'>,
): VenuePartner => {
  const profile = partnerProfiles[id];
  if (!profile) throw new Error(`Missing partner profile fixture for ${id}`);
  return {
    id,
    kind,
    name,
    initials: name
      .split(/\s+/)
      .map((part) => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    city,
    recentEvent,
    recentEventDate,
    status,
    tone,
    ...profile,
    ...details,
  };
};

export const venueHosts: readonly VenuePartner[] = [
  partner(
    'host-rhea',
    'host',
    'Rhea Kapoor',
    'Mumbai',
    'Neon Nights',
    'Sat, 24 May 2025',
    'Active',
    'violet',
    { phone: '+91 98765 43210', instagram: '@rheakapoor', verified: true },
  ),
  partner(
    'host-arjun',
    'host',
    'Arjun Mehta',
    'Delhi',
    'Afterhours',
    'Fri, 16 May 2025',
    'Active',
    'red',
    { phone: '+91 98765 43210', instagram: '@arjunmehta', verified: true },
  ),
  partner(
    'host-maya',
    'host',
    'Maya Shah',
    'Bengaluru',
    'Backroom',
    'Sat, 10 May 2025',
    'Active',
    'blue',
    { phone: null, instagram: '@mayashah', verified: false },
  ),
  partner(
    'host-kabir',
    'host',
    'Kabir Malhotra',
    'Hyderabad',
    'District Saturdays',
    'Sat, 3 May 2025',
    'Active',
    'amber',
    { phone: null, instagram: null, verified: false },
  ),
  partner(
    'host-zoya',
    'host',
    'Zoya Khan',
    'Pune',
    'Vibe Check',
    'Fri, 25 Apr 2025',
    'Active',
    'rose',
    { phone: null, instagram: '@zoyakhan', verified: true },
  ),
];

export const venuePromoters: readonly VenuePartner[] = [
  partner(
    'promoter-karan',
    'promoter',
    'Karan Shah',
    'Mumbai',
    'Neon Nights',
    '24 May 2025',
    'Active',
    'blue',
    { phone: '+91 97654 21098', instagram: '@karanshah', verified: true },
  ),
  partner(
    'promoter-aisha',
    'promoter',
    'Aisha Khan',
    'Mumbai',
    'Bollywood Bash',
    '17 May 2025',
    'Active',
    'red',
    { phone: null, instagram: '@aishakhan', verified: true },
  ),
  partner(
    'promoter-rohit',
    'promoter',
    'Rohit Verma',
    'Delhi',
    'Afterhours',
    '10 May 2025',
    'Invite pending',
    'amber',
    { phone: null, instagram: null, verified: false },
  ),
  partner(
    'promoter-sneha',
    'promoter',
    'Sneha Iyer',
    'Bengaluru',
    'Vibe Check',
    '25 Apr 2025',
    'Active',
    'violet',
    { phone: null, instagram: '@snehaiyer', verified: false },
  ),
  partner(
    'promoter-vikram',
    'promoter',
    'Vikram Singh',
    'Mumbai',
    'District Saturdays',
    '3 May 2025',
    'Active',
    'green',
    { phone: null, instagram: '@vikramsingh', verified: false },
  ),
];

/** One workforce source shared by Partners > Staff and Settings > Team access. */
export const venueStaff: readonly VenueStaffMember[] = [
  {
    id: 'staff-karan',
    name: 'Karan Shah',
    initials: 'KS',
    email: 'karan@skyline.co.in',
    role: 'Owner',
    access: 'Full access',
    status: 'Active',
    permissions: ['Manage events', 'Manage guests', 'Manage settings'],
  },
  {
    id: 'staff-priya',
    name: 'Priya Mehta',
    initials: 'PM',
    email: 'priya@skyline.co.in',
    role: 'Manager',
    access: 'Full access',
    status: 'Active',
    permissions: ['Manage events', 'Manage guests', 'Manage settings'],
  },
  {
    id: 'staff-rohan',
    name: 'Rohan Verma',
    initials: 'RV',
    email: 'rohan@skyline.co.in',
    role: 'Door staff',
    access: 'Door mode only',
    status: 'Active',
    permissions: ['Manage guests'],
  },
  {
    id: 'staff-neha',
    name: 'Neha Iyer',
    initials: 'NI',
    email: 'neha@skyline.co.in',
    role: 'Marketing',
    access: 'Marketing only',
    status: 'Active',
    permissions: ['Manage marketing'],
  },
  {
    id: 'staff-vikram',
    name: 'Vikram Singh',
    initials: 'VS',
    email: 'vikram@skyline.co.in',
    role: 'Finance',
    access: 'Finance only',
    status: 'Invite pending',
    permissions: ['View finance'],
  },
];

const asDiscovery = (source: VenuePartner, genre: string): DiscoverablePartner => ({
  ...source,
  genre,
});

const hostGenres = [
  'Tech House & Minimal',
  'Tech House & Progressive',
  'Deep House & Melodic',
  'Hip-Hop & R&B',
  'Commercial & Bollywood',
] as const;

export const discoverableHosts: readonly DiscoverablePartner[] = [
  ...venueHosts.map((source, index) =>
    asDiscovery(source, hostGenres[index] ?? 'House & Electronic'),
  ),
  asDiscovery(
    partner(
      'host-vihaan',
      'host',
      'Vihaan Rao',
      'Chennai',
      'Saturday Sessions',
      '9 May 2025',
      'Active',
      'violet',
      { phone: null, instagram: '@vihaanrao', verified: false },
    ),
    'House & Techno',
  ),
];

const promoterGenres = [
  'Afrobeats & House',
  'Bollywood & Pop',
  'Techno & Electronic',
  'House & Disco',
  'Hip-Hop & R&B',
] as const;

export const discoverablePromoters: readonly DiscoverablePartner[] = [
  ...venuePromoters.map((source, index) =>
    asDiscovery(source, promoterGenres[index] ?? 'House & Electronic'),
  ),
  asDiscovery(
    partner(
      'promoter-tara',
      'promoter',
      'Tara Nair',
      'Pune',
      'Sunday Social',
      '4 May 2025',
      'Active',
      'rose',
      { phone: null, instagram: '@taranair', verified: true },
    ),
    'Commercial & Indie',
  ),
];

export const getVenuePartners = (kind: VenuePartnerKind): readonly VenuePartner[] =>
  kind === 'host' ? venueHosts : venuePromoters;

export const getDiscoverablePartners = (kind: VenuePartnerKind): readonly DiscoverablePartner[] =>
  kind === 'host' ? discoverableHosts : discoverablePromoters;

// ── Partnership requests — separate from connection status above ──────────

export type PartnershipRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';
export type PartnershipRequestDirection = 'received' | 'sent';

export interface VenuePartnershipRequest {
  readonly id: string;
  readonly kind: VenuePartnerKind;
  readonly direction: PartnershipRequestDirection;
  readonly partnerName: string;
  readonly partnerInitials: string;
  readonly partnerCity: string;
  readonly tone: VenuePartner['tone'];
  readonly verified: boolean;
  readonly status: PartnershipRequestStatus;
  readonly requestedAt: string;
  readonly note: string | null;
}

export const receivedPartnershipRequests: readonly VenuePartnershipRequest[] = [
  {
    id: 'received-vihaan',
    kind: 'host',
    direction: 'received',
    partnerName: 'Vihaan Rao',
    partnerInitials: 'VR',
    partnerCity: 'Chennai',
    tone: 'violet',
    verified: false,
    status: 'pending',
    requestedAt: 'Today, 11:20 AM',
    note: 'Would love to bring Saturday Sessions to your rooftop slot in July.',
  },
  {
    id: 'received-tara',
    kind: 'promoter',
    direction: 'received',
    partnerName: 'Tara Nair',
    partnerInitials: 'TN',
    partnerCity: 'Pune',
    tone: 'rose',
    verified: true,
    status: 'pending',
    requestedAt: 'Yesterday, 6:05 PM',
    note: 'I run Sunday Social — happy to share reach numbers on a call.',
  },
  {
    id: 'received-arjun-past',
    kind: 'host',
    direction: 'received',
    partnerName: 'Arjun Mehta',
    partnerInitials: 'AM',
    partnerCity: 'Delhi',
    tone: 'red',
    verified: true,
    status: 'accepted',
    requestedAt: '2 May 2025',
    note: null,
  },
  {
    id: 'received-rohit-past',
    kind: 'promoter',
    direction: 'received',
    partnerName: 'Rohit Verma',
    partnerInitials: 'RV',
    partnerCity: 'Delhi',
    tone: 'amber',
    verified: false,
    status: 'declined',
    requestedAt: '18 Apr 2025',
    note: 'Requested a weekday slot outside our booking window.',
  },
];

export const sentPartnershipRequests: readonly VenuePartnershipRequest[] = [
  {
    id: 'sent-sneha',
    kind: 'promoter',
    direction: 'sent',
    partnerName: 'Sneha Iyer',
    partnerInitials: 'SI',
    partnerCity: 'Bengaluru',
    tone: 'violet',
    verified: false,
    status: 'pending',
    requestedAt: 'Today, 9:40 AM',
    note: 'Inviting you to promote our August rooftop series.',
  },
  {
    id: 'sent-kabir',
    kind: 'host',
    direction: 'sent',
    partnerName: 'Kabir Malhotra',
    partnerInitials: 'KM',
    partnerCity: 'Hyderabad',
    tone: 'amber',
    verified: false,
    status: 'pending',
    requestedAt: '3 days ago',
    note: null,
  },
  {
    id: 'sent-maya-past',
    kind: 'host',
    direction: 'sent',
    partnerName: 'Maya Shah',
    partnerInitials: 'MS',
    partnerCity: 'Bengaluru',
    tone: 'blue',
    verified: false,
    status: 'accepted',
    requestedAt: '28 Apr 2025',
    note: null,
  },
];

export const getPartnershipRequests = (
  direction: PartnershipRequestDirection,
): readonly VenuePartnershipRequest[] =>
  direction === 'received' ? receivedPartnershipRequests : sentPartnershipRequests;
