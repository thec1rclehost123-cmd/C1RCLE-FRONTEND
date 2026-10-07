import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartnersScreen } from './PartnersScreen';

const mocks = vi.hoisted(() => ({
  canDo: vi.fn(() => true),
  getActiveOrgId: vi.fn((): string | null => 'org_venue'),
  resolveOrg: vi.fn<(...args: never[]) => Promise<string | null>>(),
  listPartnerships: vi.fn<(...args: never[]) => Promise<unknown>>(),
  resolvePartnership: vi.fn<(...args: never[]) => Promise<unknown>>(),
  listPromoterConnections: vi.fn<(...args: never[]) => Promise<unknown>>(),
  resolvePromoterConnection: vi.fn<(...args: never[]) => Promise<unknown>>(),
  discoverPartners: vi.fn<(...args: never[]) => Promise<unknown>>(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CalendarIcon: Icon,
    CheckIcon: Icon,
    CloseIcon: Icon,
    DeleteIcon: Icon,
    LinkIcon: Icon,
    LocationIcon: Icon,
    PendingIcon: Icon,
    PhoneIcon: Icon,
    SearchIcon: Icon,
    SendIcon: Icon,
  };
});

vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    grantedPermissions: [],
    hasPermission: () => true,
    canDo: mocks.canDo,
  }),
}));

vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: () => mocks.getActiveOrgId(),
}));

vi.mock('@/lib/org/resolve-browser-organization', () => ({
  resolveBrowserOrganizationId: (...args: never[]): Promise<unknown> =>
    mocks.resolveOrg(...args) as Promise<unknown>,
}));

vi.mock('@/lib/partner/api-partnerships-repository', () => ({
  listPartnerships: (...args: never[]): Promise<unknown> =>
    mocks.listPartnerships(...args) as Promise<unknown>,
  resolvePartnership: (...args: never[]): Promise<unknown> =>
    mocks.resolvePartnership(...args) as Promise<unknown>,
  discoverPartners: (...args: never[]): Promise<unknown> =>
    mocks.discoverPartners(...args) as Promise<unknown>,
}));

vi.mock('@/lib/partner/promoter-connection-repository', () => ({
  listPromoterConnections: (...args: never[]): Promise<unknown> =>
    mocks.listPromoterConnections(...args) as Promise<unknown>,
  resolvePromoterConnection: (...args: never[]): Promise<unknown> =>
    mocks.resolvePromoterConnection(...args) as Promise<unknown>,
  loadConnectedPromoterConnections: () => Promise.resolve([]),
}));

const partnership = {
  id: 'part_live_1',
  hostOrganizationId: 'org_host_1',
  venueOrganizationId: 'org_venue',
  venueId: 'venue_1',
  initiatedBy: 'host',
  status: 'pending',
  message: 'Would love to bring Saturday Sessions to your rooftop.',
  venueShareRate: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-20T10:00:00.000Z',
  hostName: 'Live Host Collective',
  venueName: null,
};

const promoterConnection = {
  id: 'conn_live_1',
  promoterId: 'org_promoter_1',
  targetId: 'org_venue',
  targetType: 'venue',
  initiatedBy: 'promoter',
  status: 'pending',
  message: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-09-21T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
  promoterName: 'Live Promoter Crew',
  promoterSlug: null,
  targetName: null,
  targetSlug: null,
  targetCity: 'Mumbai',
};

describe('PartnersScreen', () => {
  beforeEach(() => {
    mocks.getActiveOrgId.mockReturnValue('org_venue');
    mocks.resolveOrg.mockReset().mockImplementation((...args: never[]) => {
      const direct = args[1] as unknown as string | null;
      return Promise.resolve(direct);
    });
    mocks.listPartnerships.mockReset().mockResolvedValue([]);
    mocks.resolvePartnership.mockReset().mockResolvedValue({});
    mocks.listPromoterConnections.mockReset().mockResolvedValue([]);
    mocks.resolvePromoterConnection.mockReset().mockResolvedValue({});
    mocks.discoverPartners.mockReset().mockResolvedValue([]);
  });

  describe('Connected', () => {
    it('renders only backend partnerships, never fixture rows', async () => {
      mocks.listPartnerships.mockResolvedValue([
        { ...partnership, status: 'active', hostName: 'Live Host Collective' },
      ]);
      render(<PartnersScreen tab="connected" segment="host" />);

      expect(await screen.findByText('Live Host Collective')).toBeInTheDocument();
      expect(screen.queryByText('Rhea Kapoor')).not.toBeInTheDocument();
    });

    it('shows an empty state when the backend returns no partners', async () => {
      render(<PartnersScreen tab="connected" segment="host" />);

      expect(await screen.findByText(/No connected hosts yet/)).toBeInTheDocument();
    });

    it('asks to sign in instead of showing dummy data', async () => {
      mocks.getActiveOrgId.mockReturnValue(null);
      render(<PartnersScreen tab="connected" segment="host" />);

      expect(await screen.findByText(/Sign in/)).toBeInTheDocument();
      expect(mocks.listPartnerships).not.toHaveBeenCalled();
    });

    it('resolves the venue org from the session when the cookie is missing', async () => {
      mocks.getActiveOrgId.mockReturnValue(null);
      mocks.resolveOrg.mockResolvedValue('org_auto');
      mocks.listPartnerships.mockResolvedValue([
        { ...partnership, status: 'active', hostName: 'Live Host Collective' },
      ]);
      render(<PartnersScreen tab="connected" segment="host" />);

      expect(await screen.findByText('Live Host Collective')).toBeInTheDocument();
      expect(mocks.listPartnerships).toHaveBeenCalledWith('org_auto');
    });

    it('removes a live connection through the mutation API', async () => {
      const user = userEvent.setup();
      mocks.listPartnerships.mockResolvedValue([
        { ...partnership, status: 'active', hostName: 'Live Host Collective' },
      ]);
      render(<PartnersScreen tab="connected" segment="host" />);
      await user.click(await screen.findByRole('button', { name: 'View profile' }));

      const removeButton = screen.getByRole('button', { name: /Remove connection/ });
      expect(removeButton).toBeEnabled();
      await user.click(removeButton);

      await waitFor(() => {
        expect(mocks.resolvePartnership).toHaveBeenCalledWith(
          'org_venue',
          'part_live_1',
          'end',
          undefined,
        );
      });
    });
  });

  describe('Discover', () => {
    const discoveredHost = {
      id: 'org_host_9',
      kind: 'host',
      name: 'Real Host Nine',
      slug: 'real-host-nine',
      city: 'Pune',
      verified: true,
      organizationId: 'org_host_9',
      venueId: null,
    };

    it('renders only discoverable profiles from the backend', async () => {
      mocks.discoverPartners.mockResolvedValue([discoveredHost]);
      render(<PartnersScreen tab="discover" segment="host" />);

      expect(await screen.findByText('Real Host Nine')).toBeInTheDocument();
      expect(screen.queryByText('Rhea Kapoor')).not.toBeInTheDocument();
      expect(screen.queryByText('Kabir Malhotra')).not.toBeInTheDocument();
    });

    it('filters by verified status without fake facets', async () => {
      const user = userEvent.setup();
      mocks.discoverPartners.mockResolvedValue([
        discoveredHost,
        { ...discoveredHost, id: 'org_host_10', name: 'Unverified Host', verified: false },
      ]);
      render(<PartnersScreen tab="discover" segment="host" />);
      await screen.findByText('Real Host Nine');

      await user.click(screen.getByLabelText('Verified status only'));
      expect(screen.queryByText('Unverified Host')).not.toBeInTheDocument();
      expect(screen.getByText('Real Host Nine')).toBeInTheDocument();
    });

    it('shows an empty state when nothing is discoverable', async () => {
      render(<PartnersScreen tab="discover" segment="host" />);

      expect(await screen.findByText(/No hosts to discover yet/)).toBeInTheDocument();
    });
  });

  describe('Requests', () => {
    it('counts the pending badge from both APIs', async () => {
      mocks.listPartnerships.mockResolvedValue([partnership]);
      mocks.listPromoterConnections.mockResolvedValue([promoterConnection]);
      render(<PartnersScreen tab="discover" segment="host" />);

      const requestsTab = screen.getByRole('link', { name: /Requests/ });
      await waitFor(() => expect(within(requestsTab).getByText('2')).toBeInTheDocument());
    });

    it('approves a host request through the partnership mutation API', async () => {
      const user = userEvent.setup();
      mocks.listPartnerships.mockResolvedValue([partnership]);
      render(<PartnersScreen tab="requests" requestView="received" />);

      await user.click(await screen.findByRole('button', { name: 'Review' }));
      await user.click(screen.getByRole('button', { name: /Accept/ }));

      const confirm = screen.getByRole('button', { name: 'Confirm' });
      expect(confirm).toBeEnabled();
      await user.click(confirm);

      await waitFor(() => {
        expect(mocks.resolvePartnership).toHaveBeenCalledWith(
          'org_venue',
          'part_live_1',
          'approve',
          undefined,
        );
      });
    });

    it('approves a promoter request through the promoter-connection mutation API', async () => {
      const user = userEvent.setup();
      mocks.listPromoterConnections.mockResolvedValue([promoterConnection]);
      render(<PartnersScreen tab="requests" requestView="received" />);

      await user.click(await screen.findByRole('button', { name: 'Review' }));
      await user.click(screen.getByRole('button', { name: /Accept/ }));
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => {
        expect(mocks.resolvePromoterConnection).toHaveBeenCalledWith(
          'org_venue',
          'conn_live_1',
          'approve',
          undefined,
        );
      });
    });

    it('shows a retry when the requests read fails', async () => {
      const user = userEvent.setup();
      mocks.listPartnerships.mockRejectedValue(new Error('boom'));
      render(<PartnersScreen tab="requests" requestView="received" />);

      await user.click(await screen.findByRole('button', { name: 'Retry' }));
      expect(mocks.listPartnerships).toHaveBeenCalledTimes(2);
    });
  });
});
