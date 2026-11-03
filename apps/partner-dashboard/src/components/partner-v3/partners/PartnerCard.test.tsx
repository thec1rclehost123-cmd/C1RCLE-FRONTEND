import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PartnerCard } from './PartnerCard';
import { PartnerProfilePanel } from './PartnerProfilePanel';

import type { PartnerRelationship } from '@/data/partner-data-source';

const discoverHost: PartnerRelationship = {
  id: 'org_host_9',
  name: 'Discovered Host',
  initials: 'DH',
  kind: 'host',
  role: 'Host',
  location: 'Pune',
  genres: [],
  stats: [],
  upcomingEvents: [],
  verified: false,
  cardTone: 'violet',
  organizationId: 'org_host_9',
};

const discoverVenue: PartnerRelationship = {
  id: 'venue_9',
  name: 'Discovered Venue',
  initials: 'DV',
  kind: 'venue',
  role: 'Venue',
  location: 'Pune',
  genres: [],
  stats: [],
  upcomingEvents: [],
  verified: false,
  cardTone: 'teal',
  organizationId: 'org_venue_9',
  venueId: 'venue_9',
};

const discoverPromoter: PartnerRelationship = {
  id: 'org_promoter_9',
  name: 'Discovered Promoter',
  initials: 'DP',
  kind: 'promoter',
  role: 'Promoter',
  location: 'Mumbai',
  genres: [],
  stats: [],
  upcomingEvents: [],
  verified: false,
  cardTone: 'orange',
  organizationId: 'org_promoter_9',
};

describe('PartnerCard', () => {
  it('calls onConnect for a discovered host', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();

    render(<PartnerProfilePanel partner={discoverHost} closeHref="#" onConnect={onConnect} />);

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(onConnect).toHaveBeenCalledWith(discoverHost);
  });

  it('calls onConnect for a discovered venue', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();

    render(<PartnerProfilePanel partner={discoverVenue} closeHref="#" onConnect={onConnect} />);

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(onConnect).toHaveBeenCalledWith(discoverVenue);
  });

  it('calls onConnect for a discovered promoter', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();

    render(<PartnerProfilePanel partner={discoverPromoter} closeHref="#" onConnect={onConnect} />);

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(onConnect).toHaveBeenCalledWith(discoverPromoter);
  });

  it('shows the connecting state', () => {
    render(
      <PartnerProfilePanel partner={discoverHost} closeHref="#" connecting onConnect={vi.fn()} />,
    );

    expect(screen.getByRole('button', { name: 'Connecting…' })).toBeDisabled();
  });

  it('shows a connection error', () => {
    render(
      <PartnerProfilePanel
        partner={discoverHost}
        closeHref="#"
        connectError="Create a venue before inviting hosts"
        onConnect={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Create a venue before inviting hosts');
  });

  it('hides Connect when the discover row carries no request target', () => {
    render(<PartnerCard partner={{ ...discoverHost, organizationId: undefined }} href="#" />);

    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
  });

  it('renders profile link correctly', () => {
    render(<PartnerCard partner={discoverHost} href="/partner/profile/org_host_9" />);

    const link = screen.getByRole('link', { name: /View profile/ });
    expect(link).toHaveAttribute('href', '/partner/profile/org_host_9');
    expect(link).toHaveTextContent('View profile ↗');
    expect(link).not.toHaveTextContent('\\u2197');
  });

  it('keeps unimplemented partnered actions disabled inside the profile', () => {
    render(
      <PartnerProfilePanel partner={{ ...discoverHost, status: 'Partnered' }} closeHref="#" />,
    );
    expect(screen.getByRole('button', { name: 'Request a date' })).toBeDisabled();
  });
});
