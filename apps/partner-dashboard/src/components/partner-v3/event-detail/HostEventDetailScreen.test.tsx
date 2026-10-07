import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { HostEventDetailScreen } from './HostEventDetailScreen';

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

describe('HostEventDetailScreen', () => {
  it('reuses the detail foundation with Host routes and Host artwork', async () => {
    const data = await fixturePartnerDataSource.getHostEventDetail('neon-nights-afrobeats');
    if (!data) throw new Error('Expected the primary Host event fixture');
    render(<HostEventDetailScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Neon Nights: Afrobeats' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All events/ })).toHaveAttribute(
      'href',
      '/partner/host/events',
    );
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/partner/host/events/neon-nights-afrobeats/edit',
    );
    expect(screen.getByRole('link', { name: 'Door Mode' })).toHaveAttribute(
      'href',
      '/partner/host/door',
    );
    expect(screen.getByRole('link', { name: "Who's coming" })).toHaveAttribute(
      'href',
      '/partner/host/events/neon-nights-afrobeats/guests',
    );
    expect(screen.getByRole('link', { name: 'Funnel' })).toHaveAttribute(
      'href',
      '/partner/host/events/neon-nights-afrobeats/sales?view=funnel',
    );
    expect(screen.getByRole('heading', { name: 'Sales summary' })).toBeInTheDocument();
    expect(screen.getByText('340 / 400')).toBeInTheDocument();
    expect(screen.getByText('58.6%')).toBeInTheDocument();
    expect(
      [...document.querySelectorAll('a')].every(
        (link) => !link.getAttribute('href')?.startsWith('/partner/venue/'),
      ),
    ).toBe(true);
  });

  it('returns no detail data for an unknown Host event id', async () => {
    await expect(fixturePartnerDataSource.getHostEventDetail('missing-event')).resolves.toBeNull();
  });
});
