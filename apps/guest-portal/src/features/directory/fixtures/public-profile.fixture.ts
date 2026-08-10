// FIXTURE_ONLY: Editable public-profile presentation data.
// The future Partner Dashboard should produce this DTO; it is never an API failure fallback.

import {
  findHostDirectoryFixture,
  findVenueDirectoryFixture,
  hostDirectoryFixtures,
  venueDirectoryFixtures,
} from './directory.fixture';

import type {
  ExperienceVenuePublicProfile,
  HostPublicProfile,
  PublicProfileMedia,
  VenuePublicProfile,
} from '../types/directory.types';

const nightlifeGallery = [
  {
    id: 'crowd-closeup',
    src: '/home/memories/photo1.webp',
    alt: 'Friends dancing together in a crowded room',
    caption: 'The room, in full voice.',
  },
  {
    id: 'selectors',
    src: '/home/memories/photo4.webp',
    alt: 'Two selectors smiling behind a DJ console',
    caption: 'Selectors who know how to hold a room.',
  },
  {
    id: 'pool-party',
    src: '/home/memories/photo12.webp',
    alt: 'A lively crowd celebrating together in a pool',
    caption: 'Some nights refuse to stay indoors.',
  },
  {
    id: 'masquerade',
    src: '/home/memories/photo15.webp',
    alt: 'Guests dressed for a masquerade celebration',
    caption: 'A little theatre never hurts.',
  },
] as const satisfies readonly PublicProfileMedia[];

const skylineDirectory = findVenueDirectoryFixture('skyline-social');
if (!skylineDirectory) throw new Error('Missing Skyline Social fixture');

const restaurantProfile: VenuePublicProfile = {
  id: skylineDirectory.id,
  entityType: 'venue',
  template: 'restaurant-venue',
  theme: {
    accent: '#D7A95F',
    accentSoft: 'rgba(215, 169, 95, 0.17)',
    accentText: '#F2D59C',
    displayStyle: 'editorial',
  },
  hero: {
    eyebrow: 'Restaurant · listening room',
    title: 'Skyline Social',
    subtitle: 'Fire-led plates, low lights, and a room that stays for the music.',
    locationLabel: skylineDirectory.address,
    statusLabel: 'Dinner from 6 pm',
    cover: {
      id: 'skyline-hero',
      src: '/profiles/restaurant/hero.webp',
      alt: 'Warmly lit dining room at Skyline Social',
      focalPoint: 'center',
    },
    verified: true,
  },
  actions: [
    { id: 'menu', label: 'View menu', href: '#menu', tone: 'primary' },
    { id: 'reserve', label: 'Book a table', href: '#reservations', tone: 'secondary' },
    {
      id: 'maps',
      label: 'Directions',
      href: 'https://www.google.com/maps/search/?api=1&query=Skyline+Social+Koregaon+Park+Pune',
      tone: 'quiet',
      external: true,
    },
  ],
  contact: {
    address: 'Koregaon Park, Pune',
    phone: '+91 20 4000 1188',
    instagram: '@skylinesocial',
    website: 'skylinesocial.in',
    mapsHref:
      'https://www.google.com/maps/search/?api=1&query=Skyline+Social+Koregaon+Park+Pune',
  },
  tags: ['Modern Indian', 'Cocktail bar', 'Listening room', 'Late dinner'],
  events: skylineDirectory.events,
  story: {
    eyebrow: 'A table with a pulse',
    headline: 'Dinner that moves at the speed of the night.',
    body: [
      'Skyline Social is a restaurant, cocktail room, and late-night listening space built around fire, produce, and sound.',
      'The menu begins at the grill and opens into shared plates, bright seasonal sides, and cocktails made for long conversations. As dinner settles, the selectors take over.',
    ],
  },
  cuisine: ['Live-fire', 'Modern Indian', 'Seasonal plates', 'Cocktails'],
  hours: [
    { day: 'Mon', hours: 'Closed' },
    { day: 'Tue', hours: '6 pm – 12 am' },
    { day: 'Wed', hours: '6 pm – 12 am' },
    { day: 'Thu', hours: '6 pm – 1 am' },
    { day: 'Fri', hours: '6 pm – 1:30 am' },
    { day: 'Sat', hours: '6 pm – 1:30 am' },
    { day: 'Sun', hours: '12 pm – 11 pm' },
  ],
  menu: [
    {
      id: 'charred-cut',
      name: 'Charred cut, green pepper',
      description: 'Live-fire preparation, smoked jus, fresh herb relish.',
      priceLabel: '₹1,250',
      image: {
        id: 'signature-dish',
        src: '/profiles/restaurant/signature-dish.webp',
        alt: 'Charcoal-grilled signature dish with herb relish',
      },
    },
    {
      id: 'market-greens',
      name: 'Market greens, ember dressing',
      description: 'Seasonal leaves, charred citrus, toasted seeds.',
      priceLabel: '₹525',
    },
    {
      id: 'smoked-cocoa',
      name: 'Smoked cocoa, sea salt',
      description: 'Dark chocolate, malt, cultured cream.',
      priceLabel: '₹450',
    },
  ],
  gallery: [
    {
      id: 'dining-room',
      src: '/profiles/restaurant/dining-room.webp',
      alt: 'Skyline Social dining room and open kitchen',
      caption: 'An intimate room built for dinner and sound.',
    },
    {
      id: 'cocktail-bar',
      src: '/profiles/restaurant/bar.webp',
      alt: 'A signature cocktail on the dark wood bar',
      caption: 'The bar keeps its own rhythm.',
    },
    {
      id: 'dish',
      src: '/profiles/restaurant/signature-dish.webp',
      alt: 'A live-fire signature plate',
      caption: 'Fire-led, produce-first cooking.',
    },
  ],
  reservationNote:
    'Tables are held for 15 minutes. Groups of eight or more can request a shared feast and listening-room seating.',
};

function createExperienceVenueProfile(venueId: string): ExperienceVenuePublicProfile {
  const venue = findVenueDirectoryFixture(venueId);
  if (!venue) throw new Error(`Missing venue fixture: ${venueId}`);

  const isGlassHouse = venue.id === 'the-glass-house-mumbai';
  const accent = isGlassHouse ? '#B86BFF' : '#FF5C35';
  const accentText = isGlassHouse ? '#DDB8FF' : '#FF9B80';

  return {
    id: venue.id,
    entityType: 'venue',
    template: 'experience-venue',
    theme: {
      accent,
      accentSoft: isGlassHouse ? 'rgba(184, 107, 255, 0.16)' : 'rgba(255, 92, 53, 0.16)',
      accentText,
      displayStyle: 'bold',
    },
    hero: {
      eyebrow: isGlassHouse ? 'Independent culture venue' : 'C1RCLE venue',
      title: venue.name,
      subtitle: venue.summary,
      locationLabel: venue.address,
      statusLabel: venue.events.length > 0 ? `${String(venue.events.length)} upcoming` : 'Calendar opening soon',
      cover: {
        id: `${venue.id}-cover`,
        src: venue.coverImage,
        alt: `${venue.name} atmosphere`,
      },
      verified: true,
    },
    actions: [
      { id: 'events', label: 'See events', href: '#events', tone: 'primary' },
      {
        id: 'maps',
        label: 'Get directions',
        href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${venue.name}, ${venue.address}`,
        )}`,
        tone: 'secondary',
        external: true,
      },
      { id: 'enquire', label: 'Venue enquiries', href: '#contact', tone: 'quiet' },
    ],
    contact: {
      address: venue.address,
      instagram: `@${venue.id.replaceAll('-', '')}`,
      mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${venue.name}, ${venue.address}`,
      )}`,
    },
    tags: venue.knownFor,
    events: venue.events,
    summary: venue.summary,
    capacityLabel: isGlassHouse ? '250 standing · 140 seated' : '80–180 guests',
    formats: isGlassHouse
      ? ['Live shows', 'Club nights', 'Brand worlds', 'Art installations']
      : [...venue.knownFor],
    amenities: [
      'House sound and lighting',
      'Artist green room',
      'Accessible entrance',
      'Full-service bar',
      'Production support',
      'Late-night license',
    ],
    spaces: [
      {
        id: 'main-room',
        name: 'The main room',
        description: 'A flexible, black-box floor with clean sightlines and room for a full-stage build.',
        meta: isGlassHouse ? '250 standing' : 'Main floor',
      },
      {
        id: 'studio',
        name: isGlassHouse ? 'Gallery threshold' : 'Side room',
        description: 'A quieter arrival space for installations, pop-ups, conversations, and private hosting.',
        meta: 'Modular layout',
      },
    ],
    gallery: [
      {
        id: `${venue.id}-poster`,
        src: venue.coverImage,
        alt: `${venue.name} featured event artwork`,
        caption: 'A room that changes with every format.',
      },
      ...nightlifeGallery,
    ],
    policyNote:
      'Entry and age rules vary by event. Accessibility, production, and private-hire requirements can be confirmed before booking.',
    collaboratorHostIds: isGlassHouse ? ['high-spirits-collective', 'underground-studio'] : [],
  };
}

function createHostPublicProfile(hostId: string): HostPublicProfile {
  const host = findHostDirectoryFixture(hostId);
  if (!host) throw new Error(`Missing host fixture: ${hostId}`);

  const isHighSpirits = host.id === 'high-spirits-collective';

  return {
    id: host.id,
    entityType: 'host',
    template: 'host',
    theme: {
      accent: isHighSpirits ? '#FF4D21' : '#B86BFF',
      accentSoft: isHighSpirits ? 'rgba(255, 77, 33, 0.17)' : 'rgba(184, 107, 255, 0.15)',
      accentText: isHighSpirits ? '#FF9B80' : '#DDB8FF',
      displayStyle: 'bold',
    },
    hero: {
      eyebrow: host.role,
      title: host.name,
      subtitle: host.tagline,
      locationLabel: `${host.neighborhood}, ${host.city}`,
      statusLabel: host.events.length > 0 ? `${String(host.events.length)} events live` : 'Next drop soon',
      cover: {
        id: `${host.id}-cover`,
        src: host.coverImage,
        alt: `${host.name} event atmosphere`,
      },
      verified: host.verified,
    },
    actions: [
      { id: 'events', label: 'See events', href: '#events', tone: 'primary' },
      { id: 'follow', label: 'Follow soon', tone: 'secondary', disabled: true },
      {
        id: 'instagram',
        label: 'Instagram',
        href: 'https://www.instagram.com/',
        tone: 'quiet',
        external: true,
      },
    ],
    contact: {
      instagram: `@${host.handle}`,
    },
    tags: host.tags,
    events: host.events,
    handle: host.handle,
    role: host.role,
    bio: host.bio,
    prompts: [
      {
        id: 'perfect-room',
        prompt: 'The room we always want to create…',
        answer: isHighSpirits
          ? 'Close enough to meet someone new, loud enough to lose track of time.'
          : 'Intentional lineups, intimate capacity, and no filler between the moments.',
        image: nightlifeGallery[0],
      },
      {
        id: 'night-starts',
        prompt: 'Our perfect night starts with…',
        answer: 'A risky first track, the right light in the room, and everyone arriving before the headline set.',
        image: nightlifeGallery[1],
      },
      {
        id: 'crowd',
        prompt: 'What makes our crowd different?',
        answer: 'They show up curious. The music can change, the venue can change, but the generosity stays.',
      },
    ],
    gallery: nightlifeGallery,
    series: [
      {
        id: 'after-dark',
        name: isHighSpirits ? 'After Dark' : 'The small room series',
        description: isHighSpirits
          ? 'One-off rooms pairing live culture, selectors, and visual collaborators.'
          : 'Limited-capacity nights for emerging artists and sharp new formats.',
        venueLabel: isHighSpirits ? 'Across Pune and Mumbai' : host.city,
        image: {
          id: 'series-image',
          src: isHighSpirits ? '/events/neon-nights.webp' : host.coverImage,
          alt: `${host.name} recurring event series`,
        },
      },
    ],
  };
}

export const venuePublicProfileFixtures: readonly VenuePublicProfile[] = [
  restaurantProfile,
  ...venueDirectoryFixtures
    .filter((venue) => venue.id !== restaurantProfile.id)
    .map((venue) => createExperienceVenueProfile(venue.id)),
];

export const hostPublicProfileFixtures: readonly HostPublicProfile[] = hostDirectoryFixtures.map(
  (host) => createHostPublicProfile(host.id),
);

export function findVenuePublicProfileFixture(venueId: string) {
  return venuePublicProfileFixtures.find((profile) => profile.id === venueId);
}

export function findHostPublicProfileFixture(hostId: string) {
  return hostPublicProfileFixtures.find((profile) => profile.id === hostId);
}
