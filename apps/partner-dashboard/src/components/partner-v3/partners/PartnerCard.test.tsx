import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartnerCard } from './PartnerCard';

import type { PartnerRelationship } from '@/data/partner-data-source';

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  getActiveOrgId: vi.fn((): string | null => 'org_venue'),
  requestPartnership: vi.fn<(...args: never[]) => Promise<unknown>>(),
  requestPromoterConnection: vi.fn<(...args: never[]) => Promise<unknown>>(),
  getMyVenue: vi.fn<(...args: never[]) => Promise<unknown>>(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: () => mocks.getActiveOrgId(),
}));

vi.mock('@/lib/partner/api-partnerships-repository', () => ({
  requestPartnership: (...args: never[]): Promise<unknown> =>
    mocks.requestPartnership(...args) as Promise<unknown>,
}));

vi.mock('@/lib/partner/promoter-connection-repository', () => ({
  requestPromoterConnection: (...args: never[]): Promise<unknown> =>
    mocks.requestPromoterConnection(...args) as Promise<unknown>,
}));

vi.mock('@/lib/venue/venue-repository', () => ({
  getMyVenue: (...args: never[]): Promise<unknown> =>
    mocks.getMyVenue(...args) as Promise<unknown>,
}));

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

describe('PartnerCard Connect', () => {
  beforeEach(() => {
    mocks.refresh.mockReset();
    mocks.getActiveOrgId.mockReset();
    mocks.getActiveOrgId.mockReturnValue('org_venue');
    mocks.requestPartnership.mockReset();
    mocks.requestPromoterConnection.mockReset();
    mocks.getMyVenue.mockReset();
  });

  it('venue studio: invites a discovered host through its own venue', async () => {
    const user = userEvent.setup();
    mocks.getMyVenue.mockResolvedValue({ id: 'venue_1' });
    mocks.requestPartnership.mockResolvedValue({});
    render(<PartnerCard partner={discoverHost} href="#" studio="venue" />);

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(mocks.getMyVenue).toHaveBeenCalledWith('org_venue');
      expect(mocks.requestPartnership).toHaveBeenCalledWith(
        'org_venue',
        expect.objectContaining({
          venueId: 'venue_1',
          initiatedBy: 'venue',
          hostOrganizationId: 'org_host_9',
        }),
      );
    });
    expect(mocks.refresh).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Request sent' })).toBeDisabled();
  });

  it('host studio: requests a discovered venue with the venue id as key', async () => {
    const user = userEvent.setup();
    mocks.requestPartnership.mockResolvedValue({});
    render(
      <PartnerCard
        partner={discoverVenue}
        href="#"
        studio="host"
        organizationId="org_host"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(mocks.getMyVenue).not.toHaveBeenCalled();
      expect(mocks.requestPartnership).toHaveBeenCalledWith(
        'org_host',
        expect.objectContaining({ venueId: 'venue_9', initiatedBy: 'host' }),
      );
    });
  });

  it('venue studio: invites a discovered promoter as the target side', async () => {
    const user = userEvent.setup();
    mocks.requestPromoterConnection.mockResolvedValue({});
    render(<PartnerCard partner={discoverPromoter} href="#" studio="venue" />);

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(mocks.requestPromoterConnection).toHaveBeenCalledWith(
        'org_venue',
        expect.objectContaining({
          counterpartyId: 'org_promoter_9',
          targetType: 'venue',
          initiatedBy: 'target',
        }),
      );
    });
  });

  it('host studio: invites a discovered promoter with targetType host', async () => {
    const user = userEvent.setup();
    mocks.requestPromoterConnection.mockResolvedValue({});
    render(
      <PartnerCard
        partner={discoverPromoter}
        href="#"
        studio="host"
        organizationId="org_host"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(mocks.requestPromoterConnection).toHaveBeenCalledWith(
        'org_host',
        expect.objectContaining({
          counterpartyId: 'org_promoter_9',
          targetType: 'host',
          initiatedBy: 'target',
        }),
      );
    });
  });

  it('hides Connect when the discover row carries no request target', () => {
    render(
      <PartnerCard
        partner={{ ...discoverHost, organizationId: undefined }}
        href="#"
        studio="venue"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument();
  });

  it('shows an error when the venue has no venue to invite from', async () => {
    const user = userEvent.setup();
    mocks.getMyVenue.mockResolvedValue(null);
    render(<PartnerCard partner={discoverHost} href="#" studio="venue" />);

    await user.click(screen.getByRole('button', { name: 'Connect' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(mocks.requestPartnership).not.toHaveBeenCalled();
  });
});
