// FIXTURE_ONLY: Temporary frontend development data.
// Must never be used as an API failure fallback.

import type { HomeFixture } from '../types/home.types';

export const homeFixture: HomeFixture = {
  hero: {
    eyebrow: 'THE C1RCLE',
    title: 'THE C1RCLE',
    tagline: 'Discover Life Offline',
    description:
      'Discover the right nights, book entry, run guestlists, track promoters, and move people from online hype to real doors.',
    ctaLabel: 'Enter the C1RCLE',
    ctaHref: '/explore',
    desktopVideoSrc: '/home/video/hero-desktop.m4v',
    mobileVideoSrc: '/home/video/hero-mobile.m4v',
    desktopPosterSrc: '/home/video/hero-poster.webp',
    mobilePosterSrc: '/home/video/hero-poster.webp',
  },
  drops: {
    eyebrow: 'NOW DROPPING',
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
