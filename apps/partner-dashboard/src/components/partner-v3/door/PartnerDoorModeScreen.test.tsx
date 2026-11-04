import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerDoorModeScreen } from './PartnerDoorModeScreen';

const navigation = vi.hoisted(() => ({ query: '', role: 'venue' }));
const replace = vi.fn();
const push = vi.fn();

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <span aria-hidden="true" />;
  return {
    BackIcon: Icon,
    CalendarIcon: Icon,
    CheckIcon: Icon,
    DisconnectIcon: Icon,
    IncidentIcon: Icon,
    InviteIcon: Icon,
    NoteIcon: Icon,
    ScanIcon: Icon,
    SearchIcon: Icon,
    TimeIcon: Icon,
    WarningIcon: Icon,
  };
});

vi.mock('next/navigation', () => ({
  usePathname: () => `/partner/${navigation.role}/door`,
  useRouter: () => ({ replace, push }),
  useSearchParams: () => {
    const params = new URLSearchParams(navigation.query);
    return { get: (key: string) => params.get(key), toString: () => params.toString() };
  },
}));

describe('PartnerDoorModeScreen', () => {
  beforeEach(() => {
    navigation.query = '';
    navigation.role = 'venue';
    replace.mockReset();
    push.mockReset();
  });

  it('renders the Venue Door Mode workspace and keeps operational mutations unavailable', async () => {
    const data = await fixturePartnerDataSource.getVenueDoorMode();
    render(<PartnerDoorModeScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'Door Mode' })).toBeInTheDocument();
    expect(screen.getByText('At the door')).toBeInTheDocument();
    expect(screen.getByText('Aisha Menon')).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('button', { name: 'Check in' })
        .every((button) => (button as HTMLButtonElement).disabled),
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'Check in walk-in' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Quick scan' })).not.toBeInTheDocument();
  });

  it('URL-backs guest filters and search while preserving the shared fixture model', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueDoorMode();
    render(<PartnerDoorModeScreen data={data} />);

    await user.click(screen.getByRole('button', { name: 'Walk-ins' }));
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/door?filter=walk-in', {
      scroll: false,
    });
    const search = screen.getByPlaceholderText('Search guest name or ticket');
    fireEvent.change(search, { target: { value: 'Aisha' } });
    expect(replace).toHaveBeenLastCalledWith('/partner/venue/door?search=Aisha', { scroll: false });
  });

  it('uses the Host lavender fixture composition and supports event selection', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getHostDoorMode();
    navigation.role = 'host';
    render(<PartnerDoorModeScreen data={data} />);

    expect(screen.getByText('Neon Nights: Afrobeats · Skyline Rooftop')).toBeInTheDocument();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Active event' }),
      'sunset-sessions-vol-4',
    );
    expect(replace).toHaveBeenCalledWith('/partner/host/door?event=sunset-sessions-vol-4', {
      scroll: false,
    });
  });
});
