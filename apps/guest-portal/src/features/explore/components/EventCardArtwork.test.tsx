import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { EventCardArtwork } from './EventCardArtwork';

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    unoptimized: _unoptimized,
    ...props
  }: React.ComponentProps<'img'> & { fill?: boolean; unoptimized?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

it('replaces a failed poster with an honest artwork-unavailable state', () => {
  render(
    <EventCardArtwork
      src="/missing.jpg"
      title="Real Night"
      startsAt="2026-11-16T13:30:00Z"
      category="Events"
    />,
  );
  fireEvent.error(screen.getByRole('img', { name: 'Real Night event poster' }));
  expect(screen.queryByRole('img', { name: 'Real Night event poster' })).not.toBeInTheDocument();
  expect(screen.getByText('Event artwork unavailable')).toBeInTheDocument();
});
