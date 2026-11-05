import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventLifecycleActions } from './EventLifecycleActions';

import type { EventDto } from '@c1rcle/contracts';

const mocks = vi.hoisted(() => ({ change: vi.fn(), slots: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/lib/events/venue-event-repository', () => ({
  changePartnerEventLifecycle: mocks.change,
}));
vi.mock('@/lib/slot-requests/slot-request-repository', () => ({
  loadSlotRequestsData: mocks.slots,
}));
const event: EventDto = {
  id: 'night',
  organizationId: 'host',
  venueId: 'venue',
  slug: 'night',
  title: 'Night',
  summary: 'Summary',
  description: 'Details',
  imageUrl: null,
  startAt: '2099-11-10T20:00:00.000Z',
  endAt: '2099-11-11T02:00:00.000Z',
  status: 'published',
  visibilityMode: 'public',
  addressDisclosure: 'public',
  isPublic: true,
  tags: [],
  startingPricePaise: 50000,
  isFree: false,
  cancellationReason: null,
  version: 3,
  createdAt: '2026-11-04T12:00:00.000Z',
  updatedAt: '2026-11-04T12:00:00.000Z',
};
beforeEach(() => {
  mocks.change.mockReset();
  mocks.slots.mockReset();
  mocks.refresh.mockReset();
});

describe('authoritative Partner lifecycle controls', () => {
  it('requires a reason and reuses the intent after an ambiguous postponement failure', async () => {
    mocks.change
      .mockRejectedValueOnce(new Error('Connection interrupted'))
      .mockResolvedValueOnce({ ...event, status: 'postponed', version: 4 });
    render(<EventLifecycleActions event={event} organizationId="host" studio="host" />);
    fireEvent.click(screen.getByRole('button', { name: 'Postpone event' }));
    expect(screen.getByRole('button', { name: 'Confirm postponement' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Postponement reason'), {
      target: { value: 'Venue unavailable' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm postponement' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Connection interrupted');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm postponement' }));
    await waitFor(() => {
      expect(mocks.change).toHaveBeenCalledTimes(2);
    });
    expect(mocks.change.mock.calls[0]?.[3]).toBe(mocks.change.mock.calls[1]?.[3]);
    expect(mocks.change).toHaveBeenLastCalledWith(
      'host',
      'night',
      { action: 'postpone', reason: 'Venue unavailable' },
      expect.any(String),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('admission are on hold');
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });
  it('uses only an approved slot for explicit Host replacement-date announcement', async () => {
    const postponed = { ...event, status: 'postponed' as const, isPublic: false };
    mocks.slots.mockResolvedValue({
      requests: [
        {
          id: 'approved',
          venueId: 'new-venue',
          eventId: event.id,
          status: 'approved',
          partnerName: 'New Venue',
          slotStartTime: '2099-11-12T20:00:00.000Z',
          slotEndTime: '2099-11-13T02:00:00.000Z',
        },
        { id: 'pending', eventId: event.id, status: 'pending', partnerName: 'Pending Venue' },
      ],
    });
    mocks.change.mockResolvedValue({ ...event, version: 4 });
    render(<EventLifecycleActions event={postponed} organizationId="host" studio="host" />);
    expect(screen.getByText(/new date to be announced/i)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Announce replacement date' }));
    const select = await screen.findByLabelText('Accepted replacement Venue slot');
    await waitFor(() => expect(screen.getByRole('option', { name: /New Venue/ })).toBeVisible());
    expect(screen.queryByRole('option', { name: /Pending Venue/ })).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: 'approved' } });
    fireEvent.click(screen.getByRole('button', { name: 'Announce replacement date' }));
    await waitFor(() => {
      expect(mocks.change).toHaveBeenCalledWith(
        'host',
        'night',
        {
          action: 'reschedule',
          startAt: '2099-11-12T20:00:00.000Z',
          endAt: '2099-11-13T02:00:00.000Z',
          slotRequestId: 'approved',
          venueId: 'new-venue',
          expectedVersion: 3,
        },
        expect.any(String),
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Replacement date announced');
  });
  it('keeps a postponed Host frozen when no accepted replacement slot is selected', async () => {
    mocks.slots.mockResolvedValue({ requests: [] });
    render(
      <EventLifecycleActions
        event={{ ...event, status: 'postponed' }}
        organizationId="host"
        studio="host"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Announce replacement date' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Announce replacement date' })).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Announce replacement date' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose an accepted Venue slot');
    expect(mocks.change).not.toHaveBeenCalled();
  });
  it('offers no lifecycle changes for cancelled events', () => {
    render(
      <EventLifecycleActions
        event={{ ...event, status: 'cancelled' }}
        organizationId="host"
        studio="host"
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
