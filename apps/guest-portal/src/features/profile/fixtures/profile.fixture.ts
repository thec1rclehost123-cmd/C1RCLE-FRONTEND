// FIXTURE_ONLY: Temporary frontend development data.
// Must never be used as an API failure fallback.

import type { ProfileFixture } from '../types/profile.types';

export const profileFixture: ProfileFixture = {
  identity: {
    id: 'fixture-profile-member-01',
    displayName: 'Riya Kapoor',
    initials: 'RK',
    email: 'riya@example.com',
    phoneNumber: '98765 43210',
    city: 'Pune',
    instagram: 'riyaoffline',
    gender: 'Woman',
    memberSince: '2025-08-18T00:00:00.000Z',
    badges: ['Member', 'Early Access'],
    signInMethod: 'Phone number',
  },
  upcomingEvents: [
    {
      id: 'fixture-profile-event-rooftop-jazz',
      slug: 'rooftop-jazz',
      title: 'Rooftop Jazz',
      image: '/events/rooftop-jazz.webp',
      startsAt: '2026-09-18T19:30:00+05:30',
      venue: 'Skyline Social',
      city: 'Pune',
      participationLabel: 'Gallery Pass',
    },
    {
      id: 'fixture-profile-event-art-collective',
      slug: 'art-collective',
      title: 'Art Collective',
      image: '/events/art-collective.webp',
      startsAt: '2026-10-03T17:00:00+05:30',
      venue: 'The Mill',
      city: 'Mumbai',
      participationLabel: 'Guestlist',
    },
  ],
  attendedEvents: [
    {
      id: 'fixture-profile-event-neon-nights',
      slug: 'neon-nights',
      title: 'Neon Nights',
      image: '/events/neon-nights.webp',
      startsAt: '2026-06-12T21:00:00+05:30',
      venue: 'The Glass House',
      city: 'Mumbai',
      participationLabel: 'Member Entry',
    },
  ],
};
