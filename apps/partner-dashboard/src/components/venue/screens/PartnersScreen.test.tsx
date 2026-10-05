import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartnersScreen } from './PartnersScreen';

const mocks = vi.hoisted(() => ({
  canDo: vi.fn(() => true),
  getActiveOrgId: vi.fn((): string | null => null),
  listPartnerships: vi.fn<(...args: never[]) => Promise<unknown>>(),
  resolvePartnership: vi.fn<(...args: never[]) => Promise<unknown>>(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CalendarIcon: Icon,
    CheckIcon: Icon,
    CloseIcon: Icon,
    DeleteIcon: Icon,
    FilterIcon: Icon,
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

vi.mock('@/lib/partner/api-partnerships-repository', () => ({
  listPartnerships: (...args: never[]): Promise<unknown> =>
    mocks.listPartnerships(...args) as Promise<unknown>,
  resolvePartnership: (...args: never[]): Promise<unknown> =>
    mocks.resolvePartnership(...args) as Promise<unknown>,
}));

describe('PartnersScreen', () => {
  beforeEach(() => {
    mocks.getActiveOrgId.mockReturnValue(null);
    mocks.listPartnerships.mockReset().mockResolvedValue([]);
    mocks.resolvePartnership.mockReset().mockResolvedValue({});
  });

  describe('Connected', () => {
    it('traps the profile drawer and restores focus to the View profile trigger on Escape', async () => {
      const user = userEvent.setup();
      render(<PartnersScreen tab="connected" segment="host" />);
      const trigger = screen.getAllByRole('button', { name: 'View profile' })[0]!;
      await user.click(trigger);
      expect(
        screen.getByRole('dialog', { name: /Rhea Kapoor partner details/ }),
      ).toBeInTheDocument();
      await user.keyboard('{Escape}');
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    it('shows host performance stats and expands hosted event history', async () => {
      const user = userEvent.setup();
      render(<PartnersScreen tab="connected" segment="host" />);
      await user.click(screen.getAllByRole('button', { name: 'View profile' })[0]!);

      const dialog = screen.getByRole('dialog', { name: /Rhea Kapoor partner details/ });
      expect(within(dialog).getByRole('heading', { name: 'Performance' })).toBeInTheDocument();
      expect(within(dialog).getByText('Events hosted')).toBeInTheDocument();
      expect(within(dialog).getByText('Average tickets sold')).toBeInTheDocument();
      const history = within(dialog).getByRole('button', { name: /See hosted events/ });
      expect(history).toHaveAttribute('aria-expanded', 'false');

      await user.click(history);
      expect(history).toHaveAttribute('aria-expanded', 'true');
      expect(within(dialog).getByText('Saturday Sessions')).toBeInTheDocument();
    });

    it('keeps quick actions honestly disabled with no fake success', async () => {
      const user = userEvent.setup();
      render(<PartnersScreen tab="connected" segment="host" />);
      await user.click(screen.getAllByRole('button', { name: 'View profile' })[0]!);

      const removeButton = screen.getByRole('button', { name: /Remove connection/ });
      expect(removeButton).toBeDisabled();
      expect(screen.queryByText(/removed successfully/i)).not.toBeInTheDocument();
    });
  });

  describe('Discover', () => {
    it('uses promoter-specific performance labels and keeps Connect honestly disabled', async () => {
      const user = userEvent.setup();
      render(<PartnersScreen tab="discover" segment="promoter" />);
      await user.click(screen.getAllByRole('button', { name: 'View profile' })[0]!);

      expect(screen.getByRole('button', { name: /See promoted events/ })).toBeInTheDocument();
      const connect = screen.getByRole('button', { name: /Connect/ });
      expect(connect).toBeDisabled();
    });

    it('filters results by verified status', async () => {
      const user = userEvent.setup();
      render(<PartnersScreen tab="discover" segment="host" />);
      await user.click(screen.getByRole('button', { name: /Filters/ }));
      await user.click(screen.getByLabelText('Verified status only'));
      expect(screen.queryByText('Kabir Malhotra')).not.toBeInTheDocument();
      expect(screen.getByText('Rhea Kapoor')).toBeInTheDocument();
    });
  });

  describe('Requests', () => {
    it('shows a pending-count badge on the Requests tab', () => {
      render(<PartnersScreen tab="discover" segment="host" />);
      const requestsTab = screen.getByRole('link', { name: /Requests/ });
      expect(within(requestsTab).getByText('2')).toBeInTheDocument();
    });

    it('keeps accept/decline honestly disabled behind a confirm dialog', async () => {
      const user = userEvent.setup();
      render(<PartnersScreen tab="requests" requestView="received" />);
      await user.click(screen.getAllByRole('button', { name: 'Review' })[0]!);
      await user.click(screen.getByRole('button', { name: /Accept/ }));

      expect(screen.getByText(/requires the partnership mutation API/i)).toBeInTheDocument();
      const confirm = screen.getByRole('button', { name: 'Confirm' });
      expect(confirm).toBeDisabled();
    });
  });

  describe('Live partnerships', () => {
    const livePartnership = {
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

    beforeEach(() => {
      mocks.getActiveOrgId.mockReturnValue('org_venue');
    });

    it('counts the pending badge from the API instead of fixtures', async () => {
      mocks.listPartnerships.mockResolvedValue([livePartnership]);
      render(<PartnersScreen tab="discover" segment="host" />);

      const requestsTab = screen.getByRole('link', { name: /Requests/ });
      await waitFor(() => expect(within(requestsTab).getByText('1')).toBeInTheDocument());
    });

    it('enables Confirm and approves a received request through the mutation API', async () => {
      const user = userEvent.setup();
      mocks.listPartnerships.mockResolvedValue([livePartnership]);
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

    it('shows a retry when the requests read fails', async () => {
      const user = userEvent.setup();
      mocks.listPartnerships.mockRejectedValue(new Error('boom'));
      render(<PartnersScreen tab="requests" requestView="received" />);

      await user.click(await screen.findByRole('button', { name: 'Retry' }));
      expect(mocks.listPartnerships).toHaveBeenCalledTimes(2);
    });
  });
});
