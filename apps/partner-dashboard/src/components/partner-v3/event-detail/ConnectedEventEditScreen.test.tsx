import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { eventOperationsDtoSchema } from '@c1rcle/contracts';

import { ConnectedEventEditScreen } from './ConnectedEventEditScreen';

import type { EventOperationsDto, TicketTierDto, UpdateEventInput } from '@c1rcle/contracts';

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
const updateTierLimit = vi.hoisted(() => vi.fn());

vi.mock('@/lib/events/venue-event-repository', () => ({
  updatePartnerEventDetails: updateEvent,
  updatePartnerEventTicketLimit: updateTierLimit,
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
  updateTierLimit.mockReset();
  loadSlotRequests.mockResolvedValue({ requests: [] });
});

describe('ConnectedEventEditScreen', () => {
  it('loads and saves Free RSVP and paid limits through the Host editor', async () => {
    const rsvp: TicketTierDto = {
      id: 'tier_rsvp',
      eventId: event.id,
      organizationId: event.organizationId,
      name: 'Free RSVP',
      description: '',
      entryType: 'general',
      currency: 'INR',
      priceInPaise: 0,
      quantity: 20,
      status: 'active',
      salesStartAt: null,
      salesEndAt: null,
      maxPerOrder: null,
      accessType: 'RSVP',
      version: 1,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
    const paid: TicketTierDto = {
      ...rsvp,
      id: 'tier_paid',
      name: 'General Entry',
      priceInPaise: 50_000,
      maxPerOrder: null,
      accessType: 'ENTRY',
    };
    updateTierLimit.mockImplementation(
      (
        _organizationId: string,
        _eventId: string,
        tierId: string,
        version: number,
        changes: { maxPerOrder?: number; quantity?: number; priceInPaise?: number },
      ) =>
        Promise.resolve({
          ...(tierId === rsvp.id ? rsvp : paid),
          ...changes,
          version: version + 1,
        }),
    );
    render(
      <ConnectedEventEditScreen
        event={event}
        organizationId={event.organizationId}
        studio="host"
        ticketTiers={[rsvp, paid]}
      />,
    );

    expect(screen.getByLabelText('Free RSVP maximum per order')).toHaveValue(1);
    expect(screen.getByLabelText('General Entry maximum per order')).toHaveValue(10);
    await userEvent.click(screen.getAllByRole('button', { name: 'Save limit' })[0]!);
    await waitFor(() => {
      expect(updateTierLimit).toHaveBeenCalledTimes(1);
    });
    expect(updateTierLimit).toHaveBeenLastCalledWith(
      event.organizationId,
      event.id,
      rsvp.id,
      1,
      { maxPerOrder: 1 },
      expect.any(String),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save limit' }));
    await waitFor(() => {
      expect(updateTierLimit).toHaveBeenCalledTimes(2);
    });
    expect(updateTierLimit).toHaveBeenLastCalledWith(
      event.organizationId,
      event.id,
      paid.id,
      1,
      { maxPerOrder: 10 },
      expect.any(String),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'General Entry per-order limit saved.',
    );
    fireEvent.change(screen.getByLabelText('General Entry total inventory'), {
      target: { value: '40' },
    });
    fireEvent.change(screen.getByLabelText('General Entry future price'), {
      target: { value: '650.50' },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Save ticket settings' }));
    await waitFor(() => {
      expect(updateTierLimit).toHaveBeenCalledTimes(3);
    });
    expect(updateTierLimit).toHaveBeenLastCalledWith(
      event.organizationId,
      event.id,
      paid.id,
      2,
      { quantity: 40, priceInPaise: 65050 },
      expect.any(String),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'General Entry ticket settings saved.',
    );
  });

  it('saves a standardized refund-request cutoff in the product timezone', async () => {
    updateEvent.mockImplementation((_org, _event, _version, changes) =>
      Promise.resolve(
        eventOperationsDtoSchema.parse({
          ...event,
          ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)),
          version: 5,
        }),
      ),
    );
    render(<ConnectedEventEditScreen event={event} organizationId="org_m3" studio="host" />);
    fireEvent.change(screen.getByLabelText('Refund request policy'), {
      target: { value: 'until_cutoff' },
    });
    fireEvent.change(screen.getByLabelText('Refund request deadline (IST)'), {
      target: { value: '2026-12-29T12:30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save details' }));
    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalledWith(
        'org_m3',
        'evt_m3',
        4,
        expect.objectContaining({
          refundPolicy: { kind: 'until_cutoff', cutoffAt: '2026-12-29T07:00:00.000Z' },
        }),
      );
    });
  });

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
      entryRules: { ...event.entryRules, reentryAllowed: false },
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Event details saved.');
    expect(screen.getByLabelText('Event title')).toHaveValue('M3 test event updated');
    expect(screen.queryByText('Venue-approved reschedule')).not.toBeInTheDocument();
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
      entryRules: { ...event.entryRules, reentryAllowed: false },
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
      entryRules: { ...event.entryRules, reentryAllowed: false },
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

    fireEvent.change(screen.getByLabelText('Doors open (IST)'), {
      target: { value: '2026-12-30T23:30' },
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
          slotStartTime: '2027-01-15T13:30:00.000Z',
          slotEndTime: '2027-01-15T17:30:00.000Z',
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
    expect(
      screen.getByRole('option', {
        name: /New Venue · 15 Jan 2027 · 7:00 pm IST – 11:00 pm IST/,
      }),
    ).toBeVisible();
    expect(screen.getByLabelText('Event start (IST)')).toHaveValue('2027-01-15T19:00');
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
        startAt: '2027-01-15T13:30:00.000Z',
        endAt: '2027-01-15T17:30:00.000Z',
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
