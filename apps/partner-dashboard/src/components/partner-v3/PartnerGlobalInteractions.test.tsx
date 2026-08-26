import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerGlobalSearch } from './PartnerGlobalSearch';
import { PartnerNotifications } from './PartnerNotifications';

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
}));

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
    const data = await fixturePartnerDataSource.getPartnerShellInteractions('promoter');
    render(<PartnerGlobalSearch data={data.search} />);

    const input = screen.getByRole('combobox', { name: 'Search events, partners, orders' });
    await user.type(input, 'Guest');
    expect(screen.getByRole('option', { name: /Guest Stream/ })).toBeInTheDocument();

    await user.keyboard('{ArrowDown}{Enter}');
    expect(navigation.push).toHaveBeenCalledWith('/partner/promoter/guests');
  });

  it('renders notifications, exposes linked destinations, and closes on Escape', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getPartnerShellInteractions('venue');
    render(<PartnerNotifications data={data.notifications} />);

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /payout of/i })).toHaveAttribute('href', '/partner/venue/finance');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();
  });
});
