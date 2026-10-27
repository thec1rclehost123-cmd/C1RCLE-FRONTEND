import { render, screen, waitFor } from '@testing-library/react';
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
  useConnectedPromoters: () => ({ data: [], error: null, loading: false, retry: vi.fn() }),
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
});
