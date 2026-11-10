import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OverviewEventPoster } from './OverviewEventPoster';

vi.mock('next/image', () => ({
  default: ({
    onError,
    alt,
    src,
    unoptimized,
  }: {
    onError: () => void;
    alt: string;
    src: string;
    unoptimized?: boolean;
  }) => <img src={src} alt={alt} onError={onError} data-unoptimized={unoptimized} />,
}));

describe('OverviewEventPoster', () => {
  it('renders artwork with a fallback layer and removes a failed image', () => {
    const { container } = render(
      <OverviewEventPoster
        src="https://storage.googleapis.com/test-bucket/posters/event.webp"
        alt="Event artwork"
        className="poster"
        fallbackClassName="fallback"
        sizes="100vw"
      />,
    );

    expect(screen.getByRole('img', { name: 'Event artwork' })).toHaveAttribute(
      'src',
      'https://storage.googleapis.com/test-bucket/posters/event.webp',
    );
    expect(container.querySelector('.fallback')).toBeInTheDocument();

    fireEvent.error(screen.getByRole('img', { name: 'Event artwork' }));
    expect(screen.queryByRole('img', { name: 'Event artwork' })).not.toBeInTheDocument();
    expect(container.querySelector('.fallback')).toBeInTheDocument();
  });

  it('keeps the existing fallback when no poster exists', () => {
    const { container } = render(
      <OverviewEventPoster className="poster" fallbackClassName="fallback" sizes="100vw" />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('.fallback')).toBeInTheDocument();
  });

  it('serves local fixture posters directly without the remote image optimizer', () => {
    render(
      <OverviewEventPoster
        src="http://localhost:3001/partner-v3/venue/neon-nights-poster.jpg"
        className="poster"
        fallbackClassName="fallback"
        sizes="100vw"
      />,
    );

    expect(screen.getByRole('presentation')).toHaveAttribute('data-unoptimized', 'true');
  });
});
