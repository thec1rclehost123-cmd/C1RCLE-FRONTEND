// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import EventDetailPage, { generateMetadata as generateEventMetadata } from './event/[eventId]/page';
import HostProfilePage, { generateMetadata as generateHostMetadata } from './host/[hostId]/page';
import VenueProfilePage, {
  generateMetadata as generateVenueMetadata,
} from './venue/[venueId]/page';

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
);

vi.mock('next/navigation', () => ({ notFound }));

vi.mock('@/lib/seo/site', () => ({
  absoluteUrl: (path: string) => `https://thec1rcle.com${path}`,
  isProductionSeo: () => true,
}));

vi.mock('@/lib/seo/public-data', () => ({
  getPublicEventForSeo: vi.fn(() => Promise.resolve(null)),
  getPublicHostForSeo: vi.fn(() => Promise.resolve(null)),
  getPublicVenueForSeo: vi.fn(() => Promise.resolve(null)),
  isEligiblePublicHost: () => false,
  isEligiblePublicVenue: () => false,
}));

const eventParams = { params: Promise.resolve({ eventId: 'missing-event' }) };
const hostParams = { params: Promise.resolve({ hostId: 'missing-host' }) };
const venueParams = { params: Promise.resolve({ venueId: 'missing-venue' }) };

describe('production public entity boundaries', () => {
  it('returns not found for an unknown event page and its metadata', async () => {
    await expect(EventDetailPage(eventParams)).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(generateEventMetadata(eventParams)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('returns not found for an unknown host page and its metadata', async () => {
    await expect(HostProfilePage(hostParams)).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(generateHostMetadata(hostParams)).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('returns not found for an unknown venue page and its metadata', async () => {
    await expect(VenueProfilePage(venueParams)).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(generateVenueMetadata(venueParams)).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
