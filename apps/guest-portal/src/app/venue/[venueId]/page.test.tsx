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
    // eslint-disable-next-line @next/next/no-img-element
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
    expect(screen.getAllByRole('link', { name: 'Directions' })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/search'),
    );
    expect(screen.getAllByRole('link', { name: 'View menu' })[0]).toHaveAttribute('href', '#menu');
    expect(screen.getByRole('heading', { name: 'A menu made for sharing' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Rooftop Jazz' })).toHaveAttribute(
      'href',
      '/event/rooftop-jazz',
    );
  });

  it('renders the experience-venue template for a non-restaurant venue', async () => {
    render(
      await VenueProfilePage({
        params: Promise.resolve({ venueId: 'the-glass-house-mumbai' }),
      }),
    );

    expect(screen.getByRole('heading', { level: 1, name: 'The Glass House' })).toBeInTheDocument();
    expect(screen.getByText('250 standing · 140 seated')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Spaces and formats' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /High Spirits Collective/i })).toHaveAttribute(
      'href',
      '/host/high-spirits-collective',
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
