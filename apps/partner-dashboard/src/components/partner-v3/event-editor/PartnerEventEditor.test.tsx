import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerEventEditor } from './PartnerEventEditor';

import type { CalendarDay, EventEditorDraft } from '@/data/partner-data-source';

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

  it('keeps an empty venue date passed from the calendar selected', async () => {
    const data = await fixturePartnerDataSource.getVenueEventEditor();
    const availability = await fixturePartnerDataSource.getVenueCalendar();
    const sourceDate = availability.months[0]?.days[0];

    expect(sourceDate).toBeDefined();
    if (!sourceDate) return;
    const emptyDate: CalendarDay = {
      ...sourceDate,
      state: 'unavailable',
      events: [],
      slots: [],
    };
    const availabilityWithEmptyDate = {
      ...availability,
      months: availability.months.map((month, index) =>
        index === 0 ? { ...month, days: [emptyDate, ...month.days.slice(1)] } : month,
      ),
    };

    render(
      <PartnerEventEditor
        data={data}
        availability={availabilityWithEmptyDate}
        mode="create"
        initialDate={emptyDate.date}
      />,
    );

    const expectedLabel = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${emptyDate.date}T12:00:00Z`));
    expect(screen.getByLabelText(/^Date/)).toHaveValue(expectedLabel);
    expect(screen.getByRole('button', { name: String(emptyDate.day) })).toBeEnabled();
  });

  it('submits a valid venue event from the review step', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueEventEditor();
    const availability = await fixturePartnerDataSource.getVenueCalendar();
    const availableDate = availability.months
      .find((month) => month.key === '2026-08')
      ?.days.find((day) => day.state === 'available');
    const onSubmit = vi.fn<(draft: EventEditorDraft) => Promise<void>>().mockResolvedValue(undefined);

    expect(availableDate).toBeDefined();
    if (!availableDate) return;

    render(
      <PartnerEventEditor
        data={data}
        availability={availability}
        mode="create"
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText('Event name'), 'Backend Night');
    await user.click(screen.getByRole('button', { name: String(availableDate.day) }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.queryByText(/publishing is unavailable/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Publish event/ }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Backend Night', date: availableDate.date }),
    );
  });

  it('keeps publish clickable and reveals validation errors on review', async () => {
    const user = userEvent.setup();
    const data = await fixturePartnerDataSource.getVenueEventEditor();
    const availability = await fixturePartnerDataSource.getVenueCalendar();
    const onSubmit = vi.fn<(draft: EventEditorDraft) => Promise<void>>().mockResolvedValue(undefined);

    render(
      <PartnerEventEditor
        data={data}
        availability={availability}
        mode="create"
        initialStep="review"
        onSubmit={onSubmit}
      />,
    );

    const publishButton = screen.getByRole('button', { name: /Publish event/ });
    expect(publishButton).toBeEnabled();
    await user.click(publishButton);

    expect(screen.getByText('Add an event name.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
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
