import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { EventCrowdBreakdown } from './EventCrowdBreakdown';
import { EventGuestsScreen } from './EventGuestsScreen';
import { EventOperationsScreen } from './EventOperationsScreen';
import { EventPromotersScreen } from './EventPromotersScreen';
import { EventRevenueBreakdown } from './EventRevenueBreakdown';
import { EventSalesComparison } from './EventSalesComparison';
import { EventSalesFunnel } from './EventSalesFunnel';
import { VenueEventDetailScreen } from './VenueEventDetailScreen';
import { VenueEventSalesScreen } from './VenueEventSalesScreen';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AddIcon: Icon,
    CalendarIcon: Icon,
    CheckIcon: Icon,
    DoorModeIcon: Icon,
    EditIcon: Icon,
    ExportIcon: Icon,
    FilterIcon: Icon,
    ForwardIcon: Icon,
    RefundIcon: Icon,
    RefreshIcon: Icon,
    SearchIcon: Icon,
    TicketIcon: Icon,
    TimeIcon: Icon,
    TrendUpIcon: Icon,
    UsersIcon: Icon,
    VisibleIcon: Icon,
  };
});

const config = {
  accent: 'orange' as const,
  detailHref: '/partner/venue/events/neon-nights-afrobeats',
  doorHref: '/partner/venue/door',
  eventsHref: '/partner/venue/events',
};

describe('Venue Event Detail feature', () => {
  it('renders every sales subview within the shared detail shell', async () => {
    const data = await fixturePartnerDataSource.getVenueEventDetail('neon-nights-afrobeats');
    if (!data) throw new Error('Expected the primary Venue event fixture');

    const views = [
      <VenueEventDetailScreen data={data} key="summary" />,
      <VenueEventSalesScreen data={data} key="funnel" view="funnel" />,
      <VenueEventSalesScreen data={data} key="revenue" view="revenue" />,
      <VenueEventSalesScreen data={data} key="crowd" view="crowd" />,
      <VenueEventSalesScreen data={data} key="compare" view="compare" />,
    ];
    const { rerender } = render(views[0]);
    expect(screen.getByRole('heading', { name: 'Sales summary' })).toBeInTheDocument();
    rerender(views[1]);
    expect(screen.getByRole('heading', { name: 'Conversion Funnel' })).toBeInTheDocument();
    rerender(views[2]);
    expect(screen.getByRole('heading', { name: 'Net breakdown' })).toBeInTheDocument();
    rerender(views[3]);
    expect(screen.getByRole('heading', { name: 'Crowd & Demographics' })).toBeInTheDocument();
    rerender(views[4]);
    expect(
      screen.getByRole('heading', { name: 'Compare against past events' }),
    ).toBeInTheDocument();
  });

  it('renders guest, operations, and promoter screens with functional destinations', async () => {
    const data = await fixturePartnerDataSource.getVenueEventDetail('neon-nights-afrobeats');
    if (!data) throw new Error('Expected the primary Venue event fixture');

    const { rerender } = render(
      <EventGuestsScreen
        data={data}
        filter="Checked In"
        config={{ ...config, eventHref: `${config.detailHref}/guests` }}
      />,
    );
    expect(screen.getByText('Aisha Menon')).toBeInTheDocument();
    expect(screen.queryByText('Devansh Iyer')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tag' })).toHaveAttribute(
      'href',
      `${config.detailHref}/guests?filter=checked-in&tag=VIP`,
    );

    rerender(
      <EventOperationsScreen
        data={data}
        config={{ ...config, eventHref: `${config.detailHref}/tonight` }}
      />,
    );
    expect(screen.getByRole('heading', { name: 'How full we are' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Walk-in/ })).toHaveAttribute(
      'href',
      '/partner/venue/door',
    );

    rerender(
      <EventPromotersScreen
        data={data}
        search="Arjun"
        config={{
          ...config,
          eventHref: `${config.detailHref}/promoters`,
          guestsHref: `${config.detailHref}/guests`,
        }}
      />,
    );
    expect(screen.getByText('Arjun (Pulse Collective)')).toBeInTheDocument();
    expect(screen.queryByText('Zoya (Nightowl)')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Guest List & Analytics' })).toHaveAttribute(
      'href',
      `${config.detailHref}/guests`,
    );
  });

  it('keeps the sales fixture values outside JSX', async () => {
    const data = await fixturePartnerDataSource.getVenueEventDetail('neon-nights-afrobeats');
    if (!data) throw new Error('Expected the primary Venue event fixture');
    render(<EventSalesFunnel data={data.sales.funnel} />);
    expect(
      screen.getByText('FUNNEL POPULATES AFTER DISCOVERY & BOOKING ACTIVITY BEGINS'),
    ).toBeInTheDocument();
    render(<EventRevenueBreakdown data={data.sales.revenue} />);
    expect(screen.getByText('₹6,08,400')).toBeInTheDocument();
    render(<EventCrowdBreakdown data={data.sales.crowd} />);
    expect(screen.getByText('Female')).toBeInTheDocument();
    render(<EventSalesComparison rows={data.sales.comparison} />);
    expect(screen.getByText('Neon Nights: Afrobeats (this)')).toBeInTheDocument();
  });
});
