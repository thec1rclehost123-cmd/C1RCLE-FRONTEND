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
    expect(screen.getByRole('heading', { name: 'Recent orders' })).toBeInTheDocument();
    expect(screen.getByText('No orders have been recorded yet.')).toBeInTheDocument();
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

  it('limits the My network preview to four entries and links to the full list', async () => {
    const fixture = await fixturePartnerDataSource.getVenueOverview();
    const firstMember = fixture.network[0];
    if (!firstMember) throw new Error('Expected overview network fixture');
    render(
      <OverviewScreen
        data={{
          ...fixture,
          network: [
            ...fixture.network,
            { ...firstMember, id: 'network-preview-fifth', name: 'Fifth network partner' },
            { ...firstMember, id: 'network-preview-sixth', name: 'Sixth network partner' },
          ],
        }}
        links={venueLinks}
      />,
    );

    expect(screen.getByText('Skyline Rooftop')).toBeInTheDocument();
    expect(screen.getByText('Arjun (Pulse)')).toBeInTheDocument();
    expect(screen.getByText('The Docks')).toBeInTheDocument();
    expect(screen.getByText('Maya (Staff)')).toBeInTheDocument();
    expect(screen.queryByText('Fifth network partner')).not.toBeInTheDocument();
    expect(screen.queryByText('Sixth network partner')).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: 'See all' })
        .some((link) => link.getAttribute('href') === venueLinks.partners),
    ).toBe(true);
  });

  it('routes the host guest-list action through the authenticated Host workspace', async () => {
    const data = await fixturePartnerDataSource.getVenueOverview();
    render(<OverviewScreen data={data} links={venueLinks} studio="host" />);

    expect(screen.getByRole('link', { name: /view guest list/i })).toHaveAttribute(
      'href',
      `/partner/host/events/${encodeURIComponent(data.nextEvent.id)}/guests`,
    );
  });

  it('renders authoritative order rows without exposing buyer contact data', async () => {
    const fixture = await fixturePartnerDataSource.getVenueOverview();
    render(
      <OverviewScreen
        data={{
          ...fixture,
          recentOrders: [
            {
              id: 'order-1',
              eventName: 'M3 paid test event',
              ticketCount: 2,
              amountLabel: '₹217.70',
              statusLabel: 'Paid',
              placedAtLabel: '26 Oct 2026, 8:00 pm',
            },
          ],
        }}
        links={venueLinks}
      />,
    );

    expect(screen.getByText('M3 paid test event')).toBeInTheDocument();
    expect(screen.getByText('2 tickets · Paid · 26 Oct 2026, 8:00 pm IST')).toBeInTheDocument();
    expect(screen.getByText('₹217.70')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Guest totals can include platform fees and GST; they are not Partner payable/,
      ),
    ).toBeInTheDocument();
  });

  it('does not present a permission denial as an empty order list', async () => {
    const fixture = await fixturePartnerDataSource.getVenueOverview();
    render(<OverviewScreen data={{ ...fixture, recentOrders: null }} links={venueLinks} />);

    expect(
      screen.getByText('Order details are not available to this workspace role.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No orders have been recorded yet.')).not.toBeInTheDocument();
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
