import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { OverviewScreen } from './OverviewScreen';

const venueLinks = {
  createEvent: '/partner/venue/events/create',
  calendar: '/partner/venue/calendar',
  events: '/partner/venue/events',
  finance: '/partner/venue/finance',
  partners: '/partner/venue/partners',
};

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AddIcon: Icon,
    BankIcon: Icon,
    BottleServiceIcon: Icon,
    ExpandIcon: Icon,
    ForwardIcon: Icon,
    RefundIcon: Icon,
    TicketIcon: Icon,
    TrendUpIcon: Icon,
    UsersIcon: Icon,
  };
});

vi.mock('next/image', () => ({
  default: ({ alt }: { readonly alt: string }) => <span role="img" aria-label={alt} />,
}));

describe('OverviewScreen', () => {
  it('renders the HTML-reference hierarchy and truthful fixture routes', async () => {
    const data = await fixturePartnerDataSource.getVenueOverview();
    render(<OverviewScreen data={data} links={venueLinks} />);

    expect(screen.getByRole('heading', { name: 'Good evening, Rhea' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Neon Nights: Afrobeats Edition' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent activity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'July 2026' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Upcoming events' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My network' })).toBeInTheDocument();
    expect(screen.getByText('Fixture data')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view guest list/i })).toHaveAttribute(
      'href',
      '/partner/venue/events/neon-nights-afrobeats/guests',
    );
    expect(screen.getByRole('link', { name: /create event/i })).toHaveAttribute(
      'href',
      '/partner/venue/events/create',
    );
  });

  it('switches the local performance presentation without a mutation', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueOverview();
    render(<OverviewScreen data={data} links={venueLinks} />);

    await user.click(screen.getByRole('button', { name: 'Revenue' }));
    await user.click(screen.getByRole('button', { name: '1D' }));

    expect(screen.getByRole('heading', { name: '₹3,13,000' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /revenue 1D trend/i })).toBeInTheDocument();
  });

  it('keeps Host navigation and partnered-venue availability links role-specific', async () => {
    const data = await fixturePartnerDataSource.getHostOverview();
    render(
      <OverviewScreen
        accent="lavender"
        data={data}
        links={{
          createEvent: '/partner/host/events/create',
          calendar: '/partner/host/calendar',
          events: '/partner/host/events',
          finance: '/partner/host/finance',
          partners: '/partner/host/partners',
        }}
      />,
    );

    expect(screen.getByRole('img', { name: 'Neon Nights event artwork' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create event/i })).toHaveAttribute(
      'href',
      '/partner/host/events/create',
    );
    expect(screen.getByRole('link', { name: /see all events/i })).toHaveAttribute(
      'href',
      '/partner/host/calendar',
    );
    expect(
      screen.getAllByRole('link', { name: /see all$/i }).map((link) => link.getAttribute('href')),
    ).toContain('/partner/host/events');
    expect(screen.getByRole('link', { name: /view all/i })).toHaveAttribute(
      'href',
      '/partner/host/finance',
    );
  });
});
