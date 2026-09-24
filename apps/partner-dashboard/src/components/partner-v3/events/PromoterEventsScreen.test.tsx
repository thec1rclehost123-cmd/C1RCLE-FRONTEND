import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PromoterEventsScreen } from './PromoterEventsScreen';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/promoter/events',
  useRouter: () => ({ replace }),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CalendarIcon: Icon,
    ForwardIcon: Icon,
    LinkIcon: Icon,
    LocationIcon: Icon,
    SearchIcon: Icon,
    TimeIcon: Icon,
  };
});

describe('PromoterEventsScreen', () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it('renders Discover as the default view with promoter-only access actions', async () => {
    const data = await fixturePartnerDataSource.getPromoterEvents();
    render(<PromoterEventsScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Discover/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Linked Events/ })).toHaveTextContent('4');
    expect(screen.getByPlaceholderText('Search events, venues, or categories')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Event city' })).toHaveValue('all');
    expect(screen.getByRole('region', { name: 'Discover events' })).toBeInTheDocument();
    expect(screen.getByText('Eclipse Royale')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Pending' })).toBeDisabled();
    expect(
      screen
        .getAllByRole('link', { name: 'Request Promotion Access' })
        .map((link) => link.getAttribute('href')),
    ).toContain('/partner/promoter/events/testing-event');
    expect(screen.getByRole('link', { name: 'Eclipse Royale event' })).toHaveAttribute(
      'href',
      '/partner/promoter/events/eclipse-royale',
    );
    expect(screen.queryByRole('link', { name: /create event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /slot requests/i })).not.toBeInTheDocument();
  });

  it('supports linked-event tabs, search, and city filtering with URL-backed state', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getPromoterEvents();
    render(<PromoterEventsScreen data={data} />);

    await user.click(screen.getByRole('tab', { name: /Linked Events/ }));
    expect(screen.getByRole('region', { name: 'Linked events' })).toBeInTheDocument();
    expect(screen.getByText('Nova Nexus')).toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith('/partner/promoter/events?tab=linked', {
      scroll: false,
    });

    await user.type(screen.getByPlaceholderText('Search events, venues, or categories'), 'Nova');
    expect(screen.getByText('Nova Nexus')).toBeInTheDocument();
    expect(screen.queryByText('Event - 297')).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith('/partner/promoter/events?tab=linked&search=Nova', {
      scroll: false,
    });

    await user.click(screen.getByRole('tab', { name: /Discover/ }));
    await user.clear(screen.getByPlaceholderText('Search events, venues, or categories'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Event city' }), 'Mumbai');
    expect(screen.getByText('Retro Fridays')).toBeInTheDocument();
    expect(screen.queryByText('Eclipse Royale')).not.toBeInTheDocument();
    expect(replace).toHaveBeenLastCalledWith('/partner/promoter/events?city=Mumbai', {
      scroll: false,
    });
  });
});
