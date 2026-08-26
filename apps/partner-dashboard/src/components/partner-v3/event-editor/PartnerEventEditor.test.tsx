import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerEventEditor } from './PartnerEventEditor';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/image', () => ({ default: () => <span aria-hidden="true" /> }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/venue/events/create',
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('PartnerEventEditor', () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
  });

  it('renders the Venue three-step editor and keeps publish frontend-only', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueEventEditor();
    const availability = await fixturePartnerDataSource.getVenueCalendar();
    render(<PartnerEventEditor data={data} availability={availability} mode="create" />);

    expect(screen.getByRole('heading', { name: 'Create event' })).toBeInTheDocument();
    expect(screen.getByText('Basics & tickets')).toBeInTheDocument();
    expect(screen.getByText('Ticket tiers')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add an event name.');

    await user.type(screen.getByLabelText('Event name'), 'Test night');
    const availableDate = availability.months[0]?.days.find((day) => day.state === 'available');
    expect(availableDate).toBeDefined();
    if (availableDate) await user.click(screen.getByRole('button', { name: String(availableDate.day) }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(push).toHaveBeenLastCalledWith('/partner/venue/events/create?step=promoters', { scroll: false });

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(push).toHaveBeenLastCalledWith('/partner/venue/events/create?step=review', { scroll: false });
    expect(screen.getByText(/publishing is unavailable/i)).toBeInTheDocument();
  });

  it('requires Host venue availability before proceeding and exposes no Venue ownership controls', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getHostEventEditor();
    const availability = await fixturePartnerDataSource.getHostAvailability();
    render(<PartnerEventEditor data={data} availability={availability} mode="create" initialVenueId="skyline-rooftop" initialDate="2026-07-18" initialStep="venue" />);

    expect(screen.getByText('Choose a venue')).toBeInTheDocument();
    expect(screen.queryByText('Block date')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /8:00 PM – 11:00 PM/ }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add an event name.');
    expect(push).not.toHaveBeenCalledWith(expect.stringContaining('step=basics'), expect.anything());
  });

  it('opens Guest portal and Mobile app preview choices from the live preview', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueEventEditor();
    const availability = await fixturePartnerDataSource.getVenueCalendar();
    render(<PartnerEventEditor data={data} availability={availability} mode="create" />);

    await user.click(screen.getByRole('button', { name: /Your event name/ }));
    expect(screen.getByRole('dialog', { name: 'Preview destination' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Guest portal/i }));
    expect(screen.getByText('This is how it will look in the guest portal')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Back to editing/i }));
    await user.click(screen.getByRole('button', { name: /Your event name/ }));
    await user.click(screen.getByRole('button', { name: /Mobile app/i }));
    expect(screen.getByText('This is how it will look in the mobile app')).toBeInTheDocument();
  });
});
