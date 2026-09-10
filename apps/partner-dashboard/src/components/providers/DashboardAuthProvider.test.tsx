import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardAuthProvider, useDashboardAuth } from './DashboardAuthProvider';

import type { OnboardingRequestDto, OrganizationDto, PartnerAccessDto } from '@c1rcle/contracts';

interface FakeSession {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { id: string; email: string; displayName: string } | null;
}

const mockUseSession = vi.fn<() => FakeSession>();

vi.mock('next/navigation', () => ({
  usePathname: () => '/venue/overview',
}));

vi.mock('@c1rcle/auth', () => ({
  useSession: () => mockUseSession(),
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  getAccessToken: () => 'tok_abc',
}));

const mockGetOrganizations = vi.fn<() => Promise<OrganizationDto[]>>();
const mockGetPartnerAccess = vi.fn<(organizationId: string) => Promise<PartnerAccessDto>>();
vi.mock('@/lib/org/org-repository', () => ({
  getOrganizations: () => mockGetOrganizations(),
  getPartnerAccess: (organizationId: string) => mockGetPartnerAccess(organizationId),
}));

const mockGetMyOnboardingRequest = vi.fn<() => Promise<OnboardingRequestDto | null>>();
vi.mock('@/lib/onboarding/onboarding-repository', () => ({
  getMyOnboardingRequest: () => mockGetMyOnboardingRequest(),
}));

const mockGetActiveOrgId = vi.fn<() => string | null>();
const mockSetActiveOrg = vi.fn<(orgId: string | null) => Promise<void>>();
vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: () => mockGetActiveOrgId(),
  setActiveOrg: (orgId: string | null) => mockSetActiveOrg(orgId),
}));

interface FakeOrgAccess {
  partnerType: string | null;
  role: string | null;
  permissions: string[];
  tabVisibility: Record<string, boolean> | null;
  isLoading: boolean;
  error: Error | null;
  isSuspended: boolean;
  hasPermission: (permission: string) => boolean;
  tabVisible: (tab: string) => boolean;
}

const mockUseOrgAccess = vi.fn<(orgId: string | null) => FakeOrgAccess>();
vi.mock('@/lib/access/use-org-access', () => ({
  useOrgAccess: (orgId: string | null) => mockUseOrgAccess(orgId),
}));

function Probe() {
  const auth = useDashboardAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="approved">{String(auth.isApproved)}</span>
      <span data-testid="banned">{String(auth.isBanned)}</span>
      <span data-testid="candoAny">{String(auth.canDo('anything'))}</span>
      <span data-testid="memberships">{auth.memberships.length}</span>
    </div>
  );
}

const AUTH_ORG_ACCESS_IDLE = {
  partnerType: null,
  role: null,
  permissions: [],
  tabVisibility: null,
  isLoading: false,
  error: null,
  isSuspended: false,
  hasPermission: () => false,
  tabVisible: () => true,
};

beforeEach(() => {
  mockUseSession.mockReset();
  mockGetOrganizations.mockReset();
  mockGetPartnerAccess.mockReset();
  mockGetMyOnboardingRequest.mockReset();
  mockGetActiveOrgId.mockReset().mockReturnValue(null);
  mockSetActiveOrg.mockReset().mockResolvedValue(undefined);
  mockUseOrgAccess.mockReset().mockReturnValue(AUTH_ORG_ACCESS_IDLE);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DashboardAuthProvider', () => {
  it('shows the loading splash while the session is unknown', () => {
    mockUseSession.mockReturnValue({ isAuthenticated: false, isLoading: true, user: null });

    render(
      <DashboardAuthProvider>
        <Probe />
      </DashboardAuthProvider>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });

  it('renders children with real defaults once anonymous', async () => {
    mockUseSession.mockReturnValue({ isAuthenticated: false, isLoading: false, user: null });

    render(
      <DashboardAuthProvider>
        <Probe />
      </DashboardAuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('approved')).toHaveTextContent('false');
    // No isBanned backend concept exists in V2 yet — always false, documented in the provider.
    expect(screen.getByTestId('banned')).toHaveTextContent('false');
    // No per-action staff permission map exists server-side yet — canDo is
    // always unrestricted (documented in the provider's file-level comment).
    expect(screen.getByTestId('candoAny')).toHaveTextContent('true');
    expect(screen.getByTestId('memberships')).toHaveTextContent('0');
  });

  it('fetches organizations and onboarding status once authenticated, and auto-selects a lone org', async () => {
    mockUseSession.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 'usr_1', email: 'a@b.com', displayName: 'A' },
    });
    mockGetOrganizations.mockResolvedValue([
      {
        id: 'org_1',
        name: 'Only Org',
        slug: 'only-org',
        role: 'owner',
        status: 'active',
        version: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    mockGetPartnerAccess.mockResolvedValue({
      organizationId: 'org_1',
      userId: 'usr_1',
      partnerType: 'venue',
      role: 'owner',
      permissions: ['VIEW_ANALYTICS'],
      tabVisibility: null,
    });
    mockGetMyOnboardingRequest.mockResolvedValue({
      id: 'req_1',
      userId: 'usr_1',
      status: 'approved',
      requestedType: 'venue',
      plan: 'basic',
      profile: {
        legalName: 'Only Org',
        contactPerson: 'A',
        phone: '+919876543210',
        city: 'Mumbai',
      },
      documents: [],
      missingDocuments: [],
      submittedAt: '2026-01-01T00:00:00.000Z',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      provisionedOrganizationId: 'org_1',
      version: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    render(
      <DashboardAuthProvider>
        <Probe />
      </DashboardAuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('memberships')).toHaveTextContent('1');
    expect(screen.getByTestId('approved')).toHaveTextContent('true');
    expect(mockSetActiveOrg).toHaveBeenCalledWith('org_1');
  });
});
