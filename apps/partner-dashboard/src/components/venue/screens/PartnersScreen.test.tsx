import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearCache } from '../venue-partners-api';

import { PartnersScreen } from './PartnersScreen';

const mocks = vi.hoisted(() => ({
  canDo: vi.fn(() => true),
  partnershipList: vi.fn(),
  promoterConnectionList: vi.fn(),
  partnershipApprove: vi.fn(),
  partnershipReject: vi.fn(),
  partnershipEnd: vi.fn(),
  promoterApprove: vi.fn(),
  promoterReject: vi.fn(),
  promoterRevoke: vi.fn(),
  getActiveOrgId: vi.fn((): string | null => 'org_test'),
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

vi.mock('@/lib/api/partner-connections', () => ({
  partnershipApi: {
    list: mocks.partnershipList,
    request: vi.fn(),
    approve: mocks.partnershipApprove,
    reject: mocks.partnershipReject,
    block: vi.fn(),
    end: mocks.partnershipEnd,
  },
  promoterConnectionApi: {
    list: mocks.promoterConnectionList,
    request: vi.fn(),
    approve: mocks.promoterApprove,
    reject: mocks.promoterReject,
    block: vi.fn(),
    revoke: mocks.promoterRevoke,
  },
}));

vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: mocks.getActiveOrgId,
}));

vi.mock('@/lib/api/partner-discover', () => ({
  fetchDiscoverPartners: vi.fn(() => Promise.resolve([])),
  fetchOwnVenues: vi.fn(() => Promise.resolve([{ id: 'venue-1', status: 'active' }])),
}));

const partnershipDto = (overrides: Record<string, unknown>) => ({
  id: 'partnership-1',
  hostOrganizationId: 'xxHOST01',
  venueOrganizationId: 'org_test',
  venueId: 'venue-1',
  initiatedBy: 'host',
  status: 'active',
  message: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-08-01T10:00:00.000Z',
  updatedAt: '2026-08-02T10:00:00.000Z',
  ...overrides,
});

const connectionDto = (overrides: Record<string, unknown>) => ({
  id: 'connection-1',
  promoterId: 'xxPROM01',
  targetId: 'org_test',
  targetType: 'venue',
  initiatedBy: 'promoter',
  status: 'active',
  message: null,
  resolutionReason: null,
  resolvedAt: null,
  version: 1,
  createdAt: '2026-08-03T10:00:00.000Z',
  updatedAt: '2026-08-04T10:00:00.000Z',
  ...overrides,
});

function mockPopulatedBackend() {
  mocks.partnershipList.mockResolvedValue({
    items: [
      partnershipDto({ id: 'partnership-active' }),
      partnershipDto({
        id: 'partnership-pending-in',
        status: 'pending',
        initiatedBy: 'host',
        message: 'Would love a July slot.',
      }),
      partnershipDto({
        id: 'partnership-pending-out',
        status: 'pending',
        initiatedBy: 'venue',
        message: 'Inviting you to our August series.',
      }),
    ],
  });
  mocks.promoterConnectionList.mockResolvedValue({
    items: [
      connectionDto({ id: 'connection-active' }),
      connectionDto({
        id: 'connection-pending-in',
        status: 'pending',
        initiatedBy: 'promoter',
        message: 'Happy to share reach numbers.',
      }),
    ],
  });
  mocks.partnershipApprove.mockResolvedValue(partnershipDto({ id: 'partnership-pending-in', status: 'active' }));
}

beforeEach(() => {
  clearCache();
  vi.clearAllMocks();
  mocks.getActiveOrgId.mockReturnValue('org_test');
  mockPopulatedBackend();
});

describe('PartnersScreen (backend-only)', () => {
  it('shows a loading state before backend data resolves', () => {
    render(<PartnersScreen tab="connected" segment="host" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading partners…');
  });

  it('renders connected hosts from the backend and opens the profile drawer', async () => {
    const user = userEvent.setup();
    render(<PartnersScreen tab="connected" segment="host" />);

    // Backend-derived label (host org id suffix), never a fabricated profile.
    const row = await screen.findByText('Host HOST01');
    expect(row).toBeInTheDocument();
    expect(screen.queryByText('Rhea Kapoor')).not.toBeInTheDocument();
    expect(screen.queryByText('Kabir Malhotra')).not.toBeInTheDocument();

    const trigger = screen.getAllByRole('button', { name: 'View profile' })[0]!;
    await user.click(trigger);
    expect(
      screen.getByRole('dialog', { name: /Host HOST01 partner details/ }),
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('renders connected promoters from the backend', async () => {
    render(<PartnersScreen tab="connected" segment="promoter" />);
    expect(await screen.findByText('Promoter PROM01')).toBeInTheDocument();
    expect(screen.queryByText('Karan Shah')).not.toBeInTheDocument();
  });

  it('shows an empty state when the backend has no connected hosts', async () => {
    mocks.partnershipList.mockResolvedValue({ items: [] });
    mocks.promoterConnectionList.mockResolvedValue({ items: [] });
    render(<PartnersScreen tab="connected" segment="host" />);

    expect(await screen.findByText('No connected hosts yet.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View profile' })).not.toBeInTheDocument();
  });

  it('renders discover from the real backend browse endpoint (never dummy profiles)', async () => {
    render(<PartnersScreen tab="discover" segment="host" />);
    expect(await screen.findByText('No hosts match these filters.')).toBeInTheDocument();
    expect(screen.queryByText('Rhea Kapoor')).not.toBeInTheDocument();
  });

  it('derives requests from non-active backend rows with a pending badge', async () => {
    render(<PartnersScreen tab="discover" segment="host" />);
    const requestsTab = await screen.findByRole('link', { name: /Requests/ });
    // One pending received partnership + one pending received promoter connection.
    expect(within(requestsTab).getByText('2')).toBeInTheDocument();
  });

  it('reviews a backend request and approves it through the partnership API', async () => {
    const user = userEvent.setup();
    render(<PartnersScreen tab="requests" requestView="received" />);

    const reviews = await screen.findAllByRole('button', { name: 'Review' });
    expect(reviews).toHaveLength(2);
    expect(screen.getByText('Would love a July slot.')).toBeInTheDocument();

    await user.click(reviews[0]!);
    await user.click(screen.getByRole('button', { name: /Accept/ }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(mocks.partnershipApprove).toHaveBeenCalledWith('partnership-pending-in');
    });
  });

  it('shows sent requests derived from backend rows initiated by the venue', async () => {
    render(<PartnersScreen tab="requests" requestView="sent" />);
    expect(await screen.findByText('Inviting you to our August series.')).toBeInTheDocument();
  });
});
