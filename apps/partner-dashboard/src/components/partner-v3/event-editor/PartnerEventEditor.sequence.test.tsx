import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';

import { PartnerEventEditor } from './PartnerEventEditor';

const navigation = vi.hoisted(() => ({ query: '', push: vi.fn(), replace: vi.fn() }));
vi.mock('next/image', () => ({ default: () => <span /> }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/partner/venue/events/create',
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
async function setup(initialStep?: 'review') {
  const data = await fixturePartnerDataSource.getVenueEventEditor();
  const availability = await fixturePartnerDataSource.getVenueCalendar();
  return render(
    <PartnerEventEditor
      data={data}
      availability={availability}
      mode="create"
      {...(initialStep ? { initialStep } : {})}
    />,
  );
}
describe('event editor sequential navigation', () => {
  beforeEach(() => {
    navigation.query = '';
    navigation.push.mockReset();
    navigation.replace.mockReset();
  });
  it.each(['schedule', 'tickets', 'promoters', 'advanced', 'media', 'review'])(
    'blocks a direct URL to %s before step one is complete',
    async (step) => {
      navigation.query = `step=${step}`;
      await setup();
      expect(screen.getByLabelText('Event name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Date & time/ })).toBeDisabled();
    },
  );
  it('blocks an initial Review step without completed prerequisites', async () => {
    await setup('review');
    expect(screen.getByLabelText('Event name')).toBeInTheDocument();
  });
  it('unlocks the next step only after Continue validates and relocks it after an earlier edit', async () => {
    const user = userEvent.setup();
    await setup();
    fireEvent.change(screen.getByLabelText('Event name'), {
      target: { value: 'Sequential event' },
    });
    fireEvent.change(screen.getByLabelText('Event description'), {
      target: {
        value: 'A complete event description long enough for guests to understand this event.',
      },
    });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(navigation.push).toHaveBeenLastCalledWith('/partner/venue/events/create?step=schedule', {
      scroll: false,
    });
    await user.click(screen.getByRole('button', { name: /Event details/ }));
    fireEvent.change(screen.getByLabelText('Event name'), { target: { value: '' } });
    expect(screen.getByRole('button', { name: /Date & time/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Add an event name.');
  });
  it('starts Host creation at Venue even when the URL requests Review', async () => {
    navigation.query = 'step=review';
    const data = await fixturePartnerDataSource.getHostEventEditor();
    const availability = await fixturePartnerDataSource.getHostAvailability();
    render(<PartnerEventEditor data={data} availability={availability} mode="create" />);
    expect(screen.getByRole('button', { name: /1\s*Venue/ })).toHaveAttribute(
      'aria-current',
      'step',
    );
    expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();
  });
  it('starts an accepted Host booking at its first applicable step', async () => {
    navigation.query = 'step=review';
    const data = await fixturePartnerDataSource.getHostEventEditor();
    const availability = await fixturePartnerDataSource.getHostAvailability();
    render(
      <PartnerEventEditor data={data} availability={availability} mode="create" acceptedSlotMode />,
    );
    expect(screen.getByLabelText('Event name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tickets/ })).toBeDisabled();
  });
});
