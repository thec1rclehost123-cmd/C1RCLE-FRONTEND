import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { venueEventSource } from '../venue-events-model';

import { VenueEventsExplorer } from './VenueEventsExplorer';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    ChevronDownIcon: Icon,
    FilterIcon: Icon,
    GalleryViewIcon: Icon,
    ListViewIcon: Icon,
    NextIcon: Icon,
    PreviousIcon: Icon,
    SearchIcon: Icon,
  };
});

describe('VenueEventsExplorer', () => {
  it('groups tabs and gives draft events a Continue action', async () => {
    const user = userEvent.setup();
    render(<VenueEventsExplorer source={venueEventSource} />);

    expect(screen.getByRole('tab', { name: 'Upcoming 8' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.click(screen.getByRole('tab', { name: 'Drafts 3' }));

    expect(screen.getByRole('link', { name: 'Monsoon Sessions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue' })).toHaveAttribute(
      'href',
      '/venue/events/monsoon-sessions',
    );
  });

  it('searches the current event group', async () => {
    const user = userEvent.setup();
    render(<VenueEventsExplorer source={venueEventSource} />);

    await user.type(screen.getByPlaceholderText('Search events'), 'warehouse');

    expect(screen.getByRole('link', { name: 'Warehouse Rave' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Neon Nights: Afrobeats' })).not.toBeInTheDocument();
  });

  it('keeps status, date, and venue filters inside one compact popover', async () => {
    const user = userEvent.setup();
    render(<VenueEventsExplorer source={venueEventSource} />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    const filters = screen.getByLabelText('Event filters');
    await user.selectOptions(within(filters).getByLabelText('Status'), 'Confirmed');
    await user.selectOptions(within(filters).getByLabelText('Date'), '2025-06');

    expect(screen.getByRole('link', { name: 'Bollywood Brunch' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sunset Sessions Vol. 4' })).not.toBeInTheDocument();
  });
});
