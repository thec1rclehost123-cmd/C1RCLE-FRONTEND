import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthoritativeEventView } from './AuthoritativeEventView';

import type { EventDto } from '@c1rcle/contracts';

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

describe('AuthoritativeEventView structured data', () => {
  it('uses authoritative event fields and omits unsupported venue, organizer, and offers', () => {
    const { container } = render(<AuthoritativeEventView event={event} />);
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
    });
    expect(jsonLd).not.toHaveProperty('location');
    expect(jsonLd).not.toHaveProperty('organizer');
    expect(jsonLd).not.toHaveProperty('offers');
    expect(JSON.stringify(jsonLd)).not.toContain('org-1');
    expect(JSON.stringify(jsonLd)).not.toContain('venue-1');
  });
});
