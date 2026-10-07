import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { VenueEventDetailScreen } from './VenueEventDetailScreen';

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CalendarIcon: Icon,
    DoorModeIcon: Icon,
    EditIcon: Icon,
    ForwardIcon: Icon,
    RefundIcon: Icon,
    TicketIcon: Icon,
    TimeIcon: Icon,
    TrendUpIcon: Icon,
    VisibleIcon: Icon,
  };
});

describe('VenueEventDetailScreen', () => {
  it('renders the Venue HTML detail hierarchy and routes deeper controls', async () => {
    const data = await fixturePartnerDataSource.getVenueEventDetail('neon-nights-afrobeats');
    if (!data) throw new Error('Expected the primary Venue event fixture');
    render(<VenueEventDetailScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Neon Nights: Afrobeats' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All events/ })).toHaveAttribute(
      'href',
      '/partner/venue/events',
    );
    expect(screen.getByText('Skyline Rooftop · Thu, Jul 16 · 9:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText('3,290')).toBeInTheDocument();
    expect(screen.getByText('58.6%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/partner/venue/events/neon-nights-afrobeats/edit',
    );
    expect(screen.getByRole('link', { name: 'Door Mode' })).toHaveAttribute(
      'href',
      '/partner/venue/door',
    );
    expect(screen.getByRole('link', { name: "Who's coming" })).toHaveAttribute(
      'href',
      '/partner/venue/events/neon-nights-afrobeats/guests',
    );
    expect(screen.getByRole('link', { name: 'Tonight' })).toHaveAttribute(
      'href',
      '/partner/venue/events/neon-nights-afrobeats/tonight',
    );
    expect(screen.getByRole('link', { name: 'Promoters' })).toHaveAttribute(
      'href',
      '/partner/venue/events/neon-nights-afrobeats/promoters',
    );
    expect(screen.getByRole('link', { name: 'Funnel' })).toHaveAttribute(
      'href',
      '/partner/venue/events/neon-nights-afrobeats/sales?view=funnel',
    );
    expect(screen.getByRole('link', { name: 'Revenue' })).toHaveAttribute(
      'href',
      '/partner/venue/events/neon-nights-afrobeats/sales?view=revenue',
    );
    expect(screen.getByRole('heading', { name: 'Tickets by tier' })).toBeInTheDocument();
    expect(screen.getByText('VIP Table')).toBeInTheDocument();
  });

  it('returns no detail data for an unknown event id', async () => {
    await expect(fixturePartnerDataSource.getVenueEventDetail('missing-event')).resolves.toBeNull();
  });
});
