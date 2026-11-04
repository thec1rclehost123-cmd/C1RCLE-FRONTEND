import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProfileEventCollection } from './ProfileEventCollection';

import type { ProfileEventSummary } from '../types/profile.types';

const events: ProfileEventSummary[] = Array.from({ length: 11 }, (_, index) => ({
  id: `event-${String(index + 1)}`,
  slug: `event-${String(index + 1)}`,
  title: `Event ${String(index + 1)}`,
  image: '/c1rcle-logo.webp',
  startsAt: '2026-11-01T18:00:00.000Z',
  venue: 'The Venue',
  city: 'Pune',
  participationLabel: 'Confirmed',
}));

describe('ProfileEventCollection', () => {
  it('paginates events and disables controls at the ends', () => {
    render(<ProfileEventCollection events={events} label="Upcoming events" />);

    expect(screen.getByRole('link', { name: 'View Event 1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Event 10' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View Event 11' })).not.toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous upcoming events page' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next upcoming events page' }));

    expect(screen.queryByRole('link', { name: 'View Event 1' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Event 11' })).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next upcoming events page' })).toBeDisabled();
  });
});
