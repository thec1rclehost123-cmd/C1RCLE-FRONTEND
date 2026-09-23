

/** Genre options available for a venue profile. */
export const venuePresenceGenres = [
  'Techno', 'House', 'Deep House', 'Tech House', 'Minimal', 'Trance',
  'Progressive', 'Melodic', 'Afro House', 'Amapiano', 'Bollywood', 'Hip-hop',
  'Trap', 'Bass', 'Dubstep', 'Drum & Bass', 'Commercial', 'Open Format', 'Lounge', 'Chill',
] as const;

export type VenuePresenceGenre = (typeof venuePresenceGenres)[number];

/** Style tag options available for a venue profile. */
export const venuePresenceStyleTags = [
  'Underground', 'Mainstream', 'Exclusive', 'Boutique', 'Festival', 'Club',
  'Afterhours', 'Day Party', 'Rooftop', 'Warehouse', 'Intimate', 'High Energy',
] as const;

export type VenuePresenceStyleTag = (typeof venuePresenceStyleTags)[number];

export type VenuePresenceRole = 'DJ' | 'Promoter' | 'Collective' | 'Artist' | 'Producer' | 'Label';

export type VenuePresenceCategory = 'Host' | 'Venue' | 'Brand' | 'Promoter' | 'Collective';

export type VenuePresenceCta = 'follow' | 'whatsapp' | 'call' | 'website' | 'tickets';

export interface VenueSocialLinks {
  readonly instagram?: string;
  readonly twitter?: string;
  readonly soundcloud?: string;
  readonly spotify?: string;
}

export interface VenuePressSnippet {
  readonly quote: string;
  readonly source: string;
}

export interface VenuePresenceVideo {
  readonly id: number;
  readonly url: string;
  readonly type: 'aftermovie' | 'recap' | 'promo' | 'live';
  readonly title: string;
}

export interface VenuePresenceProfile {
  readonly displayName: string;
  readonly tagline: string;
  readonly neighborhood: string;
  readonly categoryTag: VenuePresenceCategory;
  readonly bio: string;
  readonly role: VenuePresenceRole;
  readonly whatsapp: string;
  readonly primaryCta: VenuePresenceCta;
  readonly publicProfileEnabled: boolean;
  readonly slug?: string;
  readonly genres: readonly VenuePresenceGenre[];
  readonly styleTags: readonly VenuePresenceStyleTag[];
  readonly socialLinks: VenueSocialLinks;
  readonly website: string;
  readonly email: string;
  readonly city: string;
  readonly photos?: string[];
  readonly videos?: readonly VenuePresenceVideo[];
}

export interface VenuePresencePost {
  readonly id: string;
  readonly content: string;
  readonly imageUrl?: string;
  readonly createdAt: string;
  readonly likes: number;
  readonly views: number;
}

export interface VenuePresenceHighlight {
  readonly id: string;
  readonly title: string;
  readonly color: string;
}

export interface VenuePresenceStats {
  readonly followersCount: number;
  readonly postsCount: number;
  readonly totalLikes: number;
  readonly totalViews: number;
  readonly engagementRate?: number;
}

export interface VenuePresenceData {
  readonly profile: VenuePresenceProfile;
  readonly posts: readonly VenuePresencePost[];
  readonly highlights: readonly VenuePresenceHighlight[];
  readonly stats: VenuePresenceStats;
}

export interface VenueBookingConfig {
  readonly enabled: boolean;
  readonly capacity: number;
  readonly timings: readonly string[];
  readonly contact: string;
}

export interface VenuePublicPresenceConfig {
  readonly name: string;
  readonly description: string;
  readonly price: string;
  readonly images: readonly string[];
  readonly bookingConfig: VenueBookingConfig;
}

export const defaultVenueBookingConfig: VenueBookingConfig = {
  enabled: false,
  capacity: 100,
  timings: [],
  contact: '',
};

export const venuePresenceSource: VenuePresenceData = {
  profile: {
    displayName: 'Skyline Rooftop',
    tagline: 'Pune\'s premier rooftop venue — open format, big nights.',
    neighborhood: 'Koregaon Park, Pune',
    categoryTag: 'Venue',
    bio: 'Rooftop venue in the heart of Koregaon Park. We host electronic, Bollywood, and open-format nights with a world-class sound system and skyline views.',
    role: 'Collective',
    whatsapp: '+91 98765 43210',
    primaryCta: 'whatsapp',
    publicProfileEnabled: true,
    slug: 'skyline-rooftop',
    genres: ['Afro House', 'House', 'Techno', 'Commercial'],
    styleTags: ['Rooftop', 'Mainstream', 'High Energy'],
    socialLinks: {
      instagram: '@skylinerooftop',
      twitter: '@skyline_rooftop',
      soundcloud: 'soundcloud.com/skyline-rooftop',
      spotify: 'open.spotify.com/artist/example',
    },
    website: 'https://skyline.com',
    email: 'bookings@skyline.com',
    city: 'Pune, India',
    photos: [
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    ],
    videos: [
      { id: 1, url: 'https://youtube.com/example', type: 'aftermovie', title: 'Neon Nights Aftermovie' },
      { id: 2, url: 'https://youtube.com/example2', type: 'promo', title: 'Weekend Promo Reel' },
    ],
  },
  posts: [
    {
      id: 'post-1',
      content: 'This Saturday — Afro House takeover with our resident line-up under the stars. Table bookings open.',
      imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
      createdAt: '2026-09-10T18:00:00Z',
      likes: 214,
      views: 1840,
    },
    {
      id: 'post-2',
      content: 'Sound check done ✅ Doors at 9 PM tonight. Open format till sunrise.',
      createdAt: '2026-09-05T16:30:00Z',
      likes: 98,
      views: 765,
    },
  ],
  highlights: [
    { id: 'h1', title: 'Neon Nights', color: '#818CF8' },
    { id: 'h2', title: 'Aftermovie', color: '#34D399' },
    { id: 'h3', title: 'Line-ups', color: '#F472B6' },
  ],
  stats: {
    followersCount: 2140,
    postsCount: 34,
    totalLikes: 12680,
    totalViews: 48200,
    engagementRate: 6.4,
  },
};

export const venuePublicPresenceConfig: VenuePublicPresenceConfig = {
  name: 'Skyline Rooftop',
  description: 'Pune\'s premier rooftop venue — open format, big nights.',
  price: '₹1500 per person',
  images: [
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
  ],
  bookingConfig: {
    ...defaultVenueBookingConfig,
    enabled: true,
    capacity: 500,
    timings: ['7PM–10PM', '10PM–1AM'],
    contact: '+91 98765 43210',
  },
};

/* ─── Menu Types & Mock Data ─────────────────────────────────────────────── */

export interface VenueMenuItem {
  id: string;
  name: string;
  description: string;
  pricePaise: number;
  imageUrl: string;
  dietaryTags: string[];
  available: boolean;
  displayOrder: number;
}

export interface VenueMenuSection {
  id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  items: VenueMenuItem[];
}

export interface VenueMenu {
  name: string;
  description: string;
  currency: string;
  published: boolean;
  sections: VenueMenuSection[];
}

export const EMPTY_VENUE_MENU: VenueMenu = {
  name: 'Food & Drinks Menu',
  description: '',
  currency: 'INR',
  published: false,
  sections: [],
};

export const venueMenuSource: VenueMenu = {
  name: 'Food & Drinks Menu',
  description: 'Our curated selection of food and drinks, available every night.',
  currency: 'INR',
  published: true,
  sections: [
    {
      id: 'sec-starters',
      name: 'Starters & Small Plates',
      displayOrder: 0,
      active: true,
      items: [
        { id: 'item-1', name: 'Truffle Mushroom Arancini', description: 'Crispy risotto balls with truffle aioli', pricePaise: 45000, imageUrl: '', dietaryTags: ['Vegetarian'], available: true, displayOrder: 0 },
        { id: 'item-2', name: 'Spicy Tuna Tartare', description: 'Sesame-crusted tuna with avocado mousse', pricePaise: 65000, imageUrl: '', dietaryTags: ['Gluten-Free'], available: true, displayOrder: 1 },
        { id: 'item-3', name: 'Charred Broccolini', description: 'With chilli flakes, garlic, and parmesan', pricePaise: 38000, imageUrl: '', dietaryTags: ['Vegetarian'], available: true, displayOrder: 2 },
      ],
    },
    {
      id: 'sec-mains',
      name: 'Mains',
      displayOrder: 1,
      active: true,
      items: [
        { id: 'item-4', name: 'Wagyu Sliders', description: 'Mini wagyu beef patties with caramelised onion', pricePaise: 85000, imageUrl: '', dietaryTags: [], available: true, displayOrder: 0 },
        { id: 'item-5', name: 'Grilled Harissa Chicken', description: 'With saffron rice and roasted peppers', pricePaise: 72000, imageUrl: '', dietaryTags: ['Gluten-Free'], available: true, displayOrder: 1 },
        { id: 'item-6', name: 'Wild Mushroom Risotto', description: 'Creamy arborio with porcini and truffle oil', pricePaise: 58000, imageUrl: '', dietaryTags: ['Vegetarian'], available: true, displayOrder: 2 },
      ],
    },
    {
      id: 'sec-desserts',
      name: 'Desserts & Drinks',
      displayOrder: 2,
      active: true,
      items: [
        { id: 'item-7', name: 'Salted Caramel Cheesecake', description: 'New York style with berry compote', pricePaise: 48000, imageUrl: '', dietaryTags: ['Vegetarian'], available: true, displayOrder: 0 },
        { id: 'item-8', name: 'Signature Espresso Martini', description: 'Vodka, fresh espresso, coffee liqueur', pricePaise: 55000, imageUrl: '', dietaryTags: [], available: true, displayOrder: 1 },
      ],
    },
  ],
};

export const venuePresenceMeta = {
  card: {
    eyebrow: 'Venue Studio',
    title: 'Presence',
    subtitle: 'How your venue appears publicly — page, menu, and identity.',
  } as const,
  categories: ['Host', 'Venue', 'Brand', 'Promoter', 'Collective'] as const,
  roles: ['DJ', 'Promoter', 'Collective', 'Artist', 'Producer', 'Label'] as const,
  ctaOptions: [
    { value: 'follow', label: 'Follow Only' },
    { value: 'whatsapp', label: 'Contact via WhatsApp' },
    { value: 'call', label: 'Phone Call' },
    { value: 'website', label: 'Visit Website' },
    { value: 'tickets', label: 'Buy Tickets (Featured)' },
  ] as const,
  demographics: {
    ageBands: [
      { range: '18-21', pct: 22, color: '#8b5cf6' },
      { range: '21-25', pct: 41, color: '#6366f1' },
      { range: '25-30', pct: 24, color: '#0ea5e9' },
      { range: '30-35', pct: 9, color: '#14b8a6' },
      { range: '35+', pct: 4, color: '#64748b' },
    ] as const,
    genderSplit: [
      { label: 'Male', pct: 58, color: '#6366f1' },
      { label: 'Female', pct: 38, color: '#ec4899' },
      { label: 'Other', pct: 4, color: '#a855f7' },
    ] as const,
    topCities: [
      { city: 'Pune', pct: 48 },
      { city: 'Mumbai', pct: 28 },
      { city: 'Bangalore', pct: 12 },
      { city: 'Delhi', pct: 7 },
      { city: 'Others', pct: 5 },
    ] as const,
  } as const,
  engagement: {
    bestPostingTimes: [
      { day: 'Friday', time: '7:00 PM - 9:00 PM', level: 'highest' as const },
      { day: 'Saturday', time: '1:00 PM - 3:00 PM', level: 'high' as const },
      { day: 'Thursday', time: '8:00 PM - 10:00 PM', level: 'good' as const },
    ] as const,
    contentPerformance: [
      { type: 'Event Announcements', rate: '8.4%', icon: '🎪' },
      { type: 'Behind-the-Scenes', rate: '6.2%', icon: '🎬' },
      { type: 'Lineup Reveals', rate: '11.1%', icon: '🎧' },
      { type: 'Aftermovies', rate: '9.7%', icon: '📹' },
    ] as const,
  } as const,
};
