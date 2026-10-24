import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StudioRoutePlaceholder } from './StudioRoutePlaceholder';

describe('StudioRoutePlaceholder', () => {
  it('shows the route explanation once instead of repeating it in the empty state', () => {
    render(
      <StudioRoutePlaceholder
        studioLabel="Host Studio"
        title="Leaderboard"
        description="Leaderboard data is not available for this workspace."
      />,
    );

    expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Leaderboard unavailable' })).toBeInTheDocument();
    expect(
      screen.getAllByText('Leaderboard data is not available for this workspace.'),
    ).toHaveLength(1);
  });
});
