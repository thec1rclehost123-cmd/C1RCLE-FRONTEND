import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VenuePartnersScreen } from './VenuePartnersScreen';

import type { VenuePartnersData } from '@/data/partner-data-source';

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
    render(<VenuePartnersScreen data={makeData()} segment="staff" staffInvites={makeData().staffInvites ?? []} staffCanManage onRevokeInvite={onRevokeInvite} studioCapability="venue" />);

    expect(screen.getByText('Staff ABC123')).toBeInTheDocument();
    expect(screen.getByText('teammate@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add staff' })).toBeInTheDocument();

    const revoke = screen.getByRole('button', { name: 'Revoke' });
    fireEvent.click(revoke);
    expect(onRevokeInvite).toHaveBeenCalledTimes(1);
  });

  it('disables inviting without staff-management access', () => {
    render(<VenuePartnersScreen data={makeData()} segment="staff" staffInvites={[]} staffCanManage={false} studioCapability="venue" />);

    expect(screen.getByRole('button', { name: 'Add staff' })).toBeDisabled();
    expect(screen.getByText(/staff-management access/)).toBeInTheDocument();
  });

  it('shows a staff error instead of an empty grid', () => {
    render(<VenuePartnersScreen data={makeData({ staff: [] })} segment="staff" staffInvites={[]} staffCanManage={false} staffError="backend down" studioCapability="venue" />);

    expect(screen.getByText("Couldn't load staff")).toBeInTheDocument();
  });
});
