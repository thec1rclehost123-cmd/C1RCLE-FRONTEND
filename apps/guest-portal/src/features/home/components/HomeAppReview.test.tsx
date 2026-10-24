import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HomeAppReview } from './HomeAppReview';

vi.mock('./HomePartyVideoClient', () => ({ HomePartyVideoClient: () => null }));

describe('HomeAppReview', () => {
  it('does not present unpublished mobile store listings as working download links', () => {
    render(<HomeAppReview />);

    expect(
      screen.getByText('Discover events, book your entry, and keep your tickets together.'),
    ).toBeInTheDocument();
    expect(screen.getByText('APP STORE')).toBeInTheDocument();
    expect(screen.getByText('GOOGLE PLAY')).toBeInTheDocument();
    expect(screen.getAllByText('Coming soon')).toHaveLength(2);
    expect(screen.queryByRole('link', { name: /app store|google play/i })).not.toBeInTheDocument();
  });
});
