import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerGlobalSearch } from './PartnerGlobalSearch';
import { PartnerNotifications } from './PartnerNotifications';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
const api = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

vi.mock('@/lib/api/client', () => ({ apiClient: api }));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AnnouncementIcon: Icon,
    BankIcon: Icon,
    CalendarIcon: Icon,
    CloseIcon: Icon,
    DoorModeIcon: Icon,
    ExternalLinkIcon: Icon,
    GuestIcon: Icon,
    InviteIcon: Icon,
    MegaphoneIcon: Icon,
    NotificationIcon: Icon,
    OrderIcon: Icon,
    PartnerIcon: Icon,
    PendingIcon: Icon,
    SearchIcon: Icon,
    SettingsIcon: Icon,
  };
});

describe('Partner V3 global interactions', () => {
  it('filters role-scoped search results and selects with the keyboard', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({ results: [{ id: 'evt_1', type: 'event', title: 'Neon Guest Stream', subtitle: 'Event' }] });
    render(<PartnerGlobalSearch organizationId="org_1" studio="promoter" />);

    const input = screen.getByRole('combobox', { name: 'Search events and partners' });
    await user.type(input, 'Neon');
    await screen.findByRole('option', { name: /Neon Guest Stream/ });
    expect(api.get).toHaveBeenCalledWith(expect.objectContaining({
      path: '/api/v2/organizations/org_1/search?q=Neon',
      headers: { 'x-organization-id': 'org_1' },
    }));

    await user.keyboard('{ArrowDown}{Enter}');
    expect(navigation.push).toHaveBeenCalledWith('/partner/promoter/events/evt_1');
  });

  it('clears prior-organization results as soon as the active organization changes', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValueOnce({ results: [{ id: 'evt_private', type: 'event', title: 'Private event', subtitle: 'Event' }] });
    api.get.mockResolvedValueOnce({ results: [] });
    const { rerender } = render(<PartnerGlobalSearch organizationId="org_1" studio="venue" />);

    await user.type(screen.getByRole('combobox', { name: 'Search events and partners' }), 'Private');
    await screen.findByRole('option', { name: /Private event/ });

    rerender(<PartnerGlobalSearch organizationId="org_2" studio="venue" />);
    expect(screen.queryByRole('option', { name: /Private event/ })).not.toBeInTheDocument();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.objectContaining({
        path: '/api/v2/organizations/org_2/search?q=Private',
        headers: { 'x-organization-id': 'org_2' },
      }));
    });
  });

  it('renders notifications, exposes linked destinations, and closes on Escape', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getPartnerShellInteractions('venue');
    render(<PartnerNotifications data={data.notifications} />);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /payout of/i })).toHaveAttribute(
      'href',
      '/partner/venue/finance',
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();
  });
});
