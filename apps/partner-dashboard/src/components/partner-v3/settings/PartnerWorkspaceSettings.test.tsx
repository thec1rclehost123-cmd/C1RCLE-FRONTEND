import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import { PartnerWorkspaceSettings } from './PartnerWorkspaceSettings';

import type { PartnerSettingsDto, UpdatePartnerSettingsInput } from '@c1rcle/contracts/client';

const mocks = vi.hoisted(() => ({
  auth: { profile: { email: 'owner@example.test', displayName: 'Owner', activeMembership: { partnerId: 'org_1', role: 'owner' } }, signOut: vi.fn() },
  getSettings: vi.fn<() => Promise<PartnerSettingsDto>>(),
  updateSettings: vi.fn<(id: string, update: UpdatePartnerSettingsInput) => Promise<PartnerSettingsDto>>(),
  upload: vi.fn(),
  getVenue: vi.fn(), getVenueProfile: vi.fn(), updateVenueProfile: vi.fn(), getMenu: vi.fn(), updateMenu: vi.fn(),
}));

vi.mock('@/components/providers/DashboardAuthProvider', () => ({ useDashboardAuth: () => mocks.auth }));
vi.mock('@/components/promoter/PromoterAgreementPanel', () => ({ PromoterAgreementPanel: () => <div>Agreement panel</div> }));
vi.mock('@/lib/settings/partner-settings-repository', () => ({
  getPartnerSettings: mocks.getSettings, updatePartnerSettings: mocks.updateSettings, uploadPartnerProfileImage: mocks.upload,
}));
vi.mock('@/lib/venue/venue-repository', () => ({
  getMyVenue: mocks.getVenue, getVenueProfile: mocks.getVenueProfile, updateVenueProfile: mocks.updateVenueProfile,
  getVenueMenu: mocks.getMenu, updateVenueMenu: mocks.updateMenu,
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.ComponentProps<'a'>) => <a href={href} {...props}>{children}</a> }));

const settings: PartnerSettingsDto = {
  organizationId: 'org_1', displayName: 'Workspace', handle: 'workspace',
  profile: { bio: '', photoUrl: null, coverUrl: null, city: '', genres: [], instagram: '', website: '' },
  privacy: { profileVisible: true, showGuestList: false },
  inAppNotifications: { eventUpdates: true, orderUpdates: true, requests: true, partnerships: true, payouts: true },
  memberSince: '2025-01-01T00:00:00.000Z',
  stats: { events: 0, ticketsSold: 0, checkIns: 0, connections: 0 },
};

describe('PartnerWorkspaceSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.profile.activeMembership.role = 'owner';
    mocks.getSettings.mockResolvedValue(settings);
    mocks.updateSettings.mockImplementation((_id, update) => Promise.resolve({
      ...settings,
      displayName: update.displayName ?? settings.displayName,
      handle: update.handle ?? settings.handle,
      profile: { ...settings.profile, ...update.profile },
      inAppNotifications: {
        eventUpdates: update.inAppNotifications?.eventUpdates ?? settings.inAppNotifications.eventUpdates,
        orderUpdates: update.inAppNotifications?.orderUpdates ?? settings.inAppNotifications.orderUpdates,
        requests: update.inAppNotifications?.requests ?? settings.inAppNotifications.requests,
        partnerships: update.inAppNotifications?.partnerships ?? settings.inAppNotifications.partnerships,
        payouts: update.inAppNotifications?.payouts ?? settings.inAppNotifications.payouts,
      },
      privacy: {
        profileVisible: update.privacy?.profileVisible ?? settings.privacy.profileVisible,
        showGuestList: update.privacy?.showGuestList ?? settings.privacy.showGuestList,
      },
    }));
    mocks.getVenue.mockResolvedValue(null);
  });

  it('shows role-specific settings sections and persists an in-app preference', async () => {
    const user = userEvent.setup();
    render(<PartnerWorkspaceSettings studio="venue" />);
    await screen.findByRole('heading', { name: 'Settings' });
    expect(screen.getByRole('button', { name: 'Menu & door' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agreement & handle' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByRole('checkbox', { name: /Event updates/ }));
    await waitFor(() => { expect(mocks.updateSettings).toHaveBeenCalledWith('org_1', { inAppNotifications: { eventUpdates: false } }); });
  });

  it('shows a save failure and leaves the persisted checkbox state intact', async () => {
    const user = userEvent.setup();
    mocks.updateSettings.mockRejectedValue(new Error('Permission denied'));
    render(<PartnerWorkspaceSettings studio="host" />);
    await screen.findByRole('heading', { name: 'Settings' });
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    const checkbox = screen.getByRole('checkbox', { name: /Event updates/ });
    await user.click(checkbox);
    expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied');
    expect(checkbox).toBeChecked();
  });

  it('identifies the failed settings request and displays safe validation details', async () => {
    mocks.getSettings.mockRejectedValue(new ApiClientError({
      code: 'validation',
      message: 'Validation failed',
      status: 422,
      requestId: undefined,
      fieldErrors: { organizationId: ['Invalid opaque id format'] },
    }));

    render(<PartnerWorkspaceSettings studio="venue" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Partner settings: Validation failed (organizationId: Invalid opaque id format)',
    );
    expect(mocks.getVenue).not.toHaveBeenCalled();
  });

  it('keeps Promoter agreement and handle settings separate from other roles', async () => {
    render(<PartnerWorkspaceSettings studio="promoter" />);
    await screen.findByRole('heading', { name: 'Settings' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Agreement & handle' }));
    expect(screen.getByText('Agreement panel')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Public handle' })).toHaveValue('workspace');
  });

  it('disables profile writes for a read-only organization member', async () => {
    mocks.auth.profile.activeMembership.role = 'member';
    render(<PartnerWorkspaceSettings studio="host" />);
    await screen.findByRole('heading', { name: 'Settings' });
    expect(screen.getByRole('textbox', { name: 'Display name' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
  });
});
