import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import EventsDesk from '@/app/events/page';

import type * as AdminApi from '@/lib/admin/admin-api';

vi.mock('@/lib/admin/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApi>();
  return {
    ...actual,
    listEvents: vi.fn(),
    getEventCoverReconciliation: vi.fn(),
  };
});

const api = await import('@/lib/admin/admin-api');

function renderDesk() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <EventsDesk />
    </QueryClientProvider>,
  );
}

describe('EventsDesk cover reconciliation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.listEvents).mockResolvedValue({
      items: [
        {
          id: 'EVT-cover-summary',
          organizationId: 'ORG-host',
          venueId: null,
          slug: 'cover-summary',
          title: 'Cover Summary Event',
          status: 'published',
          isPublic: true,
          adminOverride: false,
          startAt: '2026-10-30T18:00:00.000Z',
          endAt: null,
          startingPricePaise: 100_000,
          isFree: false,
          createdAt: '2026-10-28T12:00:00.000Z',
          updatedAt: '2026-10-28T12:00:00.000Z',
        },
      ],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false },
    });
  });

  it('loads a read-only event aggregate and labels settlement as held', async () => {
    vi.mocked(api.getEventCoverReconciliation).mockResolvedValue({
      eventId: 'EVT-cover-summary',
      currency: 'INR',
      accountCount: 1,
      scannedAccountCount: 1,
      truncated: false,
      balancedAccountCount: 1,
      unbalancedAccountCount: 0,
      issuedPaise: 50_000,
      remainingPaise: 40_000,
      reservedPaise: 0,
      redeemedPaise: 10_000,
      refundedPaise: 0,
      heldRedemptionPaise: 10_000,
      settlementStatus: 'held',
      settlementEligible: false,
      balanced: true,
      discrepancies: [],
    });
    renderDesk();
    fireEvent.click(await screen.findByRole('button', { name: 'Reconcile cover' }));

    await waitFor(() => {
      expect(api.getEventCoverReconciliation).toHaveBeenCalledWith('EVT-cover-summary');
    });
    expect(await screen.findByText(/All 1 scanned accounts balance/)).toBeInTheDocument();
    expect(screen.getByText(/not Venue payout availability/)).toBeInTheDocument();
    expect(screen.getByText(/Balanced redemption entries held:/)).toBeInTheDocument();
  });
});
