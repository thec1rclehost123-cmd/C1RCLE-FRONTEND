import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';
import {
  blockVenueDate,
  getVenueCalendarSlots,
  unblockVenueDate,
} from '@/lib/api/calendar-api';
import { listOrgEvents } from '@/lib/api/events-api';
import { fetchOwnVenues } from '@/lib/api/partner-discover';
import { getActiveOrgId } from '@/lib/org/active-org';

import { CalendarDayDetails } from './CalendarDayDetails';
import { HostAvailabilityScreen } from './HostAvailabilityScreen';
import { VenueCalendarScreen } from './VenueCalendarScreen';

import type { CalendarBlock, CalendarDay } from '@/data/partner-data-source';
import type { BlockVenueDateInput, VenueSlotDto } from '@/lib/api/calendar-api';
import type { EventDto } from '@/lib/api/events-api';
import type { VenueDto } from '@/lib/api/partner-discover';

const navigationState = vi.hoisted(() => ({ pathname: '/partner/venue/calendar' }));
const push = vi.fn();
const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => navigationState.pathname,
  useRouter: () => ({ push, replace, refresh }),
}));

vi.mock('@/lib/org/active-org', () => ({
  getActiveOrgId: vi.fn(() => 'org-1'),
}));

vi.mock('@/lib/api/partner-discover', () => ({
  fetchOwnVenues: vi.fn(),
}));

vi.mock('@/lib/api/calendar-api', () => ({
  blockVenueDate: vi.fn(),
  unblockVenueDate: vi.fn(),
  getVenueCalendarSlots: vi.fn(),
}));

vi.mock('@/lib/api/events-api', () => ({
  listOrgEvents: vi.fn(),
}));

vi.mock('@c1rcle/icons', () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    CalendarIcon: Icon,
    CalendarPlusIcon: Icon,
    CheckIcon: Icon,
    CloseIcon: Icon,
    EmptyDateIcon: Icon,
    LocationIcon: Icon,
    LockedIcon: Icon,
    MobileAppIcon: Icon,
    NextIcon: Icon,
    PreviousIcon: Icon,
    TimeIcon: Icon,
  };
});

const venue = { id: 'venue-1', name: 'Skyline Rooftop' } as unknown as VenueDto;

function mockLiveCalendar() {
  vi.mocked(getActiveOrgId).mockReset();
  vi.mocked(getActiveOrgId).mockReturnValue('org-1');
  vi.mocked(fetchOwnVenues).mockReset();
  vi.mocked(fetchOwnVenues).mockResolvedValue([venue]);
  vi.mocked(getVenueCalendarSlots).mockReset();
  vi.mocked(getVenueCalendarSlots).mockResolvedValue([]);
  vi.mocked(listOrgEvents).mockReset();
  vi.mocked(listOrgEvents).mockResolvedValue([]);
  vi.mocked(blockVenueDate).mockReset();
  vi.mocked(unblockVenueDate).mockReset();
  vi.mocked(unblockVenueDate).mockResolvedValue({} as VenueSlotDto);
}

describe('Calendar screens', () => {
  beforeEach(() => {
    navigationState.pathname = '/partner/venue/calendar';
    push.mockReset();
    replace.mockReset();
    refresh.mockReset();
    mockLiveCalendar();
  });

  it('renders a live calendar with no dummy content', async () => {
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-20" />);

    expect(screen.getByRole('heading', { name: 'All events this month' })).toBeInTheDocument();
    expect(screen.getByText('JULY 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Block date' })).toBeInTheDocument();

    // Live sources were consulted for the visible month window …
    await waitFor(() => {
      expect(vi.mocked(getVenueCalendarSlots)).toHaveBeenCalledWith(
        'venue-1',
        '2026-07-01T00:00:00.000Z',
        '2026-07-31T23:59:59.999Z',
      );
    });
    expect(vi.mocked(listOrgEvents)).toHaveBeenCalled();

    // … and with an empty backend the calendar is genuinely empty — no
    // fixture names, no demo blocks, just the open-day empty state.
    expect(screen.getByRole('button', { name: '2026-07-20, available' })).toBeInTheDocument();
    expect(screen.getByText('Nothing booked')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unblock date' })).not.toBeInTheDocument();
    expect(screen.queryByText('Neon Nights: Afrobeats Edition')).not.toBeInTheDocument();
    expect(screen.queryByText('Venue maintenance')).not.toBeInTheDocument();
    expect(screen.queryByText('Maintenance')).not.toBeInTheDocument();
  });

  it('renders database-saved blocks with an Unblock action', async () => {
    const user = userEvent.setup();
    vi.mocked(getVenueCalendarSlots).mockResolvedValue([
      {
        id: 'slot-db-1',
        venueId: 'venue-1',
        label: 'Deep cleaning',
        startTime: '2026-07-20T09:00:00.000Z',
        endTime: '2026-07-20T13:00:00.000Z',
        recurring: false,
        status: 'blocked',
        capacityFor: null,
        version: 1,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      } satisfies VenueSlotDto,
    ]);
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-20" />);

    // The DB-saved block marks the grid cell and shows in the right panel
    // exactly like an event, with Unblock attached.
    expect(await screen.findByRole('button', { name: '2026-07-20, blocked' })).toBeInTheDocument();
    expect(screen.getByText('Deep cleaning')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM – 1:00 PM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unblock date' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Unblock date' }));
    expect(vi.mocked(unblockVenueDate)).toHaveBeenCalledWith('venue-1', 'slot-db-1');
    expect(await screen.findByRole('button', { name: '2026-07-20, available' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Unblock date' })).not.toBeInTheDocument();
  });

  it('renders backend events as event cards on their dates', async () => {
    vi.mocked(listOrgEvents).mockResolvedValue([
      {
        id: 'evt-1',
        organizationId: 'org-1',
        venueId: 'venue-1',
        slug: 'neon-nights',
        title: 'Neon Nights',
        summary: '',
        description: '',
        imageUrl: null,
        startAt: '2026-07-16T21:00:00.000Z',
        endAt: '2026-07-17T03:00:00.000Z',
        status: 'published',
        isPublic: true,
        tags: [],
        startingPricePaise: null,
        isFree: false,
        cancellationReason: null,
        version: 1,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      } satisfies EventDto,
    ]);
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-16" />);

    expect(await screen.findByRole('button', { name: '2026-07-16, confirmed' })).toBeInTheDocument();
    expect(screen.getByText('Neon Nights')).toBeInTheDocument();
    expect(screen.getByText('9:00 PM – 3:00 AM')).toBeInTheDocument();
  });

  it('shows several non-overlapping blocks on the same day, each removable', async () => {
    const user = userEvent.setup();
    vi.mocked(getVenueCalendarSlots).mockResolvedValue([
      {
        id: 'slot-morning',
        venueId: 'venue-1',
        label: 'Morning hold',
        startTime: '2026-07-20T09:00:00.000Z',
        endTime: '2026-07-20T13:00:00.000Z',
        recurring: false,
        status: 'blocked',
        capacityFor: null,
        version: 1,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      } satisfies VenueSlotDto,
      {
        id: 'slot-evening',
        venueId: 'venue-1',
        label: 'Evening hold',
        startTime: '2026-07-20T19:00:00.000Z',
        endTime: '2026-07-20T23:00:00.000Z',
        recurring: false,
        status: 'blocked',
        capacityFor: null,
        version: 1,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      } satisfies VenueSlotDto,
    ]);
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-20" />);

    expect(await screen.findByRole('button', { name: '2026-07-20, blocked' })).toBeInTheDocument();
    expect(screen.getByText('Morning hold')).toBeInTheDocument();
    expect(screen.getByText('Evening hold')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Unblock date' })).toHaveLength(2);

    // Removing one block leaves the other — the day stays blocked.
    const unblockButtons = screen.getAllByRole('button', { name: 'Unblock date' });
    const [firstUnblock] = unblockButtons;
    if (!firstUnblock) throw new Error('Expected a morning Unblock button');
    await user.click(firstUnblock);
    expect(vi.mocked(unblockVenueDate)).toHaveBeenCalledWith('venue-1', 'slot-morning');
    expect(await screen.findByRole('button', { name: '2026-07-20, blocked' })).toBeInTheDocument();
    expect(screen.queryByText('Morning hold')).not.toBeInTheDocument();
    expect(screen.getByText('Evening hold')).toBeInTheDocument();
  });

  it('refuses an overlapping block with a clear error and no API call', async () => {
    const user = userEvent.setup();
    vi.mocked(getVenueCalendarSlots).mockResolvedValue([
      {
        id: 'slot-evening',
        venueId: 'venue-1',
        label: 'Evening hold',
        startTime: '2026-07-16T19:00:00.000Z',
        endTime: '2026-07-16T23:00:00.000Z',
        recurring: false,
        status: 'blocked',
        capacityFor: null,
        version: 1,
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      } satisfies VenueSlotDto,
    ]);
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-16" initialDialog />);

    // Dialog defaults (7 PM – 11 PM) sit exactly on the existing block.
    const dialog = await screen.findByRole('dialog', { name: 'Block a date' });
    await user.click(within(dialog).getByRole('button', { name: 'Block date' }));

    expect(await within(dialog).findByText(/overlaps the existing block "Evening hold"/)).toBeInTheDocument();
    expect(vi.mocked(blockVenueDate)).not.toHaveBeenCalled();
  });

  it('creates overnight blocks that span into the next day', async () => {
    const user = userEvent.setup();
    vi.mocked(blockVenueDate).mockImplementation((_venueId: string, input: BlockVenueDateInput) => Promise.resolve({
      id: 'slot-overnight',
      venueId: 'venue-1',
      label: input.label,
      startTime: input.startTime,
      endTime: input.endTime,
      recurring: false,
      status: 'blocked',
      capacityFor: null,
      version: 1,
      createdAt: '2026-07-16T00:00:00.000Z',
      updatedAt: '2026-07-16T00:00:00.000Z',
    } satisfies VenueSlotDto));
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-16" initialDialog />);

    const dialog = await screen.findByRole('dialog', { name: 'Block a date' });
    // Defaults are 7 PM – 11 PM; flagging "Ends next day" rolls the end over.
    await user.click(within(dialog).getByRole('button', { name: 'Ends next day' }));
    expect(within(dialog).getByText(/Runs overnight — ends 2026-07-17/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Block date' }));

    expect(vi.mocked(blockVenueDate)).toHaveBeenCalledWith('venue-1', {
      label: 'Private event',
      startTime: '2026-07-16T19:00:00.000Z',
      endTime: '2026-07-17T23:00:00.000Z',
    });
    // The start day shows the overnight span …
    expect(await screen.findByText('7:00 PM – 11:00 PM (+1 day)')).toBeInTheDocument();
    // … and the next day reads blocked too.
    await user.click(screen.getByRole('button', { name: '2026-07-17, blocked' }));
    expect(screen.getByText('July 16, 2026 → July 17, 2026')).toBeInTheDocument();
  });

  it('blocks a new date through the dialog via the backend', async () => {
    const user = userEvent.setup();
    vi.mocked(blockVenueDate).mockResolvedValue({
      id: 'slot-new-1',
      venueId: 'venue-1',
      label: 'Private event',
      startTime: '2026-07-16T19:00:00.000Z',
      endTime: '2026-07-16T23:00:00.000Z',
      recurring: false,
      status: 'blocked',
      capacityFor: null,
      version: 1,
      createdAt: '2026-07-16T00:00:00.000Z',
      updatedAt: '2026-07-16T00:00:00.000Z',
    } satisfies VenueSlotDto);
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-16" initialDialog />);

    const dialog = screen.getByRole('dialog', { name: 'Block a date' });
    await user.click(within(dialog).getByRole('button', { name: 'Block date' }));

    expect(vi.mocked(blockVenueDate)).toHaveBeenCalledWith('venue-1', {
      label: 'Private event',
      startTime: '2026-07-16T19:00:00.000Z',
      endTime: '2026-07-16T23:00:00.000Z',
    });
    expect(await screen.findByRole('button', { name: '2026-07-16, blocked' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unblock date' })).toBeInTheDocument();
  });

  it('disables the Block submit when no venue is resolved', async () => {
    vi.mocked(fetchOwnVenues).mockResolvedValue([]);
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-16" initialDialog />);

    const dialog = await screen.findByRole('dialog', { name: 'Block a date' });
    expect(within(dialog).getByRole('button', { name: 'Block date' })).toBeDisabled();
    expect(
      within(dialog).getByText('Calendar changes are unavailable until the connected availability service is enabled.'),
    ).toBeInTheDocument();
    expect(vi.mocked(blockVenueDate)).not.toHaveBeenCalled();
  });

  it('asks for an organization when none is active', async () => {
    vi.mocked(getActiveOrgId).mockReturnValue(null);
    render(<VenueCalendarScreen initialMonth="2026-07" initialDate="2026-07-20" />);

    expect(await screen.findByText('Select an organization to load your calendar.')).toBeInTheDocument();
    expect(vi.mocked(getVenueCalendarSlots)).not.toHaveBeenCalled();
    expect(vi.mocked(listOrgEvents)).not.toHaveBeenCalled();
  });

  it('renders Host partnered venue availability without venue ownership controls', async () => {
    navigationState.pathname = '/partner/host/calendar';
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getHostAvailability();
    render(<HostAvailabilityScreen data={data} initialDate="2026-07-18" />);

    expect(screen.getByRole('heading', { name: 'Find an open slot' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Skyline Rooftop/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Block date' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '8:00 PM – 11:00 PM' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '8:00 PM – 11:00 PM' }));
    expect(replace).toHaveBeenLastCalledWith('/partner/host/calendar?venue=skyline-rooftop&month=2026-07&date=2026-07-18&slot=2026-07-18-late', { scroll: false });
  });

  it('shows the block as an event-style card alongside real events', () => {
    const day: CalendarDay = {
      date: '2026-07-16',
      day: 16,
      state: 'blocked',
      events: [
        {
          id: 'neon-nights',
          date: '2026-07-16',
          name: 'Neon Nights: Afrobeats Edition',
          time: '9:00 PM – 3:00 AM',
          status: 'confirmed',
          venue: 'Skyline Rooftop',
        },
      ],
      slots: [],
    };
    const block: CalendarBlock = {
      id: 'block-1',
      date: '2026-07-16',
      reason: 'Deep cleaning',
      from: '09:00',
      to: '13:00',
    };
    render(
      <CalendarDayDetails
        day={day}
        blocks={[block]}
        accent="orange"
        mode="venue"
        onUnblock={() => Promise.resolve()}
      />,
    );

    // The genuine event stays, and the block renders like an event card —
    // badge, reason, time — with the Unblock action attached.
    expect(screen.getByText('Neon Nights: Afrobeats Edition')).toBeInTheDocument();
    expect(screen.getByText('Deep cleaning')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM – 1:00 PM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unblock date' })).toBeEnabled();
  });

  it('renders a disabled Unblock button with a stable hover style when no handler is wired', () => {
    const day: CalendarDay = {
      date: '2026-07-12',
      day: 12,
      state: 'blocked',
      events: [],
      slots: [],
    };
    render(<CalendarDayDetails day={day} accent="orange" mode="venue" />);

    const unblock = screen.getByRole('button', { name: 'Unblock date' });
    expect(unblock).toBeDisabled();
    // Disabled hover must not flash the active red style (see
    // .unblockActionDisabled:hover in calendar.module.css — CSS Modules
    // hashes the class name, so match on the substring).
    expect(unblock.getAttribute('class')).toMatch(/unblockActionDisabled/);
    expect(unblock.getAttribute('class')).not.toMatch(/(^|_)unblockAction_/);
  });
});
