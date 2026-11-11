import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerEventEditor } from './PartnerEventEditor';

import type { EventEditorDraft } from '@/data/partner-data-source';

const push = vi.fn();
const replace = vi.fn();
vi.mock('next/image', () => ({ default: () => <span aria-hidden="true" /> }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/venue/events/create',
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

async function setup(initialStep?: string, host = false, acceptedSlotMode = false) {
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
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
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
