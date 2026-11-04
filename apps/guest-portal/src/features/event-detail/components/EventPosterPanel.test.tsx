import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';

import { EventPosterPanel } from './EventPosterPanel';

import type { EventDetailFixture } from '../types/event-detail.types';

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    unoptimized: _unoptimized,
    preload: _preload,
    ...props
  }: React.ComponentProps<'img'> & {
    fill?: boolean;
    unoptimized?: boolean;
    preload?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...props} />
  ),
}));

const event: EventDetailFixture = {
  id: 'event_test',
  slug: 'real-night',
  title: 'Real Night',
  category: 'Events',
  image: '/missing.jpg',
  accentTone: 'orange',
  startsAt: '2026-11-16T13:30:00Z',
  endsAt: '2026-11-16T17:30:00Z',
  venue: 'Test venue',
  address: '',
  city: 'Pune',
  hostId: null,
  host: 'Host',
  venueId: null,
  summary: '',
  description: [],
  doorNote: '',
  lifecycle: 'scheduled',
  guests: [],
  interestedCount: 0,
  ticketTiers: [],
};

it('removes a broken event-detail poster and renders the existing fallback', () => {
  render(<EventPosterPanel event={event} />);
  fireEvent.error(screen.getByRole('img', { name: 'Real Night event poster' }));
  expect(screen.queryByRole('img', { name: 'Real Night event poster' })).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Event poster' })).toBeInTheDocument();
});
