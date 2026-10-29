import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ConnectedEventPromoterManagement } from './ConnectedEventPromoterManagement';

import type {
  PromoterAssignmentCandidateDto,
  PromoterAssignmentDto,
  TicketTierDto,
  EventPromoterAnalyticsDto,
} from '@c1rcle/contracts';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  revoke: vi.fn(),
  listAttributedOrders: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('@/lib/partner/promoter-assignment-repository', () => ({
  createEventPromoterAssignment: mocks.create,
  listEventPromoterAttributedOrders: mocks.listAttributedOrders,
  revokeEventPromoterAssignment: mocks.revoke,
}));

const connection: PromoterAssignmentCandidateDto = {
  id: 'org_promoter_1',
  name: 'Approved Promoter',
  slug: 'approved-promoter',
};

const tier = {
  id: 'tier_1',
  name: 'General',
  accessType: 'ENTRY',
  commissionEligible: true,
} as TicketTierDto;
const performance: EventPromoterAnalyticsDto = {
  eventId: 'event_1',
  complete: true,
  capturedTicketCount: 4,
  attributedTicketCount: 2,
  attributedTicketValuePaise: 45_000,
  recordedCommissionPaise: 4_500,
  netAttributedValuePaise: 40_500,
  commissionPayableBalancePaise: 4_000,
  liabilityComplete: true,
  liabilityReadModel: 'legacy_ledger_v1',
  items: [
    {
      promoterOrganizationId: connection.id,
      attributedOrderCount: 1,
      attributedTicketCount: 2,
      attributedTicketValuePaise: 45_000,
      recordedCommissionPaise: 4_500,
      netAttributedValuePaise: 40_500,
      commissionPayableBalancePaise: 4_000,
      liabilityComplete: true,
      liabilityReadModel: 'legacy_ledger_v1',
    },
  ],
};

describe('ConnectedEventPromoterManagement', () => {
  beforeEach(() => {
    mocks.create.mockReset().mockResolvedValue({});
    mocks.revoke.mockReset().mockResolvedValue({});
    mocks.listAttributedOrders.mockReset();
    mocks.refresh.mockReset();
  });

  it('sends organizer-authored terms and eligible tiers to the backend', async () => {
    render(
      <ConnectedEventPromoterManagement
        eventId="event_1"
        connections={[connection]}
        assignments={[]}
        links={[]}
        tiers={[tier]}
        performance={performance}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    await waitFor(() => {
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event_1',
          promoterId: 'org_promoter_1',
          ratePercent: 10,
          flatPaise: 0,
          eligibleTierIds: ['tier_1'],
        }),
      );
    });
  });

  it('allows an RSVP-only performance campaign with zero commission and no paid tiers', async () => {
    const rsvpTier = {
      id: 'tier_rsvp',
      name: 'Free RSVP',
      accessType: 'RSVP',
      commissionEligible: false,
    } as TicketTierDto;
    render(
      <ConnectedEventPromoterManagement
        eventId="event_free"
        connections={[connection]}
        assignments={[]}
        links={[]}
        tiers={[rsvpTier]}
        performance={performance}
      />,
    );

    expect(screen.getByText(/RSVP-only event.*zero commission/i)).toBeTruthy();
    expect(screen.getByLabelText('Commission rate (%)')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Send invitation' }));

    await waitFor(() => {
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'event_free',
          promoterId: connection.id,
          ratePercent: 0,
          flatPaise: 0,
          eligibleTierIds: [],
        }),
      );
    });
  });

  it('requires and sends an organizer reason when revoking an assignment', async () => {
    const assignment = {
      id: 'assignment_1',
      promoterId: connection.id,
      eventId: 'event_1',
      status: 'active',
      version: 3,
      terms: { ratePercent: 10, flatPaise: 0 },
      startsAt: null,
      expiresAt: null,
    } as unknown as PromoterAssignmentDto;
    render(
      <ConnectedEventPromoterManagement
        eventId="event_1"
        connections={[connection]}
        assignments={[assignment]}
        links={[]}
        tiers={[tier]}
        performance={performance}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    fireEvent.change(screen.getByLabelText('Reason for revoking future promotion'), {
      target: { value: 'Campaign no longer authorized' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm revoke' }));

    await waitFor(() => {
      expect(mocks.revoke).toHaveBeenCalledWith({
        assignmentId: 'assignment_1',
        expectedVersion: 3,
        reason: 'Campaign no longer authorized',
      });
    });
  });

  it('loads privacy-minimized attributed orders by event and paginates with the next offset', async () => {
    const assignment = {
      id: 'assignment_1',
      promoterId: connection.id,
      eventId: 'event_1',
      status: 'active',
      version: 3,
      terms: { ratePercent: 10, flatPaise: 0 },
      startsAt: null,
      expiresAt: null,
    } as unknown as PromoterAssignmentDto;
    const order = (id: string, bookingReference: string) => ({
      id,
      bookingReference,
      eventId: 'event_1',
      status: 'paid',
      ticketCount: 2,
      attributedTicketValuePaise: 45_000,
      promoterCommissionPaise: 4_500,
      attributedAt: '2026-10-28T12:00:00.000Z',
    });
    mocks.listAttributedOrders
      .mockResolvedValueOnce({
        items: [order('order_1', 'C1-001')],
        pageInfo: { page: 1, pageSize: 20, total: 21, hasNextPage: true },
      })
      .mockResolvedValueOnce({
        items: [order('order_2', 'C1-002')],
        pageInfo: { page: 2, pageSize: 20, total: 21, hasNextPage: false },
      });

    render(
      <ConnectedEventPromoterManagement
        eventId="event_1"
        connections={[connection]}
        assignments={[assignment]}
        links={[]}
        tiers={[tier]}
        performance={performance}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'View attributed orders' }));
    expect(await screen.findByText('C1-001')).toBeTruthy();
    expect(mocks.listAttributedOrders).toHaveBeenNthCalledWith(1, {
      eventId: 'event_1',
      promoterId: connection.id,
      cursor: undefined,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('C1-002')).toBeTruthy();
    expect(mocks.listAttributedOrders).toHaveBeenNthCalledWith(2, {
      eventId: 'event_1',
      promoterId: connection.id,
      cursor: '20',
    });
    expect(screen.queryByText(/Guest email|payment ID/i)).toBeNull();
  });

  it('renders backend-derived performance with refund and liability qualifications', () => {
    render(
      <ConnectedEventPromoterManagement
        eventId="event_1"
        connections={[connection]}
        assignments={[]}
        links={[]}
        tiers={[tier]}
        performance={performance}
      />,
    );

    expect(screen.getByText('Tickets sold overall')).toBeTruthy();
    expect(screen.getByText('Promoter-attributed tickets')).toBeTruthy();
    expect(screen.getByText('Commission liability')).toBeTruthy();
    expect(screen.getByText(/before refund adjustments/i)).toBeTruthy();
    expect(screen.getByText(/not evidence of causal sales lift/i)).toBeTruthy();
  });
});
