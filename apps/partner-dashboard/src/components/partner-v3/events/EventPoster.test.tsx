import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EventPoster } from './EventPoster';

vi.mock('next/image', () => ({
  default: ({ alt, src, unoptimized }: { alt?: string; src: string; unoptimized?: boolean }) => (
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

  it('does not classify public storage images as loopback assets', () => {
    render(
      <EventPoster
        artwork={{
          type: 'image',
          value: 'https://cdn.example.com/poster.jpg',
          alt: 'Public poster',
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Public poster' })).toHaveAttribute(
      'data-src',
      'https://cdn.example.com/poster.jpg',
    );
    expect(screen.getByRole('img', { name: 'Public poster' })).toHaveAttribute(
      'data-unoptimized',
      'false',
    );
  });
});
