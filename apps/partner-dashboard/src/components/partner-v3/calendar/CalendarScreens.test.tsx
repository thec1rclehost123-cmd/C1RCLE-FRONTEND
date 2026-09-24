import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { HostAvailabilityScreen } from './HostAvailabilityScreen';
import { VenueCalendarScreen } from './VenueCalendarScreen';

const navigationState = vi.hoisted(() => ({ pathname: '/partner/venue/calendar' }));
const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => navigationState.pathname,
  useRouter: () => ({ push, replace }),
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

describe('Calendar screens', () => {
  beforeEach(() => {
    navigationState.pathname = '/partner/venue/calendar';
    push.mockReset();
    replace.mockReset();
  });

  it('renders the Venue booking calendar and keeps Block Date Venue-only', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueCalendar();
    render(<VenueCalendarScreen data={data} />);

    expect(screen.getByRole('heading', { name: 'All events this month' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Block date' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2026-07-12, blocked' })).toBeInTheDocument();
    expect(screen.getByText('Neon Nights: Afrobeats Edition')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2026-07-12, blocked' }));
    expect(replace).toHaveBeenLastCalledWith(
      '/partner/venue/calendar?month=2026-07&date=2026-07-12',
      { scroll: false },
    );
    await user.click(screen.getByRole('button', { name: 'Block date' }));
    expect(replace).toHaveBeenLastCalledWith(
      '/partner/venue/calendar?month=2026-07&date=2026-07-16&dialog=block',
      { scroll: false },
    );
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
    expect(replace).toHaveBeenLastCalledWith(
      '/partner/host/calendar?venue=skyline-rooftop&month=2026-07&date=2026-07-18&slot=2026-07-18-late',
      { scroll: false },
    );
  });

  it('opens Venue Block Date through URL state without saving a fake mutation', async () => {
    const data = await fixturePartnerDataSource.getVenueCalendar();
    render(<VenueCalendarScreen data={data} initialDialog />);

    expect(screen.getByRole('dialog', { name: 'Block a date' })).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog', { name: 'Block a date' })).getByRole('button', {
        name: 'Block date',
      }),
    ).toBeDisabled();
  });
});
