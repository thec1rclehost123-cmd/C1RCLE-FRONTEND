// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetEnvCacheForTests } from '@c1rcle/config';

import { serializeJsonLd } from './json-ld';
import { buildPrivateMetadata, buildPublicMetadata } from './metadata';
import { isEligiblePublicEvent, isEligiblePublicHost, isEligiblePublicVenue } from './public-data';
import { absoluteUrl, getSeoEnvironment, getSiteUrl } from './site';

import type { EventDto, HostPublicDto, VenueDto } from '@c1rcle/contracts';

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

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.c1rcle.test');
  vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'C1RCLE Guest Portal');
  vi.stubEnv('NEXT_PUBLIC_ENVIRONMENT', 'production');
  vi.stubEnv('NODE_ENV', 'test');
  resetEnvCacheForTests();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetEnvCacheForTests();
});

describe('SEO environment and metadata', () => {
  it('uses the preferred production origin and clean canonical paths', () => {
    expect(getSeoEnvironment()).toBe('production');
    expect(getSiteUrl().toString()).toBe('https://thec1rcle.com/');
    expect(absoluteUrl('/explore?ignored=not-added')).toBe(
      'https://thec1rcle.com/explore?ignored=not-added',
    );
  });

  it('makes production public metadata indexable with complete social metadata', () => {
    const metadata = buildPublicMetadata({
      path: '/explore',
      title: 'Discover Events',
      description: 'Discover public events.',
    });

    expect(metadata.title).toEqual({ absolute: 'Discover Events | THE C1RCLE' });
    expect(metadata.alternates).toEqual({ canonical: 'https://thec1rcle.com/explore' });
    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      url: 'https://thec1rcle.com/explore',
      siteName: 'THE C1RCLE',
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('removes query parameters and fragments from canonical and social URLs', () => {
    const metadata = buildPublicMetadata({
      path: '/explore?city=pune#events',
      title: 'Discover Events',
      description: 'Discover public events.',
    });

    expect(metadata.alternates).toEqual({ canonical: 'https://thec1rcle.com/explore' });
    expect(metadata.openGraph).toMatchObject({ url: 'https://thec1rcle.com/explore' });
  });

  it('globally suppresses preview indexing and uses the preview origin', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_URL', 'guest-preview.vercel.app');
    resetEnvCacheForTests();

    const metadata = buildPublicMetadata({
      path: '/explore',
      title: 'Discover Events',
      description: 'Discover public events.',
    });

    expect(metadata.alternates).toEqual({ canonical: 'https://guest-preview.vercel.app/explore' });
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
      noarchive: true,
    });
  });

  it('keeps private metadata noindex but allows link following', () => {
    expect(buildPrivateMetadata('Tickets', 'Your tickets.').robots).toMatchObject({
      index: false,
      follow: true,
      noarchive: true,
    });
  });
});

describe('authoritative entity eligibility', () => {
  it('allows only complete published public events', () => {
    expect(isEligiblePublicEvent(event, new Date('2029-12-01T00:00:00.000Z'))).toBe(true);
    expect(isEligiblePublicEvent({ ...event, status: 'draft' })).toBe(false);
    expect(isEligiblePublicEvent({ ...event, isPublic: false })).toBe(false);
    expect(isEligiblePublicEvent({ ...event, imageUrl: null })).toBe(false);
    expect(isEligiblePublicEvent({ ...event, summary: '' })).toBe(false);
    expect(isEligiblePublicEvent({ ...event, venueId: null })).toBe(false);
    expect(
      isEligiblePublicEvent(
        { ...event, startAt: '2029-10-01T00:00:00.000Z' },
        new Date('2029-12-01T00:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('fails closed for venue and host contracts missing SEO publication fields', () => {
    const venue: VenueDto = {
      id: 'venue-1',
      organizationId: 'org-1',
      name: 'Venue',
      slug: 'venue',
      status: 'active',
      description: 'Description',
      capacity: null,
      city: 'Pune',
      version: 1,
      createdAt: '2029-01-01T00:00:00.000Z',
      updatedAt: '2029-01-01T00:00:00.000Z',
    };
    const host: HostPublicDto = { id: 'host-1', name: 'Host', slug: 'host' };
    expect(isEligiblePublicVenue(venue)).toBe(false);
    expect(isEligiblePublicHost(host)).toBe(false);
  });
});

it('escapes script-breaking characters in JSON-LD', () => {
  expect(serializeJsonLd({ value: '</script><script>' })).not.toContain('</script>');
  expect(serializeJsonLd({ value: '</script><script>' })).toContain('\\u003c');
});
