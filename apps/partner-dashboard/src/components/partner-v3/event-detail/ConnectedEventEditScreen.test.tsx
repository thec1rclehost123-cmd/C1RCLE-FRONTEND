import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedEventEditScreen } from './ConnectedEventEditScreen';

import type { EventOperationsDto, UpdateEventInput } from '@c1rcle/contracts';

const updateEvent = vi.hoisted(() =>
  vi.fn<
    (
      organizationId: string,
      eventId: string,
      version: number,
      changes: UpdateEventInput,
    ) => Promise<EventOperationsDto>
  >(),
);
const loadSlotRequests = vi.hoisted(() => vi.fn());

vi.mock('@/lib/events/venue-event-repository', () => ({
  updatePartnerEventDetails: updateEvent,
}));

vi.mock('@/lib/slot-requests/slot-request-repository', () => ({
  loadSlotRequestsData: loadSlotRequests,
}));

const event: EventOperationsDto = {
  id: 'evt_m3',
  organizationId: 'org_m3',
  venueId: 'venue_m3',
  slug: 'm3-test-event',
  title: 'M3 test event',
  summary: 'Original summary',
  description: 'Original description',
  imageUrl: null,
  startAt: '2026-12-30T13:30:00.000Z',
  endAt: '2026-12-30T17:30:00.000Z',
  status: 'published',
  visibilityMode: 'public',
  addressDisclosure: 'public',
  entryRules: {
    doorsOpenAt: null,
    lastEntryAt: null,
    reentryAllowed: null,
    minimumAge: null,
    idRequired: null,
    accessibilityNotes: null,
    dressCode: null,
    alcoholPolicy: null,
    prohibitedItems: [],
    supportDetails: null,
  },
  isPublic: true,
  tags: [],
  startingPricePaise: 100,
  isFree: false,
  cancellationReason: null,
  compensation: null,
  version: 4,
  createdAt: '2026-10-22T00:00:00.000Z',
  updatedAt: '2026-10-22T00:00:00.000Z',
  capacity: null,
  venueName: 'M3 test venue',
  ticketsSold: 0,
  salesCountComplete: true,
};

beforeEach(() => {
  updateEvent.mockReset();
  loadSlotRequests.mockReset();
  loadSlotRequests.mockResolvedValue({ requests: [] });
});

describe('ConnectedEventEditScreen', () => {
  it('saves only event-copy fields and confirms the authoritative result', async () => {
    updateEvent.mockResolvedValueOnce({
      ...event,
      title: 'M3 test event updated',
      version: 5,
    });

    render(<ConnectedEventEditScreen event={event} organizationId="org_m3" studio="venue" />);
    fireEvent.change(screen.getByLabelText('Event title'), {
      target: { value: 'M3 test event updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledOnce();
    });
    expect(updateEvent).toHaveBeenCalledWith('org_m3', 'evt_m3', 4, {
      title: 'M3 test event updated',
      summary: 'Original summary',
      description: 'Original description',
      visibilityMode: 'public',
      addressDisclosure: 'public',
      entryRules: event.entryRules,
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Event details saved.');
    expect(screen.getByLabelText('Event title')).toHaveValue('M3 test event updated');
    expect(
      screen.getByText(/Host can apply a new date or Venue only through a slot request/),
    ).toBeVisible();
  });

  it('saves unlisted visibility and explains that event details can be shared', async () => {
    updateEvent.mockResolvedValueOnce({ ...event, visibilityMode: 'unlisted', version: 5 });
    render(<ConnectedEventEditScreen event={event} organizationId="org_m3" studio="venue" />);

    fireEvent.change(screen.getByLabelText('Who can find this event?'), {
      target: { value: 'unlisted' },
    });
    expect(screen.getByText(/Anyone with the link can view and share event details/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledOnce();
    });
    expect(updateEvent).toHaveBeenCalledWith('org_m3', 'evt_m3', 4, {
      title: 'M3 test event',
      summary: 'Original summary',
      description: 'Original description',
      visibilityMode: 'unlisted',
      addressDisclosure: 'public',
      entryRules: event.entryRules,
    });
    expect(await screen.findByLabelText('Who can find this event?')).toHaveValue('unlisted');
  });

  it('saves an explicit private-event address disclosure policy', async () => {
    const privateEvent = {
      ...event,
      visibilityMode: 'code' as const,
      addressDisclosure: 'hidden' as const,
    };
    updateEvent.mockResolvedValueOnce({
      ...privateEvent,
      addressDisclosure: 'after_grant',
      version: 5,
    });
    render(<ConnectedEventEditScreen event={privateEvent} organizationId="org_m3" studio="host" />);

    fireEvent.change(screen.getByLabelText('Full venue address'), {
      target: { value: 'after_grant' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledOnce();
    });
    expect(updateEvent).toHaveBeenCalledWith('org_m3', 'evt_m3', 4, {
      title: 'M3 test event',
      summary: 'Original summary',
      description: 'Original description',
      visibilityMode: 'code',
      addressDisclosure: 'after_grant',
      entryRules: event.entryRules,
    });
    expect(screen.getByLabelText('Full venue address')).toHaveValue('after_grant');
  });

  it('saves structured entry facts to the authoritative event', async () => {
    updateEvent.mockResolvedValueOnce({
      ...event,
      version: 5,
      entryRules: {
        doorsOpenAt: '2026-12-30T18:00:00.000Z',
        lastEntryAt: null,
        reentryAllowed: false,
        minimumAge: null,
        idRequired: null,
        accessibilityNotes: null,
        dressCode: null,
        alcoholPolicy: null,
        prohibitedItems: ['Weapons', 'Glass bottles'],
        supportDetails: null,
      },
    });
    render(<ConnectedEventEditScreen event={event} organizationId="org_m3" studio="venue" />);

    fireEvent.change(screen.getByLabelText('Doors open (UTC ISO 8601)'), {
      target: { value: '2026-12-30T18:00:00.000Z' },
    });
    fireEvent.change(screen.getByLabelText('Re-entry'), { target: { value: 'false' } });
    fireEvent.change(screen.getByLabelText('Prohibited items (one per line)'), {
      target: { value: 'Weapons\nGlass bottles' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledOnce();
    });
    const submitted = updateEvent.mock.calls[0]?.[3];
    expect(submitted?.entryRules).toMatchObject({
      doorsOpenAt: '2026-12-30T18:00:00.000Z',
      reentryAllowed: false,
      prohibitedItems: ['Weapons', 'Glass bottles'],
    });
  });

  it('applies a Venue-approved replacement slot through the event update API', async () => {
    loadSlotRequests.mockResolvedValueOnce({
      requests: [
        {
          id: 'slot-request-new',
          eventId: event.id,
          status: 'approved',
          venueId: 'venue_new',
          partnerName: 'New Venue',
          slotStartTime: '2027-01-15T18:00:00.000Z',
          slotEndTime: '2027-01-15T23:00:00.000Z',
          timezone: 'Asia/Kolkata',
        },
      ],
    });
    updateEvent.mockResolvedValueOnce({
      ...event,
      version: 5,
      venueId: 'venue_new',
      startAt: '2027-01-15T18:00:00.000Z',
      endAt: '2027-01-15T23:00:00.000Z',
    });
    render(<ConnectedEventEditScreen event={event} organizationId="org_m3" studio="host" />);

    fireEvent.change(await screen.findByLabelText('Accepted Venue slot request'), {
      target: { value: 'slot-request-new' },
    });
    expect(screen.getByLabelText('Event start (ISO 8601 UTC)')).toHaveValue(
      '2027-01-15T18:00:00.000Z',
    );
    expect(screen.getByRole('link', { name: 'Request another Venue slot' })).toHaveAttribute(
      'href',
      `/partner/host/calendar?event=${event.id}`,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledOnce();
    });
    expect(updateEvent).toHaveBeenCalledWith(
      'org_m3',
      event.id,
      4,
      expect.objectContaining({
        venueId: 'venue_new',
        slotRequestId: 'slot-request-new',
        startAt: '2027-01-15T18:00:00.000Z',
        endAt: '2027-01-15T23:00:00.000Z',
      }),
    );
  });

  it('disables save when the title contains no non-whitespace text', () => {
    render(<ConnectedEventEditScreen event={event} organizationId="org_m3" studio="venue" />);
    fireEvent.change(screen.getByLabelText('Event title'), { target: { value: '   ' } });

    expect(screen.getByRole('button', { name: 'Save details' })).toBeDisabled();
    expect(updateEvent).not.toHaveBeenCalled();
  });
});
