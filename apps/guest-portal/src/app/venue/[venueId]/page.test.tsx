import { describe, expect, it, vi } from 'vitest';

import VenueProfilePage, { dynamic, generateMetadata } from './page';

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    preload: _preload,
    ...props
  }: React.ComponentProps<'img'> & { fill?: boolean; preload?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/lib/seo/public-data', () => ({
  getPublicVenueForSeo: () => Promise.resolve(null),
  isEligiblePublicVenue: () => false,
}));

describe('VenueProfilePage', () => {
  it('renders public venue profiles on demand', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('does not substitute fixture profiles when a public venue is unavailable', async () => {
    await expect(
      VenueProfilePage({ params: Promise.resolve({ venueId: 'skyline-social' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('does not generate metadata for a fixture-only venue', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ venueId: 'skyline-social' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
