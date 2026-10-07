import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { VenueEventsScreen } from './VenueEventsScreen';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/venue/events',
  useRouter: () => ({ replace }),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AddIcon: Icon,
    CalendarIcon: Icon,
    GalleryViewIcon: Icon,
    ListViewIcon: Icon,
    SearchIcon: Icon,
    ForwardIcon: Icon,
  };
});

describe('VenueEventsScreen', () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it('renders the Venue HTML Events structure with gallery cards by default', async () => {
    const data = await fixturePartnerDataSource.getVenueEvents();
    render(<VenueEventsScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /slot requests/i })).toHaveAttribute(
      'href',
      '/partner/venue/slot-requests',
    );
    expect(screen.getByRole('link', { name: /create event/i })).toHaveAttribute(
      'href',
      '/partner/venue/events/create',
    );
    expect(screen.getByRole('tab', { name: 'Analytics' })).toHaveAttribute(
      'href',
      '/partner/venue/events/analytics',
    );
    expect(screen.getByRole('region', { name: 'Venue events gallery' })).toBeInTheDocument();
    expect(screen.getByText('Neon Nights: Afrobeats')).toBeInTheDocument();
  });

  it('filters by search and switches between status and list view locally', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueEvents();
    render(<VenueEventsScreen data={data} />);

    const search = screen.getByPlaceholderText('Search events');
    await user.clear(search);
    await user.type(search, 'Neon');
    expect(screen.getByText('Neon Nights: Afrobeats')).toBeInTheDocument();
    expect(screen.queryByText('Sunset Sessions Vol. 4')).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith('/partner/venue/events?search=Neon', { scroll: false });

    await user.click(screen.getByRole('button', { name: /^Live/ }));
    await user.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.getByRole('region', { name: 'Venue events list' })).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith(
      '/partner/venue/events?search=Neon&status=live&view=list',
      { scroll: false },
    );
  });
});
