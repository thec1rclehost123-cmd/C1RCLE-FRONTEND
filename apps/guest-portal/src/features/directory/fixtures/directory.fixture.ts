// FIXTURE_ONLY: Temporary frontend development data.
// Must never be used as an API failure fallback.

import { eventDetailFixtures } from '@/features/event-detail/fixtures/event-detail.fixture';

import type {
  DirectoryEventSummary,
  HostDirectoryProfile,
  VenueDirectoryProfile,
} from '../types/directory.types';

const events: readonly DirectoryEventSummary[] = eventDetailFixtures.map((event) => ({
  category: event.category,
  city: event.city,
  id: event.id,
  image: event.image,
  slug: event.slug,
  startsAt: event.startsAt,
  title: event.title,
  venue: event.venue,
  venueId: event.venueId,
}));

const eventsForSlugs = (...slugs: readonly string[]) =>
  events.filter((event) => slugs.includes(event.slug));

export const hostDirectoryFixtures: readonly HostDirectoryProfile[] = [
  {
    id: 'high-spirits-collective',
    name: 'High Spirits Collective',
    initials: 'HS',
    verified: true,
    role: 'Event collective',
    city: 'Pune',
    neighborhood: 'Koregaon Park',
    handle: 'highspiritscollective',
    tagline: 'Live culture, loud rooms, and nights built for discovery.',
    bio: 'High Spirits Collective brings artists, selectors, and communities into the same room. Their calendar moves between intimate live sets, visual culture, and late-night formats across the city circuit.',
    tags: ['Live music', 'Nightlife', 'Community', 'Culture'],
    coverImage: '/events/neon-nights.webp',
    events,
  },
  {
    id: 'underground-studio',
    name: 'Underground Studio',
    initials: 'US',
    verified: true,
    role: 'Independent curator',
    city: 'Mumbai',
    neighborhood: 'Lower Parel',
    handle: 'undergroundstudio',
    tagline: 'Small rooms, sharp lineups, zero filler.',
    bio: 'An independent curatorial project centered on emerging artists, experimental formats, and limited-capacity rooms.',
    tags: ['Independent', 'Electronic', 'Art'],
    coverImage: '/events/art-collective.webp',
    events: [],
  },
  {
    id: 'sunday-service',
    name: 'Sunday Service',
    initials: 'SS',
    verified: false,
    role: 'Day-party series',
    city: 'Bengaluru',
    neighborhood: 'Lavelle Road',
    handle: 'sundayserviceindia',
    tagline: 'Good light, warm sound, and an unhurried crowd.',
    bio: 'A daytime series built around soul, food, conversation, and long-form sets.',
    tags: ['Soul', 'Day parties', 'Food'],
    coverImage: '/events/sunday-soul.webp',
    events: [],
  },
];

export const venueDirectoryFixtures: readonly VenueDirectoryProfile[] = [
  {
    id: 'the-glass-house-mumbai',
    name: 'The Glass House',
    initials: 'GH',
    city: 'Mumbai',
    address: 'Lower Parel, Mumbai',
    summary:
      'An industrial room for large-format visuals, live productions, and after-dark gatherings.',
    knownFor: ['Nightlife', 'Large room', 'Live production'],
    coverImage: '/events/neon-nights.webp',
    events: eventsForSlugs('neon-nights'),
  },
  {
    id: 'skyline-social',
    name: 'Skyline Social',
    initials: 'SS',
    city: 'Pune',
    address: 'Koregaon Park, Pune',
    summary: 'A rooftop room with open-air sets, city views, and a close-up stage.',
    knownFor: ['Rooftop', 'Live music', 'Sunset'],
    coverImage: '/events/rooftop-jazz.webp',
    events: eventsForSlugs('rooftop-jazz'),
  },
  {
    id: 'sector-9',
    name: 'Sector 9',
    initials: 'S9',
    city: 'Bengaluru',
    address: 'Indiranagar, Bengaluru',
    summary: 'A low-light basement tuned for electronic music and long nights.',
    knownFor: ['Electronic', 'Late nights', 'Basement'],
    coverImage: '/events/techno-bunker.webp',
    events: eventsForSlugs('techno-bunker'),
  },
  {
    id: 'the-mill-mumbai',
    name: 'The Mill',
    initials: 'TM',
    city: 'Mumbai',
    address: 'Colaba, Mumbai',
    summary: 'A flexible culture space for art, independent labels, and community-led programming.',
    knownFor: ['Art', 'Pop-ups', 'Community'],
    coverImage: '/events/art-collective.webp',
    events: eventsForSlugs('art-collective'),
  },
  {
    id: 'the-courtyard-pune',
    name: 'The Courtyard',
    initials: 'TC',
    city: 'Pune',
    address: 'Kalyani Nagar, Pune',
    summary: 'An intimate outdoor stage for independent bands and collaborative live sessions.',
    knownFor: ['Indie', 'Open air', 'Live music'],
    coverImage: '/events/indie-jam.webp',
    events: eventsForSlugs('indie-jam'),
  },
  {
    id: 'garden-city-club',
    name: 'Garden City Club',
    initials: 'GC',
    city: 'Bengaluru',
    address: 'Lavelle Road, Bengaluru',
    summary: 'A green daytime venue for slow Sundays, soulful selectors, and community tables.',
    knownFor: ['Day parties', 'Soul', 'Outdoors'],
    coverImage: '/events/sunday-soul.webp',
    events: eventsForSlugs('sunday-soul'),
  },
];

export function findHostDirectoryFixture(hostId: string) {
  return hostDirectoryFixtures.find((host) => host.id === hostId);
}

export function findVenueDirectoryFixture(venueId: string) {
  return venueDirectoryFixtures.find((venue) => venue.id === venueId);
}
