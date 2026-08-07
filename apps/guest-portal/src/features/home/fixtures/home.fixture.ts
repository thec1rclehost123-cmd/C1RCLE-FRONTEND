// FIXTURE_ONLY: Temporary frontend development data.
// Must never be used as an API failure fallback.

import type { HomeFixture } from '../types/home.types';

export const homeFixture: HomeFixture = {
  hero: {
    eyebrow: 'THE FUTURE OF INDIAN NIGHTLIFE',
    title: 'THE C1RCLE',
    tagline: 'Discover Life Offline',
    description:
      'Curated campus nights, rooftop flows, and underground pop-ups — remixed for Gen Z India.',
    ctaLabel: 'Explore events',
    ctaHref: '/explore',
    desktopVideoSrc: '/home/background-video-desktop-ipod.m4v',
    mobileVideoSrc: '/home/background-video-mobile.m4v',
    desktopPosterSrc: '/home/hero-poster-desktop.jpg',
    mobilePosterSrc: '/home/hero-poster-mobile.jpg',
  },
  drops: {
    eyebrow: 'CURATED BY THE C1RCLE',
    title: 'Featured Drops',
    description:
      'The experiences defining what happens next—selected releases, limited rooms, and essential nights.',
    eventCtaLabel: 'View event',
  },
  featured: {
    eyebrow: 'HAPPENING AROUND YOU',
    title: 'Discover',
    highlightedWord: 'Offline',
    description:
      "Curated experiences, underground sets, and the best of your city's culture—all in one place.",
    ctaLabel: 'View all events',
    ctaHref: '/explore',
  },
};
