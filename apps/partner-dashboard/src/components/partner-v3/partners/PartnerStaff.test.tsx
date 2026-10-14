import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { staffApi } from '@/lib/api/staff-api';

import { VenuePartnersScreen } from './VenuePartnersScreen';

import type { VenuePartnersData } from '@/data/partner-data-source';

vi.mock('@/lib/api/staff-api', () => ({
  staffApi: {
    updateMemberRole: vi.fn(),
  },
}));

const emptySet = { connected: [], discover: [], requests: { incoming: [], outgoing: [] } };

function makeData(overrides: Partial<VenuePartnersData> = {}): VenuePartnersData {
  return {
    dataStatus: 'api',
    hosts: emptySet,
    promoters: emptySet,
    staff: [
      {
        id: 'user-abc123',
        name: 'Staff ABC123',
        initials: 'SA',
        role: 'Manager · venue',
        status: 'Active',
        permissions: [],
        userId: 'user-abc123',
        email: null,
        backendRole: 'manager',
        capabilities: ['venue'],
      },
    ],
    staffInvites: [
      {
        id: 'inv-1',
        email: 'teammate@email.com',
        role: 'member',
        capabilities: ['venue'],
        status: 'pending',
        expiresAt: new Date('2026-02-01T00:00:00.000Z').toISOString(),
      },
    ],
    staffAccess: { canManage: true },
    ...overrides,
  };
}

describe('Partner staff section', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the live roster and pending invites with revoke', () => {
    const onRevokeInvite = vi.fn();
    render(
      <VenuePartnersScreen
        data={makeData()}
        segment="staff"
        staffInvites={makeData().staffInvites ?? []}
        staffCanManage
        onRevokeInvite={onRevokeInvite}
        studioCapability="venue"
      />,
    );

    expect(screen.getByText('Staff ABC123')).toBeInTheDocument();
    expect(screen.getByText('teammate@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add staff' })).toBeInTheDocument();

    const revoke = screen.getByRole('button', { name: 'Revoke' });
    fireEvent.click(revoke);
    expect(onRevokeInvite).toHaveBeenCalledTimes(1);
  });

  it('disables inviting without staff-management access', () => {
    render(
      <VenuePartnersScreen
        data={makeData()}
        segment="staff"
        staffInvites={[]}
        staffCanManage={false}
        studioCapability="venue"
      />,
    );

    expect(screen.getByRole('button', { name: 'Add staff' })).toBeDisabled();
    expect(screen.getByText(/staff-management access/)).toBeInTheDocument();
  });

  it('shows a staff error instead of an empty grid', () => {
    render(
      <VenuePartnersScreen
        data={makeData({ staff: [] })}
        segment="staff"
        staffInvites={[]}
        staffCanManage={false}
        staffError="backend down"
        studioCapability="venue"
      />,
    );

    expect(screen.getByText("Couldn't load staff")).toBeInTheDocument();
  });

  it('displays staff member details accurately including email and joined date', () => {
    render(
      <VenuePartnersScreen
        data={makeData({
          staff: [
            {
              id: 'user-456',
              name: 'Taylor Swift',
              initials: 'TS',
              role: 'Admin · venue',
              status: 'Active',
              permissions: [],
              userId: 'user-456',
              email: 'taylor@c1rcle.test',
              backendRole: 'admin',
              capabilities: ['venue'],
              joinedAt: '2026-01-15T12:00:00.000Z',
            },
          ],
        })}
        segment="staff"
        staffInvites={[]}
        staffCanManage
        studioCapability="venue"
      />,
    );

    expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
    expect(screen.getByText('Admin · venue')).toBeInTheDocument();
    expect(screen.getByText('taylor@c1rcle.test')).toBeInTheDocument();
    expect(screen.getByText(/Jan 15, 2026/)).toBeInTheDocument();
  });

  it('shows "Edit role" button only when isAdmin is true', () => {
    const { rerender } = render(
      <VenuePartnersScreen
        data={makeData()}
        segment="staff"
        staffInvites={[]}
        staffCanManage
        isAdmin={false}
        studioCapability="venue"
      />,
    );

    expect(screen.queryByRole('button', { name: 'Edit role' })).not.toBeInTheDocument();

    rerender(
      <VenuePartnersScreen
        data={makeData()}
        segment="staff"
        staffInvites={[]}
        staffCanManage
        isAdmin={true}
        studioCapability="venue"
      />,
    );

    expect(screen.getByRole('button', { name: 'Edit role' })).toBeInTheDocument();
  });

  it('shows "Owner (Primary)" badge instead of "Edit role" button for owner members', () => {
    render(
      <VenuePartnersScreen
        data={makeData({
          staff: [
            {
              id: 'user-owner',
              name: 'Owner Boss',
              initials: 'OB',
              role: 'Owner · venue',
              status: 'Active',
              permissions: [],
              userId: 'user-owner',
              email: 'boss@c1rcle.test',
              backendRole: 'owner',
              capabilities: ['venue'],
            },
          ],
        })}
        segment="staff"
        staffInvites={[]}
        staffCanManage
        isAdmin={true}
        studioCapability="venue"
      />,
    );

    expect(screen.getByText('Owner (Primary)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit role' })).not.toBeInTheDocument();
  });

  it('opens edit role dialog, changes role, and calls staffApi.updateMemberRole', async () => {
    vi.mocked(staffApi.updateMemberRole).mockResolvedValueOnce({
      userId: 'user-abc123',
      role: 'admin',
      capabilities: ['venue'],
      joinedAt: '2026-01-01T00:00:00.000Z',
    });

    const onStaffChanged = vi.fn();

    render(
      <VenuePartnersScreen
        data={makeData()}
        segment="staff"
        staffInvites={[]}
        staffCanManage
        isAdmin={true}
        organizationId="org-xyz"
        onStaffChanged={onStaffChanged}
        studioCapability="venue"
      />,
    );

    const editRoleBtn = screen.getByRole('button', { name: 'Edit role' });
    fireEvent.click(editRoleBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Edit staff role')).toBeInTheDocument();

    // Select the "Admin" role option
    const adminOptionBtn = screen.getByRole('button', { name: /Admin · Can manage staff/i });
    fireEvent.click(adminOptionBtn);

    const saveBtn = screen.getByRole('button', { name: 'Save role' });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(staffApi.updateMemberRole).toHaveBeenCalledWith('org-xyz', 'user-abc123', {
        role: 'admin',
      });
    });

    await waitFor(() => {
      expect(onStaffChanged).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('renders "You" tag for the currently signed-in user by currentUserId', () => {
    render(
      <VenuePartnersScreen
        data={makeData({
          staff: [
            {
              id: 'user-my-id',
              name: 'My Name',
              initials: 'MN',
              role: 'Admin · venue',
              status: 'Active',
              permissions: [],
              userId: 'user-my-id',
              email: 'me@example.com',
              backendRole: 'admin',
              capabilities: ['venue'],
            },
            {
              id: 'user-other',
              name: 'Other Colleague',
              initials: 'OC',
              role: 'Staff · venue',
              status: 'Active',
              permissions: [],
              userId: 'user-other',
              email: 'other@example.com',
              backendRole: 'member',
              capabilities: ['venue'],
            },
          ],
        })}
        segment="staff"
        staffInvites={[]}
        staffCanManage
        currentUserId="user-my-id"
        studioCapability="venue"
      />,
    );

    const youTags = screen.getAllByText('You');
    expect(youTags).toHaveLength(1);
    expect(screen.getByText('My Name')).toBeInTheDocument();
    expect(screen.getByText('Other Colleague')).toBeInTheDocument();
  });

  it('renders "You" tag matching by currentUserEmail', () => {
    render(
      <VenuePartnersScreen
        data={makeData({
          staff: [
            {
              id: 'user-abc',
              name: 'Taylor Swift',
              initials: 'TS',
              role: 'Manager · venue',
              status: 'Active',
              permissions: [],
              userId: 'user-abc',
              email: 'taylor@example.com',
              backendRole: 'manager',
              capabilities: ['venue'],
            },
          ],
        })}
        segment="staff"
        staffInvites={[]}
        staffCanManage
        currentUserEmail="taylor@example.com"
        studioCapability="venue"
      />,
    );

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('does not render "You" tag when member does not match current user', () => {
    render(
      <VenuePartnersScreen
        data={makeData()}
        segment="staff"
        staffInvites={[]}
        staffCanManage
        currentUserId="completely-different-user"
        currentUserEmail="someone-else@example.com"
        studioCapability="venue"
      />,
    );

    expect(screen.queryByText('You')).not.toBeInTheDocument();
  });
});

