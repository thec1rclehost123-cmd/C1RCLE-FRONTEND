import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerSettingsScreen } from './PartnerSettingsScreen';

const navigation = vi.hoisted(() => ({ query: '', role: 'venue' }));
const replace = vi.fn();

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <span aria-hidden="true" />;
  return {
    AdminIcon: Icon,
    AddIcon: Icon,
    BankIcon: Icon,
    CheckIcon: Icon,
    CloseIcon: Icon,
    DragHandleIcon: Icon,
    EditIcon: Icon,
    ImageIcon: Icon,
    NextIcon: Icon,
    NotificationIcon: Icon,
    UsersIcon: Icon,
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => `/partner/${navigation.role}/settings`,
  useRouter: () => ({ replace }),
  useSearchParams: () => {
    const params = new URLSearchParams(navigation.query);
    return { get: (key: string) => params.get(key), toString: () => params.toString() };
  },
}));

describe('PartnerSettingsScreen', () => {
  beforeEach(() => {
    navigation.query = '';
    navigation.role = 'venue';
    replace.mockReset();
  });

  it('renders the Venue Presence editor and updates its local public preview', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueSettings();
    render(<PartnerSettingsScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByText('How guests see you')).toBeInTheDocument();
    const displayName = screen.getByDisplayValue('Rhea Kapoor Events');
    await user.clear(displayName);
    await user.type(displayName, 'Night Owl Events');
    expect(screen.getByRole('heading', { name: 'Night Owl Events' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save presence' })).toBeDisabled();
  });

  it('keeps settings sections URL-backed and exposes the local Menu switch', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getHostSettings();
    navigation.role = 'host';
    const view = render(<PartnerSettingsScreen data={data} />);

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    expect(replace).toHaveBeenCalledWith('/partner/host/settings?section=menu', { scroll: false });
    navigation.query = 'section=menu';
    view.unmount();
    render(<PartnerSettingsScreen data={data} />);
    expect(screen.getByText('Menu is live')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Toggle menu visibility' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the Account rows as read-only fixture destinations', async () => {
    const data = await fixturePartnerDataSource.getVenueSettings();
    navigation.query = 'section=account';
    render(<PartnerSettingsScreen data={data} />);

    expect(screen.getByText('Business profile')).toBeInTheDocument();
    expect(screen.getByText('Privacy & security')).toBeInTheDocument();
    expect(screen.getAllByRole('button').filter((button) => (button as HTMLButtonElement).disabled).length).toBeGreaterThan(0);
  });
});
