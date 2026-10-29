import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TicketsDesk from '@/app/tickets/page';

import type * as AdminApi from '@/lib/admin/admin-api';

vi.mock('@/lib/admin/admin-api', async (importOriginal) => {
  const actual = await importOriginal<typeof AdminApi>();
  return {
    ...actual,
    exportTicketsCsv: vi.fn(),
    createComplimentaryAllocation: vi.fn(),
    issueComplimentaryClaim: vi.fn(),
    listComplimentaryAllocations: vi.fn(),
    revokeComplimentaryClaim: vi.fn(),
    offerNextWaitlistedGuest: vi.fn(),
    freezeTicketTransfer: vi.fn(),
    listTickets: vi.fn(),
    listTicketTransferHistory: vi.fn(),
    listWaitlistForAdmin: vi.fn(),
    getTicketCoverReconciliation: vi.fn(),
    listTicketEventChangeRefundReviews: vi.fn(),
    reverseTicketCoverRedemption: vi.fn(),
    releaseFrozenTicketTransfer: vi.fn(),
  };
});

const api = await import('@/lib/admin/admin-api');

function renderDesk() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TicketsDesk />
    </QueryClientProvider>,
  );
}

describe('TicketsDesk transfer recovery controls', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.listTickets).mockResolvedValue({
      items: [],
      pageInfo: { page: 1, pageSize: 100, total: 0, hasNextPage: false },
    });
  });

  it('requires a transfer ID and audit reason, then freezes through the server API', async () => {
    vi.mocked(api.freezeTicketTransfer).mockResolvedValue({
      id: 'TRF-support-1',
      entitlementId: 'ENT-1',
      eventId: 'EVT-1',
      status: 'frozen',
      resolvedAt: '2026-10-28T12:00:00.000Z',
    });
    renderDesk();

    const freeze = screen.getByRole('button', { name: 'Freeze transfer' });
    expect(freeze).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Ticket transfer ID'), {
      target: { value: 'TRF-support-1' },
    });
    fireEvent.change(screen.getByLabelText('Audit reason'), {
      target: { value: 'Suspected invitation misuse' },
    });
    fireEvent.click(freeze);

    await waitFor(() => {
      expect(api.freezeTicketTransfer).toHaveBeenCalledWith(
        'TRF-support-1',
        'Suspected invitation misuse',
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Transfer TRF-support-1 is frozen.',
    );
  });

  it('releases only through the reasoned recovery endpoint', async () => {
    vi.mocked(api.releaseFrozenTicketTransfer).mockResolvedValue({
      id: 'TRF-support-1',
      entitlementId: 'ENT-1',
      eventId: 'EVT-1',
      status: 'frozen',
      lockReleased: true,
    });
    renderDesk();
    fireEvent.change(screen.getByLabelText('Ticket transfer ID'), {
      target: { value: 'TRF-support-1' },
    });
    fireEvent.change(screen.getByLabelText('Audit reason'), {
      target: { value: 'Review confirmed this was an error' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Release frozen lock' }));

    await waitFor(() => {
      expect(api.releaseFrozenTicketTransfer).toHaveBeenCalledWith(
        'TRF-support-1',
        'Review confirmed this was an error',
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent('frozen history is preserved');
  });

  it('searches redacted ticket transfer history and selects the transfer for review', async () => {
    vi.mocked(api.listTicketTransferHistory).mockResolvedValue([
      {
        id: 'TRF-history-1',
        entitlementId: 'ENT-history-1',
        eventId: 'EVT-1',
        recipientBinding: 'verified_email',
        status: 'pending',
        expiresAt: '2026-10-28T13:00:00.000Z',
        createdAt: '2026-10-28T12:00:00.000Z',
        resolvedAt: null,
      },
    ]);
    renderDesk();

    fireEvent.change(screen.getByLabelText('Search transfer history by ticket ID'), {
      target: { value: 'ENT-history-1' },
    });

    expect(await screen.findByText(/TRF-history-1/)).toBeInTheDocument();
    expect(api.listTicketTransferHistory).toHaveBeenCalledWith('ENT-history-1');
    fireEvent.click(screen.getByRole('button', { name: 'Use transfer TRF-history-1' }));
    expect(screen.getByLabelText('Ticket transfer ID')).toHaveValue('TRF-history-1');
  });

  it('shows cover ledger facts without implying Venue payout availability', async () => {
    vi.mocked(api.listTicketTransferHistory).mockResolvedValue([]);
    vi.mocked(api.getTicketCoverReconciliation).mockResolvedValue({
      currency: 'INR',
      status: 'active',
      policyVersion: 'fixture-policy-v1',
      issuedPaise: 150_000,
      remainingPaise: 90_000,
      reservedPaise: 0,
      redeemedPaise: 60_000,
      refundedPaise: 0,
      settlementStatus: 'held',
      settlementEligible: false,
      heldRedemptionPaise: 60_000,
      reversalEnabled: true,
      reversibleCaptureEntryIds: ['ECE-capture-1'],
      entryCount: 3,
      balanced: true,
      expectedRemainingPaise: 90_000,
      expectedReservedPaise: 0,
      expectedRedeemedPaise: 60_000,
      expectedRefundedPaise: 0,
      actualRefundedPaise: 0,
      discrepancies: [],
    });
    vi.mocked(api.reverseTicketCoverRedemption).mockResolvedValue({
      accountId: 'ECA-cover-1',
      entitlementId: 'ENT-cover-1',
      reversalEntryId: 'ECE-reversal-1',
      reversedEntryId: 'ECE-capture-1',
      amountPaise: 60_000,
      remainingPaise: 150_000,
      redeemedPaise: 0,
      settlementStatus: 'held',
      settlementEligible: false,
      replayed: false,
    });
    renderDesk();

    fireEvent.change(screen.getByLabelText('Search transfer history by ticket ID'), {
      target: { value: 'ENT-cover-1' },
    });

    expect(await screen.findByText('Ledger entries: 3')).toBeInTheDocument();
    expect(screen.getByText('Ledger refunded: ₹0')).toBeInTheDocument();
    expect(screen.getByText('Captured redemption held:')).toBeInTheDocument();
    expect(screen.getByText('₹600')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_content, element) =>
          element !== null &&
          element.tagName === 'P' &&
          element.textContent.includes('Settlement: Held · eligible: no'),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Consistent')).toBeInTheDocument();
    expect(api.getTicketCoverReconciliation).toHaveBeenCalledWith('ENT-cover-1');
    expect(screen.getByText(/not a Venue payable calculation/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Required accounting review reason'), {
      target: { value: 'Correct duplicate redemption' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Reverse capture/ }));
    await waitFor(() => {
      expect(api.reverseTicketCoverRedemption).toHaveBeenCalledWith(
        'ENT-cover-1',
        'ECE-capture-1',
        'Correct duplicate redemption',
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/remains held from settlement/i);
  });

  it('shows event change refund review requests without implying approval or refund', async () => {
    vi.mocked(api.listTicketTransferHistory).mockResolvedValue([]);
    vi.mocked(api.getTicketCoverReconciliation).mockRejectedValue(new Error('no cover account'));
    vi.mocked(api.listTicketEventChangeRefundReviews).mockResolvedValue([
      {
        eventVersion: 3,
        response: 'refund_requested',
        respondedAt: '2026-10-28T12:30:00.000Z',
      },
    ]);
    renderDesk();

    fireEvent.change(screen.getByLabelText('Search transfer history by ticket ID'), {
      target: { value: 'ENT-change-1' },
    });

    expect(await screen.findByText('Event version 3')).toBeInTheDocument();
    expect(screen.getByText(/Refund review requested/)).toBeInTheDocument();
    expect(
      screen.getByText(/not approvals and do not create a refund or move money/i),
    ).toBeInTheDocument();
    expect(api.listTicketEventChangeRefundReviews).toHaveBeenCalledWith('ENT-change-1');
  });

  it('creates an allocation, issues to a verified account ID and revokes an unused comp', async () => {
    vi.mocked(api.createComplimentaryAllocation).mockResolvedValue({
      id: 'COMP-ALLOC-1',
      eventId: 'EVT-1',
      organizationId: 'ORG-1',
      tierId: 'TIER-1',
      category: 'artist',
      reason: 'Artist guest list',
      quota: 1,
      claimedCount: 0,
      status: 'active',
      expiresAt: null,
      createdBy: 'ADMIN-1',
      createdAt: '2026-10-28T12:00:00.000Z',
    });
    vi.mocked(api.listComplimentaryAllocations).mockResolvedValue({
      items: [],
      pageInfo: { page: 1, pageSize: 100, total: 0, hasNextPage: false },
    });
    vi.mocked(api.issueComplimentaryClaim).mockResolvedValue({
      allocation: {
        id: 'COMP-ALLOC-1',
        eventId: 'EVT-1',
        organizationId: 'ORG-1',
        tierId: 'TIER-1',
        category: 'artist',
        reason: 'Artist guest list',
        quota: 1,
        claimedCount: 1,
        status: 'active',
        expiresAt: null,
        createdBy: 'ADMIN-1',
        createdAt: '2026-10-28T12:00:00.000Z',
      },
      claim: {
        id: 'COMP-CLAIM-1',
        recipientUserId: 'USER-1',
        holderName: 'Guest Name',
        status: 'issued',
      },
      orderId: 'COMP-ORDER-1',
      entitlements: [{ id: 'ENT-1', unitKind: 'complimentary' }],
    });
    vi.mocked(api.revokeComplimentaryClaim).mockResolvedValue({
      claimId: 'COMP-CLAIM-1',
      claimStatus: 'revoked',
      entitlementId: 'ENT-1',
      entitlementStatus: 'void',
    });
    renderDesk();

    fireEvent.change(screen.getByLabelText('Event ID'), { target: { value: 'EVT-1' } });
    fireEvent.change(screen.getByLabelText('Ticket tier ID'), { target: { value: 'TIER-1' } });
    fireEvent.change(screen.getByLabelText('Comp allocation audit reason'), {
      target: { value: 'Artist guest list' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create allocation' }));
    await waitFor(() => {
      expect(api.createComplimentaryAllocation).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText('Verified account user ID'), {
      target: { value: 'USER-1' },
    });
    fireEvent.change(screen.getByLabelText('Ticket holder name'), {
      target: { value: 'Guest Name' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Issue complimentary ticket' }));
    await waitFor(() => {
      expect(api.issueComplimentaryClaim).toHaveBeenCalledWith({
        allocationId: 'COMP-ALLOC-1',
        recipientUserId: 'USER-1',
        holderName: 'Guest Name',
      });
    });

    fireEvent.change(screen.getByLabelText('Revocation reason'), {
      target: { value: 'Issued in error' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Revoke unused comp' }));
    await waitFor(() => {
      expect(api.revokeComplimentaryClaim).toHaveBeenCalledWith('COMP-CLAIM-1', 'Issued in error');
    });
    expect(await screen.findByRole('status')).toHaveTextContent('unused inventory returned');
  });
});

describe('TicketsDesk waitlist operations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.listTickets).mockResolvedValue({
      items: [],
      pageInfo: { page: 1, pageSize: 100, total: 0, hasNextPage: false },
    });
    vi.mocked(api.listWaitlistForAdmin).mockResolvedValue({
      items: [],
      pageInfo: {
        page: 1,
        pageSize: 100,
        total: 0,
        hasNextPage: false,
        nextCursor: null,
      },
    });
  });

  it('offers the next eligible guest through the authorized server operation', async () => {
    vi.mocked(api.offerNextWaitlistedGuest).mockResolvedValue({
      entry: { id: 'wait_1', status: 'offered', offerExpiresAt: '2099-10-28T15:00:00.000Z' },
      holdId: 'hold_1',
      expiresAt: '2099-10-28T15:00:00.000Z',
      pricing: {
        lines: [],
        subtotalPaise: 10000,
        discountPaise: 0,
        discountedSubtotalPaise: 10000,
        platformFeePaise: 0,
        paymentFeePaise: 0,
        gstPaise: 0,
        grandTotalPaise: 10000,
        appliedPromoCode: null,
        currency: 'INR',
      },
    });
    renderDesk();
    fireEvent.change(screen.getByLabelText('Waitlist event ID'), { target: { value: 'EVT-1' } });
    fireEvent.change(screen.getByLabelText('Waitlist ticket tier ID'), {
      target: { value: 'TIER-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Offer next guest' }));

    await waitFor(() => {
      expect(api.offerNextWaitlistedGuest).toHaveBeenCalledWith('EVT-1', 'TIER-1');
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'A bounded ticket offer was created',
    );
  });

  it('shows FIFO state and offer expiry without guest account identifiers', async () => {
    vi.mocked(api.listWaitlistForAdmin).mockResolvedValue({
      items: [
        {
          id: 'wait_1',
          eventId: 'EVT-1',
          organizationId: 'ORG-1',
          tierId: 'TIER-1',
          sequence: 3,
          status: 'offered',
          offeredAt: '2026-10-28T12:00:00.000Z',
          offerExpiresAt: '2026-10-28T12:10:00.000Z',
          resolvedAt: null,
        },
      ],
      pageInfo: { page: 1, pageSize: 100, total: 1, hasNextPage: false, nextCursor: null },
    });
    renderDesk();
    fireEvent.change(screen.getByLabelText('Waitlist event ID'), { target: { value: 'EVT-1' } });
    fireEvent.change(screen.getByLabelText('Waitlist ticket tier ID'), {
      target: { value: 'TIER-1' },
    });

    expect(await screen.findByText('Queue #3 · offered')).toBeInTheDocument();
    expect(screen.getByText(/Offer expires/)).toBeInTheDocument();
    expect(api.listWaitlistForAdmin).toHaveBeenCalledWith('EVT-1', 'TIER-1', null);
  });
});
