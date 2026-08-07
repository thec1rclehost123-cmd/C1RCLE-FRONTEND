import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import VenueProfilePage, { generateMetadata, generateStaticParams } from './page';

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    preload: _preload,
    ...props
  }: React.ComponentProps<'img'> & { fill?: boolean; preload?: boolean }) => (
    <img alt={alt} {...props} />
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

describe('VenueProfilePage', () => {
  it('prebuilds every fixture venue profile', () => {
    expect(generateStaticParams()).toEqual(
      expect.arrayContaining([
        { venueId: 'the-glass-house-mumbai' },
        { venueId: 'skyline-social' },
        { venueId: 'sector-9' },
      ]),
    );
  });

  it('renders venue identity, location, and upcoming event destination', async () => {
    render(await VenueProfilePage({ params: Promise.resolve({ venueId: 'skyline-social' }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Skyline Social' })).toBeInTheDocument();
    expect(screen.getAllByText('Koregaon Park, Pune')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Maps ↗' })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/search'),
    );
    expect(screen.getByRole('link', { name: 'View Rooftop Jazz' })).toHaveAttribute(
      'href',
      '/event/rooftop-jazz',
    );
  });

  it('uses notFound for an unknown venue', async () => {
    await expect(
      VenueProfilePage({ params: Promise.resolve({ venueId: 'missing-venue' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('generates venue-specific metadata', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ venueId: 'skyline-social' }),
    });

    expect(metadata.title).toBe('Skyline Social | THE C1RCLE');
    expect(metadata.robots).toEqual({ follow: false, index: false });
  });
});
