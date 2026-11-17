import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PartnerDoorSelectionScreen } from './PartnerDoorSelectionScreen';

describe('PartnerDoorSelectionScreen', () => {
  it('explains that Venue Studio has no scanner authorization', () => {
    render(<PartnerDoorSelectionScreen />);

    expect(screen.getByRole('heading', { name: 'Door Mode unavailable' })).toBeVisible();
    expect(screen.getByText(/no scanner authorization for Host events/i)).toBeVisible();
    expect(screen.queryByRole('link', { name: /open door mode/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return to Venue events' })).toHaveAttribute(
      'href',
      '/partner/venue/events',
    );
  });
});
