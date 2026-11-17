import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fixturePartnerDataSource } from '@/data/fixture-partner-data-source';
import { createEmptyEventEditorData } from '@/lib/events/event-editor-data';

import { HostEventEditorRoute } from './HostEventEditorRoute';

interface HostEditorMocks {
  availability: unknown;
  requests: unknown[];
  routerPush: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted<HostEditorMocks>(() => ({
  availability: null,
  requests: [],
  routerPush: vi.fn(),
}));

vi.mock('next/image', () => ({ default: () => <span aria-hidden="true" /> }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.routerPush, replace: vi.fn() }),
  usePathname: () => '/partner/host/events/create',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/lib/calendar/use-host-availability', () => ({
  useHostAvailability: () => ({
    data: mocks.availability,
    error: null,
    loading: false,
    retry: vi.fn(),
  }),
}));
vi.mock('@/lib/partner/use-connected-promoters', () => ({
  useAssignablePromoters: () => ({ data: [], error: null, loading: false, retry: vi.fn() }),
}));
vi.mock('@/lib/slot-requests/slot-request-repository', () => ({
  loadSlotRequestsData: () =>
    Promise.resolve({ dataStatus: 'live', accent: 'lavender', requests: mocks.requests }),
}));
describe('HostEventEditorRoute', () => {
  beforeEach(async () => {
    const availability = await fixturePartnerDataSource.getHostAvailability();
    mocks.availability = availability;
    mocks.routerPush.mockReset();
    const venueId = availability.venues[0]?.venue.id;
    if (!venueId) throw new Error('Expected a partnered test Venue');
    mocks.requests = [
      {
        id: 'accepted-request-m3',
        status: 'approved',
        direction: 'outgoing',
        partnerName: 'Test Venue',
        partnerRoleLabel: 'Venue',
        partnerInitials: 'TV',
        venueId,
        slotId: 'accepted-slot-m3',
        slotStartTime: '2026-11-06T12:30:00.000Z',
        slotEndTime: '2026-11-06T16:30:00.000Z',
        timezone: 'Asia/Kolkata',
        event: { name: 'Test', description: '', date: '', time: '', venue: 'Test Venue' },
      },
    ];
  });

  it('does not seed M3 test event content into an accepted-slot Host editor', async () => {
    render(
      <HostEventEditorRoute
        organizationId="host-test-org"
        data={createEmptyEventEditorData('host')}
        acceptedRequestId="accepted-request-m3"
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Event name')).toBeInTheDocument());
    expect(screen.getByLabelText('Event name')).toHaveValue('');
    expect(screen.queryByText('M3-HOST-E2E')).not.toBeInTheDocument();
    expect(screen.queryByText('General Admission')).not.toBeInTheDocument();
  });

  it('shows an actionable unavailable state when an approved slot venue is no longer partnered', async () => {
    const request = mocks.requests[0];
    if (!request) throw new Error('Expected an approved test request');
    mocks.requests = [{ ...request, venueId: 'unavailable-venue-m3' }];

    render(
      <HostEventEditorRoute
        organizationId="host-test-org"
        data={createEmptyEventEditorData('host')}
        acceptedRequestId="accepted-request-m3"
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Accepted slot unavailable' })).toBeVisible();
    expect(screen.getByText(/Venue for this approved slot is no longer available/i)).toBeVisible();
    expect(screen.queryByLabelText('Event name')).not.toBeInTheDocument();
  });

  it('loads a rejected proposal into the editor while keeping its rejection reason visible', async () => {
    const availability = mocks.availability as {
      venues: {
        venue: { id: string };
        months: {
          days: {
            date: string;
            slots: { id: string; status: string; startTime?: string; endTime?: string }[];
          }[];
        }[];
      }[];
    };
    const venue = availability.venues[0];
    const availableDay = venue?.months
      .flatMap((month) => month.days)
      .find((day) => day.slots.some((slot) => slot.status === 'available'));
    const openSlot = availableDay?.slots.find((slot) => slot.status === 'available');
    if (!venue || !availableDay || !openSlot) throw new Error('Expected an open fixture slot');
    const venueId = venue.venue.id;
    mocks.requests = [
      {
        id: 'rejected-request-editable',
        status: 'rejected',
        direction: 'outgoing',
        partnerName: 'Test Venue',
        partnerRoleLabel: 'Venue',
        partnerInitials: 'TV',
        venueId,
        slotId: openSlot.id,
        rejectionReason: 'Please adjust the event title.',
        eventDraft: {
          event: {
            venueId,
            title: 'Original proposal title',
            summary: 'Original summary',
            description: 'Original description',
            startAt: `${availableDay.date}T12:00:00.000Z`,
            endAt: `${availableDay.date}T15:00:00.000Z`,
            tags: ['Electronic'],
          },
          tiers: [
            {
              localId: 'safe-tier-id',
              command: { name: 'General', quantity: 80, priceInPaise: 5000 },
            },
          ],
          promotions: [],
          promoters: [],
        },
        event: {
          name: 'Original proposal title',
          description: 'Original description',
          date: '',
          time: '',
          venue: 'Test Venue',
        },
      },
    ];

    render(
      <HostEventEditorRoute
        organizationId="host-test-org"
        data={createEmptyEventEditorData('host')}
        resubmitRequestId="rejected-request-editable"
      />,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(await screen.findByLabelText('Event name')).toHaveValue('Original proposal title');
    expect(screen.getByText(/Please adjust the event title/)).toBeVisible();
    expect(screen.getByRole('button', { name: /Event details/ })).toHaveAttribute(
      'aria-current',
      'step',
    );
  });
});
