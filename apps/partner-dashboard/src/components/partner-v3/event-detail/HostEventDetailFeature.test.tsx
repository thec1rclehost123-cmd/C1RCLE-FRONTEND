import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { EventGuestsScreen } from './EventGuestsScreen';
import { EventOperationsScreen } from './EventOperationsScreen';
import { EventPromotersScreen } from './EventPromotersScreen';
import { HostEventSalesScreen } from './HostEventSalesScreen';

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
  accent: 'lavender' as const,
  detailHref: '/partner/host/events/neon-nights-afrobeats',
  doorHref: '/partner/host/door',
  eventsHref: '/partner/host/events',
};

describe('Host Event Detail feature', () => {
  it('renders every Sales view with Host composition and lavender routes', async () => {
    const data = await fixturePartnerDataSource.getHostEventDetail('neon-nights-afrobeats');
    if (!data) throw new Error('Expected the primary Host event fixture');

    const { rerender } = render(<HostEventSalesScreen data={data} view="summary" />);
    expect(screen.getByRole('heading', { name: 'Sales summary' })).toBeInTheDocument();
    rerender(<HostEventSalesScreen data={data} view="funnel" />);
    expect(screen.getByRole('heading', { name: 'Conversion Funnel' })).toBeInTheDocument();
    rerender(<HostEventSalesScreen data={data} view="revenue" />);
    expect(screen.getByRole('heading', { name: 'Net breakdown' })).toBeInTheDocument();
    rerender(<HostEventSalesScreen data={data} view="crowd" />);
    expect(screen.getByRole('heading', { name: 'Crowd & Demographics' })).toBeInTheDocument();
    rerender(<HostEventSalesScreen data={data} view="compare" />);
    expect(screen.getByRole('heading', { name: 'Compare against past events' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tonight' })).toHaveAttribute('href', `${config.detailHref}/tonight`);
  });

  it('keeps Host Guests, Tonight, and Promoters links inside the Host workspace', async () => {
    const data = await fixturePartnerDataSource.getHostEventDetail('neon-nights-afrobeats');
    if (!data) throw new Error('Expected the primary Host event fixture');

    const { rerender } = render(<EventGuestsScreen data={data} filter="Checked In" config={{ ...config, eventHref: `${config.detailHref}/guests` }} />);
    expect(screen.getByText('Aisha Menon')).toBeInTheDocument();
    expect(screen.queryByText('Devansh Iyer')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All events/ })).toHaveAttribute('href', config.eventsHref);

    rerender(<EventOperationsScreen data={data} config={{ ...config, eventHref: `${config.detailHref}/tonight` }} />);
    expect(screen.getByRole('link', { name: /Walk-in/ })).toHaveAttribute('href', config.doorHref);

    rerender(<EventPromotersScreen data={data} search="Arjun" config={{ ...config, eventHref: `${config.detailHref}/promoters`, guestsHref: `${config.detailHref}/guests` }} />);
    expect(screen.getByText('Arjun (Pulse Collective)')).toBeInTheDocument();
    expect(screen.queryByText('Zoya (Nightowl)')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Guest List & Analytics' })).toHaveAttribute('href', `${config.detailHref}/guests`);
  });
});
