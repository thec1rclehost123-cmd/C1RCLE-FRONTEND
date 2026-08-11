export type VenuePartnerKind = 'host' | 'promoter';
export type VenuePartnerStatus = 'Active' | 'Invite pending';
export type VenueStaffRole = 'Owner' | 'Manager' | 'Door staff' | 'Marketing' | 'Finance';

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
): VenuePartner => ({
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
  ...details,
});

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
