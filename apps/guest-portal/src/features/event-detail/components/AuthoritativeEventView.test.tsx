import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeEventView } from './AuthoritativeEventView';

import type { EventDto, EventPublicDetailDto } from '@c1rcle/contracts';

vi.mock('@/lib/seo/site', () => ({
  absoluteUrl: (path: string) => `https://thec1rcle.com${path}`,
}));

const event: EventDto = {
  id: 'event-1',
  organizationId: 'org-1',
  venueId: 'venue-1',
  slug: 'public-event',
  title: 'Public Event',
  summary: 'An authoritative public event.',
  description: 'Full event description.',
  imageUrl: 'https://images.example.test/event.webp',
  startAt: '2030-01-01T18:00:00.000Z',
  endAt: null,
  status: 'published',
  isPublic: true,
  tags: [],
  startingPricePaise: null,
  isFree: false,
  cancellationReason: null,
  version: 1,
  createdAt: '2029-01-01T00:00:00.000Z',
  updatedAt: '2029-06-01T00:00:00.000Z',
};

const detail: EventPublicDetailDto = {
  ...event,
  venue: {
    id: 'venue-1',
    name: 'Public Venue',
    slug: 'public-venue',
    photoUrl: 'https://images.example.test/venue.webp',
    address: {
      street: '1 Test Street',
      city: 'Pune',
      state: 'Maharashtra',
      zip: '411001',
      country: 'IN',
      lat: 18.5204,
      lng: 73.8567,
    },
  },
  organizer: { id: 'org-1', name: 'Public Host', slug: 'public-host' },
};

describe('AuthoritativeEventView structured data', () => {
  it('uses the authoritative venue and links its public relationships', () => {
    const { container, getByRole } = render(<AuthoritativeEventView detail={detail} />);
    const script = [...container.querySelectorAll('script[type="application/ld+json"]')].find(
      (candidate) => candidate.textContent.includes('"@type":"Event"'),
    );
    expect(script).not.toBeNull();

    const jsonLd = JSON.parse(script?.textContent ?? '{}') as Record<string, unknown>;
    expect(jsonLd).toMatchObject({
      '@type': 'Event',
      name: 'Public Event',
      image: ['https://images.example.test/event.webp'],
      startDate: '2030-01-01T18:00:00.000Z',
      url: 'https://thec1rcle.com/event/public-event',
      location: {
        '@type': 'Place',
        name: 'Public Venue',
        url: 'https://thec1rcle.com/venue/public-venue',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '1 Test Street',
          addressLocality: 'Pune',
          addressRegion: 'Maharashtra',
          postalCode: '411001',
          addressCountry: 'IN',
        },
        geo: { '@type': 'GeoCoordinates', latitude: 18.5204, longitude: 73.8567 },
      },
    });
    expect(getByRole('link', { name: 'Public Venue' })).toHaveAttribute(
      'href',
      '/venue/public-venue',
    );
    expect(getByRole('link', { name: 'Public Host' })).toHaveAttribute('href', '/host/public-host');
    expect(jsonLd).not.toHaveProperty('organizer');
    expect(jsonLd).not.toHaveProperty('offers');
    expect(JSON.stringify(jsonLd)).not.toContain('org-1');
    expect(JSON.stringify(jsonLd)).not.toContain('venue-1');
  });

  it('omits location, organizer, and offers when relationships are unavailable', () => {
    const { container } = render(
      <AuthoritativeEventView detail={{ ...event, venue: null, organizer: null }} />,
    );
    const script = [...container.querySelectorAll('script[type="application/ld+json"]')].find(
      (candidate) => candidate.textContent.includes('"@type":"Event"'),
    );
    const jsonLd = JSON.parse(script?.textContent ?? '{}') as Record<string, unknown>;

    expect(jsonLd).not.toHaveProperty('location');
    expect(jsonLd).not.toHaveProperty('organizer');
    expect(jsonLd).not.toHaveProperty('offers');
  });
});
