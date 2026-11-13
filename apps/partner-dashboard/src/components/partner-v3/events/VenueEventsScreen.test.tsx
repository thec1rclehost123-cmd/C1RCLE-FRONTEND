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
      '/partner/venue/analytics',
    );
    expect(screen.getByRole('region', { name: 'Venue events gallery' })).toBeInTheDocument();
    expect(screen.getByText('Neon Nights: Afrobeats')).toBeInTheDocument();
  });

  it('opens with the Completed filter selected when requested', async () => {
    const data = await fixturePartnerDataSource.getVenueEvents();
    render(<VenueEventsScreen data={data} initialStatus="Completed" />);

    expect(screen.getByRole('button', { name: /^Completed/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByText(/events shown\..*completed\./)).toBeInTheDocument();
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

  it('keeps venue drafts in Venue view but never exposes Host drafts or a Host Drafts filter', async () => {
    const data = await fixturePartnerDataSource.getVenueEvents();
    const venueDraft = {
      ...data.events[0]!,
      id: 'venue-draft',
      name: 'Venue draft',
      party: 'venue' as const,
      status: 'Draft' as const,
    };
    const hostDraft = {
      ...data.events[0]!,
      id: 'host-draft',
      name: 'Host draft',
      party: 'hosts' as const,
      status: 'Draft' as const,
    };
    const hostLive = {
      ...data.events[0]!,
      id: 'host-live',
      name: 'Host live',
      party: 'hosts' as const,
      status: 'Live' as const,
    };
    render(
      <VenueEventsScreen
        data={{ ...data, events: [venueDraft, hostDraft, hostLive] }}
        initialStatus="Draft"
      />,
    );

    expect(screen.getByText('Venue draft')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Drafts/ })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Hosts' }));

    expect(screen.queryByText('Host draft')).not.toBeInTheDocument();
    expect(screen.getByText('Host live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^All1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Live1/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Drafts/ })).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/events?party=hosts', {
      scroll: false,
    });
  });

  it('normalizes a stale Host Drafts URL to All and excludes Host drafts', async () => {
    const data = await fixturePartnerDataSource.getVenueEvents();
    const hostDraft = {
      ...data.events[0]!,
      id: 'host-draft',
      name: 'Host draft',
      party: 'hosts' as const,
      status: 'Draft' as const,
    };
    const hostLive = {
      ...data.events[0]!,
      id: 'host-live',
      name: 'Host live',
      party: 'hosts' as const,
      status: 'Live' as const,
    };
    render(
      <VenueEventsScreen
        data={{ ...data, events: [hostDraft, hostLive] }}
        initialParty="hosts"
        initialStatus="Draft"
      />,
    );

    expect(screen.getByText('Host live')).toBeInTheDocument();
    expect(screen.queryByText('Host draft')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^All1/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /^Drafts/ })).not.toBeInTheDocument();
  });
});
