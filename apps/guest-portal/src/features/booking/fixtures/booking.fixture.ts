// FIXTURE_ONLY: Temporary frontend development data.
// Must never be used as an API failure fallback.

import type {
  BookingConfirmationFixture,
  BookingEventFixture,
  BookingTicketTier,
} from '../types/booking.types';

const standardTiers: readonly BookingTicketTier[] = [
  {
    id: 'gallery-pass',
    name: 'Gallery Pass',
    description: 'Standard admission preview',
    price: { amountPaise: 80000, currency: 'INR' },
    maximumQuantity: 4,
  },
  {
    id: 'artist-circle',
    name: 'Artist Circle',
    description: 'Priority admission preview',
    price: { amountPaise: 120000, currency: 'INR' },
    maximumQuantity: 2,
  },
];

const sharedEvent = {
  doorNote: '21+ only. Carry a valid government ID. Entry rules are fixture content.',
  ticketTiers: standardTiers,
};

export const bookingEventFixtures: readonly BookingEventFixture[] = [
  {
    ...sharedEvent,
    id: 'neon-nights',
    title: 'Neon Nights',
    category: 'Nightlife',
    image: '/events/neon-nights.jpg',
    accentTone: 'pink',
    startsAt: '2026-09-12T21:00:00+05:30',
    venue: 'The Glass House',
    address: 'Lower Parel, Mumbai',
    city: 'Mumbai',
  },
  {
    ...sharedEvent,
    id: 'rooftop-jazz',
    title: 'Rooftop Jazz',
    category: 'Music',
    image: '/events/rooftop-jazz.jpg',
    accentTone: 'purple',
    startsAt: '2026-09-18T19:30:00+05:30',
    venue: 'Skyline Social',
    address: 'Koregaon Park, Pune',
    city: 'Pune',
  },
  {
    ...sharedEvent,
    id: 'techno-bunker',
    title: 'Techno Bunker',
    category: 'Afters',
    image: '/events/techno-bunker.jpg',
    accentTone: 'red',
    startsAt: '2026-09-25T23:00:00+05:30',
    venue: 'Sector 9',
    address: 'Indiranagar, Bengaluru',
    city: 'Bengaluru',
  },
  {
    ...sharedEvent,
    id: 'art-collective',
    title: 'Art Collective',
    category: 'Art',
    image: '/events/art-collective.jpg',
    accentTone: 'red',
    startsAt: '2026-10-03T16:00:00+05:30',
    venue: 'The Mill',
    address: 'Colaba, Mumbai',
    city: 'Mumbai',
  },
  {
    ...sharedEvent,
    id: 'indie-jam',
    title: 'Indie Jam',
    category: 'Live Music',
    image: '/events/indie-jam.jpg',
    accentTone: 'red',
    startsAt: '2026-10-10T20:00:00+05:30',
    venue: 'The Courtyard',
    address: 'Kalyani Nagar, Pune',
    city: 'Pune',
  },
  {
    ...sharedEvent,
    id: 'sunday-soul',
    title: 'Sunday Soul',
    category: 'Community',
    image: '/events/sunday-soul.jpg',
    accentTone: 'orange',
    startsAt: '2026-10-18T11:00:00+05:30',
    venue: 'Garden City Club',
    address: 'Lavelle Road, Bengaluru',
    city: 'Bengaluru',
  },
];

export const bookingConfirmationFixtures: readonly BookingConfirmationFixture[] =
  bookingEventFixtures.map((event) => ({
    id: `preview-${event.id}`,
    eventId: event.id,
    attendeeName: 'Guest Preview',
    tierName: event.ticketTiers[0]?.name ?? 'Admission Preview',
    quantity: 1,
    total: event.ticketTiers[0]?.price ?? { amountPaise: 0, currency: 'INR' },
    referenceLabel: `PREVIEW-${event.id.toUpperCase()}`,
  }));

export function findBookingEventFixture(eventId: string) {
  return bookingEventFixtures.find((event) => event.id === eventId);
}

export function findBookingConfirmationFixture(orderId: string) {
  return bookingConfirmationFixtures.find((order) => order.id === orderId);
}
