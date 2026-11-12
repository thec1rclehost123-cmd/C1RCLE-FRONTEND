import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerEventEditor } from './PartnerEventEditor';

import type { EventEditorDraft, HostAvailabilityData } from '@/data/partner-data-source';

function withTimedHostSlot(availability: HostAvailabilityData, venueId: string, date: string) {
  const venue = availability.venues.find((item) => item.venue.id === venueId);
  const day = venue?.months.flatMap((month) => month.days).find((item) => item.date === date);
  const originalSlot = day?.slots[0];
  if (!venue || !day || !originalSlot) throw new Error('Expected a Host time slot fixture.');
  const slot = {
    ...originalSlot,
    startTime: new Date(`${date}T09:00:00+05:30`).toISOString(),
    endTime: new Date(`${date}T21:00:00+05:30`).toISOString(),
    timezone: 'Asia/Kolkata',
  };
  return {
    slot,
    availability: {
      ...availability,
      venues: availability.venues.map((item) =>
        item.venue.id !== venueId
          ? item
          : {
              ...item,
              months: item.months.map((month) => ({
                ...month,
                days: month.days.map((calendarDay) =>
                  calendarDay.date !== date
                    ? calendarDay
                    : {
                        ...calendarDay,
                        slots: calendarDay.slots.map((candidate) =>
                          candidate.id === slot.id ? slot : candidate,
                        ),
                      },
                ),
              })),
            },
      ),
    },
  };
}

const push = vi.fn();
const replace = vi.fn();
const posterStoreMocks = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue(null),
  clear: vi.fn().mockResolvedValue(undefined),
}));
const hostDraftMocks = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ draft: null }),
  save: vi.fn().mockResolvedValue(undefined),
  discard: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/events/draft-poster-store', () => ({
  saveDraftPoster: posterStoreMocks.save,
  getDraftPoster: posterStoreMocks.get,
  clearDraftPoster: posterStoreMocks.clear,
}));
vi.mock('@/lib/events/event-draft-repository', () => ({
  getHostEventDraft: hostDraftMocks.get,
  saveHostEventDraft: hostDraftMocks.save,
  discardHostEventDraft: hostDraftMocks.discard,
}));
vi.mock('next/image', () => ({ default: () => <span aria-hidden="true" /> }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/venue/events/create',
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

async function setup(
  initialStep?: string,
  host = false,
  acceptedSlotMode = false,
  persistHost = false,
) {
  const data = await (host
    ? fixturePartnerDataSource.getHostEventEditor()
    : fixturePartnerDataSource.getVenueEventEditor());
  const availability = await (host
    ? fixturePartnerDataSource.getHostAvailability()
    : fixturePartnerDataSource.getVenueCalendar());
  const onSubmit = vi
    .fn<(draft: EventEditorDraft, slot: string) => Promise<void>>()
    .mockResolvedValue(undefined);
  render(
    <PartnerEventEditor
      data={{ ...data, defaultDraft: { ...data.defaultDraft, promoCodes: [] } }}
      availability={availability}
      mode="create"
      onSubmit={onSubmit}
      {...(host && persistHost ? { organizationId: 'host-test-org' } : {})}
      {...('months' in availability && availability.months[0]?.days[0]
        ? { initialDate: availability.months[0].days[0].date }
        : {})}
      {...(initialStep ? { initialStep } : {})}
      acceptedSlotMode={acceptedSlotMode}
    />,
  );
  return { data, availability, onSubmit, user: userEvent.setup() };
}
function fillBasics() {
  fireEvent.change(screen.getByLabelText('Event name'), { target: { value: 'Acceptance Night' } });
  fireEvent.change(screen.getByLabelText('Event description'), {
    target: { value: 'An evening of live music and dancing for the connected acceptance journey.' },
  });
}
async function continueStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('PartnerEventEditor sequential workflow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    posterStoreMocks.save.mockReset().mockResolvedValue(undefined);
    posterStoreMocks.get.mockReset().mockResolvedValue(null);
    posterStoreMocks.clear.mockReset().mockResolvedValue(undefined);
    hostDraftMocks.get.mockReset().mockResolvedValue({ draft: null });
    hostDraftMocks.save.mockReset().mockResolvedValue(undefined);
    hostDraftMocks.discard.mockReset().mockResolvedValue(undefined);
  });

  it('blocks deep links and future step buttons until prior steps are completed', async () => {
    const { user, onSubmit } = await setup('review');
    expect(screen.getByRole('heading', { name: 'Create event' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Event setup sections' });
    expect(within(nav).getByRole('button', { name: /Review/ })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Publish event' })).not.toBeInTheDocument();
    expect(replace).toHaveBeenCalledWith(expect.stringContaining('step=basics'), { scroll: false });
    await continueStep(user);
    expect(screen.getByRole('alert')).toHaveTextContent('Add an event name.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires guest-facing copy before marking event details complete', async () => {
    const { user } = await setup();
    fireEvent.change(screen.getByLabelText('Event name'), { target: { value: 'Title only' } });
    await continueStep(user);
    expect(screen.getByRole('alert')).toHaveTextContent('at least 40 characters');
    fillBasics();
    await continueStep(user);
    expect(screen.getByLabelText('Start time')).toBeInTheDocument();
    expect(push).toHaveBeenLastCalledWith(expect.stringContaining('step=schedule'), {
      scroll: false,
    });
  });

  it('submits completed steps with the selected date and preserves ticket limits', async () => {
    const { user, onSubmit, availability } = await setup();
    fillBasics();
    await continueStep(user);
    const date = ('months' in availability ? availability.months : [])[0]?.days.find(
      (day) => day.state === 'available',
    );
    if (!date) throw new Error('Expected an available fixture date');
    await user.click(screen.getByRole('button', { name: String(date.day) }));
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '20:00' } });
    await continueStep(user);
    expect(screen.getByText('How will guests join?')).toBeInTheDocument();
    await continueStep(user);
    await continueStep(user);
    await continueStep(user);
    await continueStep(user);
    expect(screen.getByRole('button', { name: 'Web preview' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Publish event' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      name: 'Acceptance Night',
      date: date.date,
    });
    expect(
      onSubmit.mock.calls[0]?.[0].ticketTiers.every((tier) => (tier.maxPerOrder ?? 10) <= 10),
    ).toBe(true);
  });

  it('keeps previews visible but unavailable before review', async () => {
    await setup();
    expect(screen.getByRole('button', { name: 'Web preview' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Mobile preview' })).toBeDisabled();
  });

  it('persists a selected Host poster locally and permits choosing the same file again', async () => {
    posterStoreMocks.save.mockClear();
    const { data } = await setup(undefined, true, false, true);
    await waitFor(() => {
      expect(screen.getByLabelText('Upload event poster')).toBeInTheDocument();
    });
    const file = new File(['poster'], 'test-poster.png', { type: 'image/png' });
    const input = screen.getByLabelText('Upload event poster');

    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(posterStoreMocks.save).toHaveBeenCalledWith('host-test-org', file);
    });
    expect(input).toHaveValue('');
    expect(data.role).toBe('host');
  });

  it('restores a selected Host poster file from local draft storage', async () => {
    const file = new File(['poster'], 'restored-poster.png', { type: 'image/png' });
    hostDraftMocks.get.mockResolvedValue({
      draft: {
        schemaVersion: 1,
        data: { name: 'Restored event', description: 'A valid server-backed event draft.' },
      },
    });
    posterStoreMocks.get.mockResolvedValue(file);
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:restored-poster');

    await setup(undefined, true, false, true);

    await waitFor(() => {
      expect(posterStoreMocks.get).toHaveBeenCalledWith('host-test-org');
    });
    expect(createObjectUrl).toHaveBeenCalledWith(file);

    await waitFor(() => {
      expect(screen.getByText('Change poster')).toBeInTheDocument();
    });
  });

  it('clears an orphaned local poster when there is no server draft to restore', async () => {
    posterStoreMocks.get.mockResolvedValue(
      new File(['stale'], 'stale-poster.png', { type: 'image/png' }),
    );

    const data = await fixturePartnerDataSource.getHostEventEditor();
    render(
      <PartnerEventEditor
        data={{
          ...data,
          defaultDraft: {
            ...data.defaultDraft,
            promoCodes: [],
            artwork: { type: 'gradient', value: 'test-gradient' },
          },
        }}
        availability={await fixturePartnerDataSource.getHostAvailability()}
        mode="create"
        organizationId="host-test-org"
      />,
    );

    await waitFor(() => {
      expect(posterStoreMocks.clear).toHaveBeenCalledWith('host-test-org');
    });
    expect(posterStoreMocks.get).not.toHaveBeenCalled();
    expect(screen.queryByText('Change poster')).not.toBeInTheDocument();
  });

  it('clears a persisted local poster when the Host selects replacement artwork', async () => {
    const { user } = await setup(undefined, true, false, true);
    await waitFor(() => {
      expect(screen.getByLabelText('Upload event poster')).toBeInTheDocument();
    });
    const file = new File(['poster'], 'replace-me.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Upload event poster'), { target: { files: [file] } });
    await waitFor(() => {
      expect(posterStoreMocks.save).toHaveBeenCalledWith('host-test-org', file);
    });

    await user.click(screen.getByRole('button', { name: 'Use artwork 1' }));

    await waitFor(() => {
      expect(posterStoreMocks.clear).toHaveBeenCalledWith('host-test-org');
    });
  });

  it('does not restore a stale Host draft over edits when the selected slot query changes', async () => {
    const data = await fixturePartnerDataSource.getHostEventEditor();
    const availability = await fixturePartnerDataSource.getHostAvailability();
    const venue = availability.venues[0];
    const day = venue?.months.flatMap((month) => month.days).find((item) => item.slots.length > 0);
    if (!venue || !day) throw new Error('Expected a Host time slot fixture.');
    const timed = withTimedHostSlot(availability, venue.venue.id, day.date);
    const slot = timed.slot;
    hostDraftMocks.get.mockResolvedValue({
      draft: {
        schemaVersion: 1,
        data: {
          name: 'Saved acceptance event',
          description: 'A saved draft for testing poster retention across slot changes.',
          selectedSlotId: slot.id,
          time: '18:00',
          endTime: '19:00',
        },
      },
    });
    const props = {
      data: { ...data, defaultDraft: { ...data.defaultDraft, promoCodes: [] } },
      availability: timed.availability,
      mode: 'create' as const,
      organizationId: 'host-test-org',
      initialVenueId: venue.venue.id,
      initialDate: day.date,
      initialSlotId: slot.id,
    };
    const { rerender } = render(<PartnerEventEditor {...props} />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Saved acceptance event' })).toBeInTheDocument();
    });

    const file = new File(['poster'], 'selected-poster.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Upload event poster'), { target: { files: [file] } });
    expect(screen.getByText('Change poster')).toBeInTheDocument();

    rerender(<PartnerEventEditor {...props} initialSlotId={`${slot.id}-changed`} />);

    await waitFor(() => {
      expect(screen.getByText('Change poster')).toBeInTheDocument();
    });
    expect(hostDraftMocks.get).toHaveBeenCalledTimes(1);
  });

  it('restores a valid time range when a Host draft deep link has a slot but no local times', async () => {
    const [data, availability] = await Promise.all([
      fixturePartnerDataSource.getHostEventEditor(),
      fixturePartnerDataSource.getHostAvailability(),
    ]);
    const venueAvailability = availability.venues[0];
    const day = venueAvailability?.months
      .flatMap((month) => month.days)
      .find((item) => item.slots.length > 0);
    const slot = day?.slots[0];
    if (!venueAvailability || !day || !slot) throw new Error('Expected a Host time slot fixture.');
    const timed = withTimedHostSlot(availability, venueAvailability.venue.id, day.date);

    render(
      <PartnerEventEditor
        data={{
          ...data,
          defaultDraft: { ...data.defaultDraft, promoCodes: [], time: '', endTime: '' },
        }}
        availability={timed.availability}
        mode="create"
        organizationId="host-test-org"
        initialVenueId={venueAvailability.venue.id}
        initialDate={day.date}
        initialSlotId={timed.slot.id}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Event start time')).toHaveValue(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(timed.slot.startTime)),
      );
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets Hosts choose an external venue while keeping the existing venue flow intact', async () => {
    const { user, onSubmit } = await setup('review', true);
    expect(screen.getByText('Choose a venue')).toBeInTheDocument();
    const venue = screen.getByLabelText('Venue');
    expect(screen.getByRole('option', { name: 'Venue not on C1RCLE' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Venue name')).not.toBeInTheDocument();
    await user.selectOptions(venue, 'external');
    expect(screen.getByLabelText('Venue name')).toBeInTheDocument();
    expect(screen.getByLabelText('Full venue address')).toBeInTheDocument();
    expect(screen.getByLabelText('Manager name')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish event' })).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not expose external venue selection in the Venue editor', async () => {
    await setup();
    expect(screen.queryByRole('option', { name: 'Venue not on C1RCLE' })).not.toBeInTheDocument();
  });

  it('requires a partnered venue and time before Host details', async () => {
    const { user, onSubmit } = await setup('review', true);
    await user.selectOptions(screen.getByLabelText('Venue'), '');
    await continueStep(user);
    expect(screen.getByRole('alert')).toHaveTextContent('Choose an available');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();
  });

  it('starts an accepted Host booking at details but still disallows a review deep link', async () => {
    await setup('review', true, true);
    expect(screen.getByLabelText('Event name')).toBeInTheDocument();
    expect(screen.queryByText('Choose a venue')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Publish event' })).not.toBeInTheDocument();
  });
});
