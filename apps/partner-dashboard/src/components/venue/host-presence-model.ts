import type {
  VenuePresenceCategory,
  VenuePresenceCta,
  VenuePresenceData,
  VenuePresenceRole,
} from './venue-presence-model';

/** Host-specific meta: same option sets, host-flavoured card copy. */
export const hostPresenceMeta = {
  card: {
    eyebrow: 'Host Studio',
    title: 'Presence',
    subtitle: 'How your profile appears publicly — page, identity, and reach.',
  } as const,
};

export const hostPresenceSource: VenuePresenceData = {
  profile: {
    displayName: 'Aria Nova',
    tagline: "Pune's resident melodic-house storyteller — Sunday terrace sessions.",
    neighborhood: 'Koregaon Park, Pune',
    categoryTag: 'Host',
    bio: 'DJ and curator behind Sunday Terrace Sessions. Roast-your-own vinyl sets, guest takeovers, and a growing crew of Afro-house believers.',
    role: 'DJ',
    whatsapp: '+91 98765 43210',
    primaryCta: 'whatsapp',
    publicProfileEnabled: true,
    slug: 'aria-nova',
    genres: ['Melodic', 'Deep House', 'Progressive', 'Afro House'],
    styleTags: ['Rooftop', 'Intimate', 'Underground'],
    socialLinks: {
      instagram: '@arianova',
      twitter: '@arianova_dj',
      soundcloud: 'soundcloud.com/aria-nova',
      spotify: 'open.spotify.com/artist/arianova',
    },
    website: 'https://arianova.com',
    email: 'bookings@arianova.com',
    city: 'Pune, India',
    photos: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    ],
    videos: [
      { id: 1, url: 'https://youtube.com/example', type: 'aftermovie', title: 'Terrace Sessions Aftermovie' },
      { id: 2, url: 'https://youtube.com/example2', type: 'promo', title: 'Back-to-Back Promo Reel' },
    ],
  },
  posts: [
    {
      id: 'post-1',
      content: 'Sunset warm-up live from the terrace — melodic house till late. Free entry before 9 PM.',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
      createdAt: '2026-09-11T14:00:00Z',
      likes: 186,
      views: 1520,
    },
    {
      id: 'post-2',
      content: 'Guest takeover announced — back-to-back afro house set this Sunday.',
      createdAt: '2026-09-04T11:30:00Z',
      likes: 147,
      views: 980,
    },
  ],
  highlights: [
    { id: 'h1', title: 'Terrace Sessions', color: '#818CF8' },
    { id: 'h2', title: 'Guest Takeovers', color: '#34D399' },
    { id: 'h3', title: 'Mix Drops', color: '#F472B6' },
  ],
  stats: {
    followersCount: 3210,
    postsCount: 48,
    totalLikes: 15240,
    totalViews: 60500,
    engagementRate: 7.8,
  },
};

export type HostPresenceCategory = VenuePresenceCategory;
export type HostPresenceRole = VenuePresenceRole;
export type HostPresenceCta = VenuePresenceCta;