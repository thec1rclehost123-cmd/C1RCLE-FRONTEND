import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import { AcceptInvitationClient } from './AcceptInvitationClient';

const mocks = vi.hoisted(() => ({
  status: 'authenticated',
  hydrated: true,
  mustChangePassword: false,
  acceptInvitation: vi.fn(),
  listMyInvitations: vi.fn(),
  setActiveOrg: vi.fn(),
  replace: vi.fn(),
  resolveLandingPath: vi.fn(),
}));

vi.mock('@c1rcle/auth', () => ({
  useSessionStore: () => ({
    status: mocks.status,
    hydrated: mocks.hydrated,
    session:
      mocks.status === 'authenticated'
        ? {
            user: {
              id: 'u1',
              email: 'staff@example.com',
              displayName: 'Staff',
              role: 'partner',
              avatarUrl: null,
              mustChangePassword: mocks.mustChangePassword,
            },
          }
        : null,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@/lib/api/staff-api', () => ({
  staffApi: {
    acceptInvitation: mocks.acceptInvitation,
    listMyInvitations: mocks.listMyInvitations,
  },
}));

vi.mock('@/lib/org/route-after-auth', () => ({
  resolveLandingPath: mocks.resolveLandingPath,
}));

vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: () => null,
  setActiveOrg: mocks.setActiveOrg,
}));

const organization = {
  id: 'org-1',
  name: 'Skyline',
  slug: 'skyline',
  role: 'member',
  status: 'active',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderClient(emailHint: string | null = null) {
  render(<AcceptInvitationClient invitationId="inv-1" emailHint={emailHint} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.status = 'authenticated';
  mocks.hydrated = true;
  mocks.mustChangePassword = false;
  mocks.resolveLandingPath.mockResolvedValue('/partner/venue/overview');
});

describe('AcceptInvitationClient', () => {
  it('asks anonymous users to sign in with the email prefilled', () => {
    mocks.status = 'anonymous';
    renderClient('staff@example.com');

    expect(screen.getByText("You've been invited to join a team")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in to accept' })).toHaveAttribute(
      'href',
      '/login?next=%2Finvitations%2Finv-1%2Faccept&email=staff%40example.com',
    );
    expect(mocks.acceptInvitation).not.toHaveBeenCalled();
  });

  it('accepts automatically once signed in and hands over to the studio', async () => {
    mocks.acceptInvitation.mockResolvedValue(organization);
    mocks.setActiveOrg.mockResolvedValue(undefined);
    renderClient();

    // No click needed — arriving with the invite link WAS the confirmation.
    await waitFor(() => {
      expect(mocks.acceptInvitation).toHaveBeenCalledWith('inv-1');
    });
    await waitFor(() => {
      expect(mocks.setActiveOrg).toHaveBeenCalledWith('org-1');
    });
    await waitFor(() => {
      expect(mocks.resolveLandingPath).toHaveBeenCalledWith('org-1');
    });
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/venue/overview');
    });
    expect(await screen.findByText(/taking you to your dashboard/i)).toBeInTheDocument();
  });

  it('routes already-members straight to the studio without an error', async () => {
    mocks.acceptInvitation.mockRejectedValue(
      new Error('User is already a member of this organization'),
    );
    mocks.listMyInvitations.mockResolvedValue({
      items: [
        {
          id: 'inv-1',
          organizationId: 'org-1',
          email: 'staff@example.com',
          role: 'member',
          capabilities: ['venue'],
          status: 'pending',
          invitedBy: 'user_owner',
          expiresAt: new Date('2026-10-12T00:00:00.000Z').toISOString(),
          acceptedAt: null,
          version: 1,
          createdAt: new Date('2026-09-28T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2026-09-28T00:00:00.000Z').toISOString(),
        },
      ],
      pageInfo: { page: 1, pageSize: 50, total: 1, hasNextPage: false },
    });
    renderClient();

    await waitFor(() => {
      expect(mocks.setActiveOrg).toHaveBeenCalledWith('org-1');
    });
    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/venue/overview');
    });
    expect(await screen.findByText(/taking you to your dashboard/i)).toBeInTheDocument();
  });

  it('waits for the first-login rotation instead of accepting on a temp password', () => {
    mocks.mustChangePassword = true;
    renderClient();

    expect(screen.getByText('Accepting your invite…')).toBeInTheDocument();
    expect(mocks.acceptInvitation).not.toHaveBeenCalled();
  });

  it('shows expired invites as terminal with no retry loop', async () => {
    mocks.acceptInvitation.mockRejectedValue(
      new ApiClientError({
        code: 'validation',
        message: 'This invitation has expired',
        status: 400,
        requestId: undefined,
        fieldErrors: undefined,
      }),
    );
    renderClient();

    expect(await screen.findByText('This invite is no longer valid')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open dashboard' })).toBeInTheDocument();
  });

  it('retries network failures', async () => {
    mocks.acceptInvitation.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    mocks.acceptInvitation.mockResolvedValueOnce(organization);
    mocks.setActiveOrg.mockResolvedValue(undefined);
    renderClient();

    expect(await screen.findByText("Couldn't accept this invite")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith('/partner/venue/overview');
    });
  });
});
