// FIXTURE_ONLY: Temporary frontend development data.
// Must never be used as an API failure fallback.

import type { ExploreCity, ExploreEvent } from '../types/explore.types';

const events: ExploreEvent[] = [
  {
    id: 'neon-nights',
    slug: 'neon-nights',
    title: 'Neon Nights',
    category: 'Nightlife',
    image: '/events/neon-nights.webp',
    startsAt: '2026-09-12T21:00:00+05:30',
    venue: 'The Glass House',
    city: 'Mumbai',
    cityKey: 'mumbai',
    price: { amountPaise: 149900, currency: 'INR' },
    badge: 'Trending',
  },
  {
    id: 'rooftop-jazz',
    slug: 'rooftop-jazz',
    title: 'Rooftop Jazz',
    category: 'Music',
    image: '/events/rooftop-jazz.webp',
    startsAt: '2026-09-18T19:30:00+05:30',
    venue: 'Skyline Social',
    city: 'Pune',
    cityKey: 'pune',
    price: { amountPaise: 99900, currency: 'INR' },
  },
  {
    id: 'techno-bunker',
    slug: 'techno-bunker',
    title: 'Techno Bunker',
    category: 'Afters',
    image: '/events/techno-bunker.webp',
    startsAt: '2026-09-25T23:00:00+05:30',
    venue: 'Sector 9',
    city: 'Bengaluru',
    cityKey: 'bengaluru',
    price: { amountPaise: 179900, currency: 'INR' },
    badge: 'Trending',
  },
  {
    id: 'art-collective',
    slug: 'art-collective',
    title: 'Art Collective',
    category: 'Art',
    image: '/events/art-collective.webp',
    startsAt: '2026-10-03T16:00:00+05:30',
    venue: 'The Mill',
    city: 'Mumbai',
    cityKey: 'mumbai',
    price: null,
  },
  {
    id: 'indie-jam',
    slug: 'indie-jam',
    title: 'Indie Jam',
    category: 'Live Music',
    image: '/events/indie-jam.webp',
    startsAt: '2026-10-10T20:00:00+05:30',
    venue: 'The Courtyard',
    city: 'Pune',
    cityKey: 'pune',
    price: { amountPaise: 79900, currency: 'INR' },
  },
  {
    id: 'sunday-soul',
    slug: 'sunday-soul',
    title: 'Sunday Soul',
    category: 'Community',
    image: '/events/sunday-soul.webp',
    startsAt: '2026-10-18T11:00:00+05:30',
    venue: 'Garden City Club',
    city: 'Bengaluru',
    cityKey: 'bengaluru',
    price: null,
  },
];

const cities: ExploreCity[] = [
  { label: 'All Cities', value: '' },
  { label: 'Mumbai', value: 'mumbai' },
  { label: 'Pune', value: 'pune' },
  { label: 'Bengaluru', value: 'bengaluru' },
];

export const exploreFixture = {
  cities,
  events,
  featuredEvents: events.slice(0, 3),
} as const;
