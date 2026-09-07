// FIXTURE_ONLY: Temporary frontend development data.
// Must never be used as an API failure fallback.

import type {
  EventDetailFixture,
  EventDetailGuest,
  EventDetailTicketTier,
} from '../types/event-detail.types';

const guests: EventDetailGuest[] = [
  { id: 'riya', name: 'Riya', initials: 'RI', tone: 'yellow' },
  { id: 'ishika', name: 'Ishika', initials: 'IS', tone: 'red' },
  { id: 'ajay', name: 'Ajay', initials: 'AJ', tone: 'purple' },
  { id: 'maya', name: 'Maya', initials: 'M', tone: 'yellow' },
  { id: 'dev', name: 'Dev', initials: 'D', tone: 'purple' },
  { id: 'harsh', name: 'Harsh', initials: 'H', tone: 'red' },
  { id: 'nia', name: 'Nia', initials: 'N', tone: 'yellow' },
  { id: 'kabir', name: 'Kabir', initials: 'K', tone: 'purple' },
];

const ticketTiers: EventDetailTicketTier[] = [
  {
    id: 'gallery-pass',
    name: 'Gallery Pass',
    description: 'Standard admission preview',
    price: { amountPaise: 80000, currency: 'INR' },
    availabilityLabel: 'Fixture preview',
  },
  {
    id: 'artist-circle',
    name: 'Artist Circle',
    description: 'Priority admission preview',
    price: { amountPaise: 120000, currency: 'INR' },
    availabilityLabel: 'Fixture preview',
  },
];

const sharedDetail = {
  hostId: 'high-spirits-collective',
  host: 'High Spirits Collective',
  summary:
    'A one-night gathering built around sound, art, and the people who keep the city moving.',
  description: [
    'Step into an intimate night of live culture, bold visuals, and a room designed for discovery.',
    'Arrive early, meet the community, and stay for the full experience. Final entry remains subject to the future live event and ticket contract.',
  ],
  doorNote: '21+ only. Carry a valid government ID. Entry rules shown here are fixture content.',
  lifecycle: 'scheduled' as const,
  guests,
  interestedCount: 156,
  ticketTiers,
};

export const eventDetailFixtures: readonly EventDetailFixture[] = [
  {
    ...sharedDetail,
    id: 'neon-nights',
    slug: 'neon-nights',
    title: 'Neon Nights',
    category: 'Nightlife',
    image: '/events/neon-nights.webp',
    accentTone: 'pink',
    startsAt: '2026-09-12T21:00:00+05:30',
    endsAt: '2026-09-13T01:00:00+05:30',
    venue: 'The Glass House',
    venueId: 'the-glass-house-mumbai',
    address: 'Lower Parel, Mumbai',
    city: 'Mumbai',
  },
  {
    ...sharedDetail,
    id: 'rooftop-jazz',
    slug: 'rooftop-jazz',
    title: 'Rooftop Jazz',
    category: 'Music',
    image: '/events/rooftop-jazz.webp',
    accentTone: 'purple',
    startsAt: '2026-09-18T19:30:00+05:30',
    endsAt: '2026-09-18T23:30:00+05:30',
    venue: 'Skyline Social',
    venueId: 'skyline-social',
    address: 'Koregaon Park, Pune',
    city: 'Pune',
  },
  {
    ...sharedDetail,
    id: 'techno-bunker',
    slug: 'techno-bunker',
    title: 'Techno Bunker',
    category: 'Afters',
    image: '/events/techno-bunker.webp',
    accentTone: 'red',
    startsAt: '2026-09-25T23:00:00+05:30',
    endsAt: '2026-09-26T04:00:00+05:30',
    venue: 'Sector 9',
    venueId: 'sector-9',
    address: 'Indiranagar, Bengaluru',
    city: 'Bengaluru',
  },
  {
    ...sharedDetail,
    id: 'art-collective',
    slug: 'art-collective',
    title: 'Art Collective',
    category: 'Art',
    image: '/events/art-collective.webp',
    accentTone: 'red',
    startsAt: '2026-10-03T16:00:00+05:30',
    endsAt: '2026-10-03T22:00:00+05:30',
    venue: 'The Mill',
    venueId: 'the-mill-mumbai',
    address: 'Colaba, Mumbai',
    city: 'Mumbai',
  },
  {
    ...sharedDetail,
    id: 'indie-jam',
    slug: 'indie-jam',
    title: 'Indie Jam',
    category: 'Live Music',
    image: '/events/indie-jam.webp',
    accentTone: 'red',
    startsAt: '2026-10-10T20:00:00+05:30',
    endsAt: '2026-10-10T23:59:00+05:30',
    venue: 'The Courtyard',
    venueId: 'the-courtyard-pune',
    address: 'Kalyani Nagar, Pune',
    city: 'Pune',
  },
  {
    ...sharedDetail,
    id: 'sunday-soul',
    slug: 'sunday-soul',
    title: 'Sunday Soul',
    category: 'Community',
    image: '/events/sunday-soul.webp',
    accentTone: 'orange',
    startsAt: '2026-10-18T11:00:00+05:30',
    endsAt: '2026-10-18T18:00:00+05:30',
    venue: 'Garden City Club',
    venueId: 'garden-city-club',
    address: 'Lavelle Road, Bengaluru',
    city: 'Bengaluru',
  },
];

export function findEventDetailFixture(eventId: string) {
  return eventDetailFixtures.find((event) => event.id === eventId || event.slug === eventId);
}
