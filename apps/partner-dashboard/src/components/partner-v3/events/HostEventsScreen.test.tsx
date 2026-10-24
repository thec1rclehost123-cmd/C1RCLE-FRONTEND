import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { HostEventsScreen } from './HostEventsScreen';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/host/events',
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

describe('HostEventsScreen', () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it('keeps Host routing, lavender actions, and the Host HTML toolbar shape', async () => {
    const data = await fixturePartnerDataSource.getHostEvents();
    render(<HostEventsScreen data={data} initialParty="venue" />);

    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /slot requests/i })).toHaveAttribute(
      'href',
      '/partner/host/slot-requests',
    );
    expect(screen.getByRole('link', { name: /create event/i })).toHaveAttribute(
      'href',
      '/partner/host/events/create',
    );
    expect(screen.getByRole('tab', { name: 'Analytics' })).toHaveAttribute(
      'href',
      '/partner/host/analytics',
    );
    expect(screen.getByRole('region', { name: 'Host events gallery' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'List view' })).not.toBeInTheDocument();
    expect(screen.getByText('Neon Nights: Afrobeats')).toBeInTheDocument();
  });

  it('defaults to Host-owned events and keeps that default out of the URL', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getHostEvents();
    const hostEvent = { ...data.events[0]!, id: 'host-owned-event', party: 'hosts' as const };
    render(<HostEventsScreen data={{ ...data, events: [hostEvent, data.events[0]!] }} />);

    expect(screen.getByText(hostEvent.name)).toBeInTheDocument();
    expect(screen.getAllByText(hostEvent.name)).toHaveLength(1);
    await user.type(screen.getByPlaceholderText('Search events'), 'Neon');
    expect(replace).toHaveBeenLastCalledWith('/partner/host/events?search=Neon', {
      scroll: false,
    });
  });

  it('uses Host-specific empty-state language', async () => {
    const data = await fixturePartnerDataSource.getHostEvents();
    render(<HostEventsScreen data={{ ...data, events: [] }} />);

    expect(
      screen.getByText('Events created or assigned to this host organization will appear here.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Events created or assigned to this venue will appear here.'),
    ).toBeNull();
  });

  it('keeps Host filtering URL-backed and supports list view from URL state', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getHostEvents();
    render(<HostEventsScreen data={data} initialParty="venue" initialView="list" />);

    expect(screen.getByRole('region', { name: 'Host events list' })).toBeInTheDocument();
    const search = screen.getByPlaceholderText('Search events');
    await user.type(search, 'Neon');
    await user.click(screen.getByRole('button', { name: /^Live/ }));

    expect(screen.getByText('Neon Nights: Afrobeats')).toBeInTheDocument();
    expect(screen.queryByText('Sunset Sessions Vol. 4')).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith(
      '/partner/host/events?search=Neon&status=live&party=venue&view=list',
      { scroll: false },
    );
  });
});
