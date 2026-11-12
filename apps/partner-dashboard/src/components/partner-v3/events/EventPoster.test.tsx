import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EventPoster } from './EventPoster';

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    unoptimized,
  }: {
    alt?: string;
    src: string;
    unoptimized?: boolean;
    onError?: () => void;
  }) => (
    <div
      role="img"
      aria-label={alt ?? ''}
      data-src={src}
      data-unoptimized={unoptimized ? 'true' : 'false'}
    />
  ),
}));

describe('EventPoster', () => {
  it('uses the browser directly for loopback-hosted local development posters', () => {
    render(
      <EventPoster
        artwork={{
          type: 'image',
          value: 'http://localhost:3001/partner-v3/venue/neon-nights-poster.jpg',
          alt: 'Local poster',
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Local poster' })).toHaveAttribute(
      'data-src',
      'http://localhost:3001/partner-v3/venue/neon-nights-poster.jpg',
    );
    expect(screen.getByRole('img', { name: 'Local poster' })).toHaveAttribute(
      'data-unoptimized',
      'true',
    );
  });

  it('loads public GCS event posters without the Next image optimizer', () => {
    render(
      <EventPoster
        artwork={{
          type: 'image',
          value: 'https://storage.googleapis.com/c1rcle/posters/org_1/poster.jpg',
          alt: 'Public poster',
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Public poster' })).toHaveAttribute(
      'data-src',
      'https://storage.googleapis.com/c1rcle/posters/org_1/poster.jpg',
    );
    expect(screen.getByRole('img', { name: 'Public poster' })).toHaveAttribute(
      'data-unoptimized',
      'true',
    );
  });

  it('keeps unrelated remote images on the optimizer', () => {
    render(
      <EventPoster
        artwork={{ type: 'image', value: 'https://cdn.example.com/poster.jpg', alt: 'CDN poster' }}
      />,
    );

    expect(screen.getByRole('img', { name: 'CDN poster' })).toHaveAttribute(
      'data-unoptimized',
      'false',
    );
  });

  it('keeps the poster fallback visible underneath a loading or failed image', () => {
    const { rerender } = render(
      <EventPoster
        artwork={{ type: 'image', value: 'https://storage.googleapis.com/c1rcle/posters/one.jpg' }}
      />,
    );
    expect(screen.getByTestId('event-poster-fallback')).toBeInTheDocument();
    rerender(
      <EventPoster
        artwork={{ type: 'image', value: 'https://storage.googleapis.com/c1rcle/posters/two.jpg' }}
      />,
    );
    expect(screen.getByTestId('event-poster-fallback')).toBeInTheDocument();
  });

  it('renders the selected C1RCLE gradient when artwork is absent', () => {
    render(<EventPoster artwork={{ type: 'gradient', value: 'eclipse' }} />);
    expect(screen.getByTestId('event-poster-fallback')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
