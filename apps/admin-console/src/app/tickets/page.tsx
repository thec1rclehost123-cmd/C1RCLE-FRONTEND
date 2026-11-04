'use client';

import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  exportTicketsCsv,
  createComplimentaryAllocation,
  offerNextWaitlistedGuest,
  issueComplimentaryClaim,
  listComplimentaryAllocations,
  revokeComplimentaryClaim,
  freezeTicketTransfer,
  getTicketCoverReconciliation,
  listTicketEventChangeRefundReviews,
  reverseTicketCoverRedemption,
  listTickets,
  listTicketTransferHistory,
  listWaitlistForAdmin,
  releaseFrozenTicketTransfer,
  statusFilterOptions,
  TICKET_STATUSES,
} from '@/lib/admin/admin-api';
import {
  formatDateTime,
  formatPaise,
  shortId,
  StatusBadge,
  ticketStatusTone,
  TICKET_STATUS_LABELS,
} from '@/lib/admin/format';

import type { TicketStatus } from '@/lib/admin/contract-types';

type Filter = TicketStatus | 'all';

export default function TicketsDesk() {
  const [filter, setFilter] = useState<Filter>('all');
  const [ticketSearchId, setTicketSearchId] = useState('');
  const [transferId, setTransferId] = useState('');
  const [reason, setReason] = useState('');
  const [coverReversalReason, setCoverReversalReason] = useState('');
  const [coverReversalMessage, setCoverReversalMessage] = useState<string | null>(null);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);
  const [compEventId, setCompEventId] = useState('');
  const [compTierId, setCompTierId] = useState('');
  const [compCategory, setCompCategory] = useState<
    'artist' | 'staff' | 'sponsor' | 'press' | 'influencer'
  >('artist');
  const [compReason, setCompReason] = useState('');
  const [compQuota, setCompQuota] = useState('1');
  const [compRecipientId, setCompRecipientId] = useState('');
  const [compHolderName, setCompHolderName] = useState('');
  const [compAllocationId, setCompAllocationId] = useState('');
  const [compClaimId, setCompClaimId] = useState('');
  const [compMessage, setCompMessage] = useState<string | null>(null);
  const [waitlistEventId, setWaitlistEventId] = useState('');
  const [waitlistTierId, setWaitlistTierId] = useState('');
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'tickets', filter],
    queryFn: () => listTickets(100),
    select: (page) =>
      filter === 'all' ? page.items : page.items.filter((ticket) => ticket.status === filter),
  });
  const transferHistory = useQuery({
    queryKey: ['admin', 'ticket-transfer-history', ticketSearchId.trim()],
    queryFn: () => listTicketTransferHistory(ticketSearchId.trim()),
    enabled: ticketSearchId.trim().length >= 3,
  });
  const coverReconciliation = useQuery({
    queryKey: ['admin', 'ticket-cover-reconciliation', ticketSearchId.trim()],
    queryFn: () => getTicketCoverReconciliation(ticketSearchId.trim()),
    enabled: ticketSearchId.trim().length >= 3,
    retry: false,
  });
  const eventChangeRefundReviews = useQuery({
    queryKey: ['admin', 'ticket-event-change-refund-reviews', ticketSearchId.trim()],
    queryFn: () => listTicketEventChangeRefundReviews(ticketSearchId.trim()),
    enabled: ticketSearchId.trim().length >= 3,
    retry: false,
  });
  const compAllocations = useQuery({
    queryKey: ['admin', 'complimentary-allocations', compEventId.trim()],
    queryFn: () => listComplimentaryAllocations(compEventId.trim()),
    enabled: compEventId.trim().length >= 3,
    retry: false,
  });
  const waitlistQueue = useInfiniteQuery({
    queryKey: ['admin', 'waitlist', waitlistEventId.trim(), waitlistTierId.trim()],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      listWaitlistForAdmin(waitlistEventId.trim(), waitlistTierId.trim(), pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.nextCursor : undefined,
    enabled: waitlistEventId.trim().length >= 3 && waitlistTierId.trim().length >= 3,
    retry: false,
  });

  const exportMutation = useMutation({
    mutationFn: () => exportTicketsCsv(),
  });
  const freezeMutation = useMutation({
    mutationFn: () => freezeTicketTransfer(transferId.trim(), reason.trim()),
    onSuccess: (transfer) => {
      setTransferMessage(`Transfer ${transfer.id} is ${transfer.status}.`);
      setReason('');
      void transferHistory.refetch();
    },
  });
  const releaseMutation = useMutation({
    mutationFn: () => releaseFrozenTicketTransfer(transferId.trim(), reason.trim()),
    onSuccess: (transfer) => {
      setTransferMessage(`Transfer ${transfer.id} lock released; frozen history is preserved.`);
      setReason('');
      void transferHistory.refetch();
    },
  });
  const coverReversalMutation = useMutation({
    mutationFn: (captureEntryId: string) =>
      reverseTicketCoverRedemption(
        ticketSearchId.trim(),
        captureEntryId,
        coverReversalReason.trim(),
      ),
    onSuccess: (result) => {
      setCoverReversalMessage(
        `Reversed ${String(result.amountPaise)} paise. The restored cover remains held from settlement.`,
      );
      setCoverReversalReason('');
      void coverReconciliation.refetch();
    },
  });
  const transferBusy = freezeMutation.isPending || releaseMutation.isPending;
  const createCompMutation = useMutation({
    mutationFn: () =>
      createComplimentaryAllocation({
        eventId: compEventId.trim(),
        tierId: compTierId.trim(),
        category: compCategory,
        reason: compReason.trim(),
        quota: Number(compQuota),
      }),
    onSuccess: (allocation) => {
      setCompMessage(`Allocation ${allocation.id} created.`);
      setCompAllocationId(allocation.id);
      setCompReason('');
      void compAllocations.refetch();
    },
  });
  const issueCompMutation = useMutation({
    mutationFn: () =>
      issueComplimentaryClaim({
        allocationId: compAllocationId.trim(),
        recipientUserId: compRecipientId.trim(),
        holderName: compHolderName.trim(),
      }),
    onSuccess: (issued) => {
      setCompClaimId(issued.claim.id);
      setCompMessage(
        `Complimentary ticket ${issued.entitlements[0]?.id ?? ''} issued to ${issued.claim.holderName}. Claim ${issued.claim.id}.`,
      );
      setCompRecipientId('');
      setCompHolderName('');
      void compAllocations.refetch();
    },
  });
  const revokeCompMutation = useMutation({
    mutationFn: () => revokeComplimentaryClaim(compClaimId.trim(), compReason.trim()),
    onSuccess: (revoked) => {
      setCompMessage(`Comp claim ${revoked.claimId} revoked; unused inventory returned.`);
      setCompClaimId('');
      setCompReason('');
      void compAllocations.refetch();
    },
  });
  const offerWaitlistMutation = useMutation({
    mutationFn: () => offerNextWaitlistedGuest(waitlistEventId.trim(), waitlistTierId.trim()),
    onSuccess: (result) => {
      setWaitlistMessage(
        'entry' in result
          ? `A bounded ticket offer was created through ${new Date(result.expiresAt).toLocaleString()}.`
          : 'No eligible guest is waiting for this ticket tier.',
      );
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Tickets"
          description="Platform-wide ticket ledger and audited transfer recovery controls. The entitlement a guest presents at the door — distinct from a support ticket."
        />
        <div className="flex items-center gap-2">
          <StatusFilter
            id="ticket-status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              ...statusFilterOptions(TICKET_STATUS_LABELS, TICKET_STATUSES),
            ]}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={exportMutation.isPending}
            onClick={() => {
              exportMutation.mutate();
            }}
            aria-busy={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Exporting…' : 'Export CSV'}
          </Button>
        </div>
      </div>

      <section className="grid gap-4 rounded-lg border border-border p-4">
        <div>
          <h2 className="font-medium">Controlled complimentary allocations</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a named quota and issue only to a verified account. Each issued comp reserves
            admission inventory and records zero revenue; it does not create a payment or promoter
            commission.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm">
            Event ID
            <input
              value={compEventId}
              onChange={(e) => {
                setCompEventId(e.target.value);
              }}
              className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Ticket tier ID
            <input
              value={compTierId}
              onChange={(e) => {
                setCompTierId(e.target.value);
              }}
              className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Allocation category
            <select
              value={compCategory}
              onChange={(e) => {
                setCompCategory(e.target.value as typeof compCategory);
              }}
              className="min-h-10 rounded-md border border-input bg-background px-3"
            >
              <option value="artist">Artist</option>
              <option value="staff">Staff</option>
              <option value="sponsor">Sponsor</option>
              <option value="press">Press</option>
              <option value="influencer">Influencer</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm">
            Quota
            <input
              type="number"
              min="1"
              max="10000"
              value={compQuota}
              onChange={(e) => {
                setCompQuota(e.target.value);
              }}
              className="min-h-10 rounded-md border border-input bg-background px-3"
            />
          </label>
          <label className="grid gap-2 text-sm sm:col-span-2">
            Comp allocation audit reason
            <input
              value={compReason}
              onChange={(e) => {
                setCompReason(e.target.value);
              }}
              minLength={5}
              maxLength={500}
              className="min-h-10 rounded-md border border-input bg-background px-3"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={
              createCompMutation.isPending ||
              compEventId.trim().length < 3 ||
              compTierId.trim().length < 3 ||
              compReason.trim().length < 5 ||
              Number(compQuota) < 1
            }
            onClick={() => {
              setCompMessage(null);
              createCompMutation.mutate();
            }}
          >
            {createCompMutation.isPending ? 'Creating…' : 'Create allocation'}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="grid gap-2 text-sm">
            Complimentary claim ID
            <input
              value={compClaimId}
              onChange={(e) => {
                setCompClaimId(e.target.value);
              }}
              className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Revocation reason
            <input
              value={compReason}
              onChange={(e) => {
                setCompReason(e.target.value);
              }}
              minLength={5}
              maxLength={500}
              className="min-h-10 rounded-md border border-input bg-background px-3"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={
              revokeCompMutation.isPending ||
              compClaimId.trim().length < 3 ||
              compReason.trim().length < 5
            }
            onClick={() => {
              setCompMessage(null);
              revokeCompMutation.mutate();
            }}
          >
            {revokeCompMutation.isPending ? 'Revoking…' : 'Revoke unused comp'}
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-2 text-sm">
            Allocation ID
            <input
              value={compAllocationId}
              onChange={(e) => {
                setCompAllocationId(e.target.value);
              }}
              className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Verified account user ID
            <input
              value={compRecipientId}
              onChange={(e) => {
                setCompRecipientId(e.target.value);
              }}
              className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Ticket holder name
            <input
              value={compHolderName}
              onChange={(e) => {
                setCompHolderName(e.target.value);
              }}
              maxLength={120}
              className="min-h-10 rounded-md border border-input bg-background px-3"
            />
          </label>
          <Button
            type="button"
            variant="outline"
            disabled={
              issueCompMutation.isPending ||
              compAllocationId.trim().length < 3 ||
              compRecipientId.trim().length < 3 ||
              compHolderName.trim().length < 1
            }
            onClick={() => {
              setCompMessage(null);
              issueCompMutation.mutate();
            }}
          >
            {issueCompMutation.isPending ? 'Issuing…' : 'Issue complimentary ticket'}
          </Button>
        </div>
        {compMessage ? (
          <p role="status" className="text-sm">
            {compMessage}
          </p>
        ) : null}
        {createCompMutation.isError || issueCompMutation.isError || revokeCompMutation.isError ? (
          <p role="alert" className="text-sm text-destructive">
            The allocation action was not completed. Check Admin authority, event/tier inventory,
            recipient verification and allocation quota, then retry.
          </p>
        ) : null}
        {compEventId.trim().length >= 3 ? (
          compAllocations.isPending ? (
            <LoadingState label="Loading comp allocations…" />
          ) : compAllocations.isError ? (
            <p className="text-sm text-muted-foreground">
              Allocation list unavailable for this event or account.
            </p>
          ) : (
            <ul className="grid gap-2">
              {compAllocations.data.items.map((allocation) => (
                <li
                  key={allocation.id}
                  className="flex flex-wrap justify-between gap-2 rounded-md border border-border p-3 text-sm"
                >
                  <span>
                    <strong className="capitalize">{allocation.category}</strong> ·{' '}
                    {allocation.claimedCount}/{allocation.quota} claimed · {allocation.status}
                  </span>
                  <span className="font-mono text-xs">{allocation.id}</span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>

      <section className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="sm:col-span-3">
          <h2 className="font-medium">Offer the next waitlisted ticket</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The server checks access and eligibility, then reserves inventory for a short window. No
            payment is started until the guest continues checkout.
          </p>
        </div>
        <label className="grid gap-2 text-sm">
          Waitlist event ID
          <input
            value={waitlistEventId}
            onChange={(event) => {
              setWaitlistEventId(event.target.value);
            }}
            className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Waitlist ticket tier ID
          <input
            value={waitlistTierId}
            onChange={(event) => {
              setWaitlistTierId(event.target.value);
            }}
            className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={
            offerWaitlistMutation.isPending ||
            waitlistEventId.trim().length < 3 ||
            waitlistTierId.trim().length < 3
          }
          onClick={() => {
            setWaitlistMessage(null);
            offerWaitlistMutation.mutate();
          }}
        >
          {offerWaitlistMutation.isPending ? 'Creating offer…' : 'Offer next guest'}
        </Button>
        {waitlistMessage ? (
          <p role="status" className="sm:col-span-3 text-sm">
            {waitlistMessage}
          </p>
        ) : null}
        {offerWaitlistMutation.isError ? (
          <p role="alert" className="sm:col-span-3 text-sm text-destructive">
            Offer not created. Check Admin authority, tier availability, and waitlist eligibility
            before retrying.
          </p>
        ) : null}
        {waitlistQueue.isFetching ? (
          <p className="sm:col-span-3 text-xs text-muted-foreground">Loading queue…</p>
        ) : waitlistQueue.isError ? (
          <p className="sm:col-span-3 text-xs text-muted-foreground">
            Queue unavailable for this event, tier, or Admin account.
          </p>
        ) : waitlistQueue.data ? (
          <div className="sm:col-span-3 grid gap-2">
            <h3 className="text-sm font-medium">
              Waitlist queue · {waitlistQueue.data.pages[0]?.pageInfo.total ?? 0} entries
            </h3>
            {waitlistQueue.data.pages.flatMap((page) => page.items).length === 0 ? (
              <p className="text-xs text-muted-foreground">No waitlist entries for this tier.</p>
            ) : (
              <ol className="grid gap-2">
                {waitlistQueue.data.pages
                  .flatMap((page) => page.items)
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap justify-between gap-2 rounded-md border border-border p-3 text-xs"
                    >
                      <span>
                        Queue #{entry.sequence} · {entry.status}
                      </span>
                      <span className="font-mono">{entry.id}</span>
                      {entry.offerExpiresAt ? (
                        <span>Offer expires {new Date(entry.offerExpiresAt).toLocaleString()}</span>
                      ) : null}
                    </li>
                  ))}
              </ol>
            )}
            {waitlistQueue.hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={waitlistQueue.isFetchingNextPage}
                onClick={() => void waitlistQueue.fetchNextPage()}
              >
                {waitlistQueue.isFetchingNextPage ? 'Loading more…' : 'Load more waitlist entries'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <label className="grid gap-2 text-sm">
          Ticket transfer ID
          <input
            value={transferId}
            onChange={(event) => {
              setTransferId(event.target.value);
            }}
            autoComplete="off"
            className="min-h-10 rounded-md border border-input bg-background px-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          Audit reason
          <input
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
            minLength={5}
            maxLength={500}
            className="min-h-10 rounded-md border border-input bg-background px-3"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={transferBusy || transferId.trim().length < 3 || reason.trim().length < 5}
          onClick={() => {
            setTransferMessage(null);
            freezeMutation.mutate();
          }}
        >
          {freezeMutation.isPending ? 'Freezing…' : 'Freeze transfer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={transferBusy || transferId.trim().length < 3 || reason.trim().length < 5}
          onClick={() => {
            setTransferMessage(null);
            releaseMutation.mutate();
          }}
        >
          {releaseMutation.isPending ? 'Releasing…' : 'Release frozen lock'}
        </Button>
        <p className="text-xs text-muted-foreground sm:col-span-4">
          Freeze blocks a pending transfer without changing its holder or credential. Release is
          audited and succeeds only while the entitlement remains unused, valid and unlocked for
          refund. Server permissions and ticket-state checks remain authoritative.
        </p>
      </section>
      <section className="grid gap-3 rounded-lg border border-border p-4">
        <h2 className="font-medium">Event change refund review requests</h2>
        <p className="text-xs text-muted-foreground">
          Purchaser responses for material event changes. These requests are not approvals and do
          not create a refund or move money.
        </p>
        {ticketSearchId.trim().length < 3 ? (
          <p className="text-sm text-muted-foreground">
            Enter a ticket ID above to inspect event change responses.
          </p>
        ) : eventChangeRefundReviews.isPending ? (
          <LoadingState label="Loading event change responses…" />
        ) : eventChangeRefundReviews.isError ? (
          <ErrorState
            description="Event change responses could not be loaded. Please retry."
            onRetry={() => void eventChangeRefundReviews.refetch()}
          />
        ) : eventChangeRefundReviews.data.length === 0 ? (
          <EmptyState
            title="No refund review requests"
            description="No purchaser refund review requests were found for this ticket."
          />
        ) : (
          <ul className="grid gap-2">
            {eventChangeRefundReviews.data.map((request) => (
              <li
                key={request.eventVersion}
                className="rounded-md border border-border p-3 text-sm"
              >
                <p className="font-medium">Event version {request.eventVersion}</p>
                <p className="text-muted-foreground">
                  Refund review requested · {formatDateTime(request.respondedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-3 rounded-lg border border-border p-4">
        <label className="grid gap-2 text-sm sm:max-w-xl">
          Search transfer history by ticket ID
          <input
            value={ticketSearchId}
            onChange={(event) => {
              setTicketSearchId(event.target.value);
            }}
            autoComplete="off"
            className="min-h-10 rounded-md border border-input bg-background px-3 font-mono text-xs"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Results are limited to this ticket and omit recipient identity and invitation secrets.
        </p>
        {ticketSearchId.trim().length < 3 ? null : transferHistory.isPending ? (
          <LoadingState label="Loading transfer history…" />
        ) : transferHistory.isError ? (
          <ErrorState
            description="Transfer history could not be loaded. Please retry."
            onRetry={() => void transferHistory.refetch()}
          />
        ) : transferHistory.data.length === 0 ? (
          <EmptyState
            title="No transfer history"
            description="No transfers were found for this ticket."
          />
        ) : (
          <ul className="grid gap-2">
            {transferHistory.data.map((transfer) => (
              <li
                key={transfer.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-mono text-xs">{transfer.id}</p>
                  <p className="text-muted-foreground">
                    {transfer.status} · {transfer.recipientBinding.replace('_', ' ')} · expires{' '}
                    {formatDateTime(transfer.expiresAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Use transfer ${transfer.id}`}
                  onClick={() => {
                    setTransferId(transfer.id);
                    setTransferMessage(null);
                  }}
                >
                  Select
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-3 rounded-lg border border-border p-4">
        <h2 className="font-medium">Event cover ledger</h2>
        <p className="text-xs text-muted-foreground">
          Read-only account and entry comparison. Captured redemption stays held and is never marked
          settlement-eligible here; this is not a Venue payable calculation.
        </p>
        {ticketSearchId.trim().length < 3 ? (
          <p className="text-sm text-muted-foreground">
            Enter a ticket ID above to inspect its cover account.
          </p>
        ) : coverReconciliation.isPending ? (
          <LoadingState label="Reconciling cover entries…" />
        ) : coverReconciliation.isError ? (
          <ErrorState
            description="No cover account was found or its ledger could not be reconciled."
            onRetry={() => void coverReconciliation.refetch()}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <p>
              Account status: <strong>{coverReconciliation.data.status.replace('_', ' ')}</strong>
            </p>
            <p>
              Account entry totals:{' '}
              <strong>
                {coverReconciliation.data.balanced ? 'Consistent' : 'Discrepancy found'}
              </strong>
            </p>
            <p>
              Policy version:{' '}
              <span className="font-mono text-xs">{coverReconciliation.data.policyVersion}</span>
            </p>
            <p>Issued: {formatPaise(coverReconciliation.data.issuedPaise)}</p>
            <p>Remaining: {formatPaise(coverReconciliation.data.remainingPaise)}</p>
            <p>Reserved: {formatPaise(coverReconciliation.data.reservedPaise)}</p>
            <p>Redeemed: {formatPaise(coverReconciliation.data.redeemedPaise)}</p>
            <p>
              Captured redemption held:{' '}
              <strong>
                {coverReconciliation.data.heldRedemptionPaise === null
                  ? 'Unavailable until ledger reconciles'
                  : formatPaise(coverReconciliation.data.heldRedemptionPaise)}
              </strong>
            </p>
            <p>
              Settlement: <strong>Held</strong> · eligible: <strong>no</strong>
            </p>
            <p>Refunded: {formatPaise(coverReconciliation.data.refundedPaise)}</p>
            <p>Ledger refunded: {formatPaise(coverReconciliation.data.expectedRefundedPaise)}</p>
            <p>Ledger entries: {coverReconciliation.data.entryCount}</p>
            {coverReconciliation.data.reversalEnabled &&
            coverReconciliation.data.reversibleCaptureEntryIds.length > 0 ? (
              <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                <p className="text-sm font-medium">Reverse a captured redemption</p>
                <label className="grid gap-2 text-sm sm:max-w-xl">
                  Required accounting review reason
                  <input
                    value={coverReversalReason}
                    onChange={(event) => {
                      setCoverReversalReason(event.target.value);
                    }}
                    minLength={8}
                    maxLength={500}
                    className="min-h-10 rounded-md border border-input bg-background px-3"
                  />
                </label>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {coverReconciliation.data.reversibleCaptureEntryIds.map((captureEntryId) => (
                    <li key={captureEntryId}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          coverReversalMutation.isPending || coverReversalReason.trim().length < 8
                        }
                        onClick={() => {
                          setCoverReversalMessage(null);
                          coverReversalMutation.mutate(captureEntryId);
                        }}
                      >
                        {coverReversalMutation.isPending
                          ? 'Reversing…'
                          : `Reverse capture ${shortId(captureEntryId)}`}
                      </Button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Reversal requires finance, operations, admin, or super authority and server-side
                  cover accounting approval. The correction does not authorize settlement.
                </p>
                {coverReversalMessage ? <p role="status">{coverReversalMessage}</p> : null}
                {coverReversalMutation.isError ? (
                  <p role="alert">
                    Reversal was not completed. Confirm the accounting approval, reason, and current
                    ledger state, then retry.
                  </p>
                ) : null}
              </div>
            ) : null}
            {!coverReconciliation.data.balanced ? (
              <ul className="grid gap-1 text-sm text-destructive sm:col-span-2 lg:col-span-3">
                {coverReconciliation.data.discrepancies.map((issue, index) => (
                  <li key={`${index.toString()}-${issue}`}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </section>
      {transferMessage ? <p role="status">{transferMessage}</p> : null}
      {freezeMutation.isError || releaseMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          Transfer action was not completed. Check the transfer ID, your permission and the current
          ticket state, then retry.
        </p>
      ) : null}

      {list.isPending ? (
        <LoadingState label="Loading tickets…" />
      ) : list.isError ? (
        <ErrorState
          description="Tickets could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.length === 0 ? (
        <EmptyState title="No tickets" description="Nothing matches this filter." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Ticket
                </th>
                <th scope="col" className="px-4 py-3">
                  Holder
                </th>
                <th scope="col" className="px-4 py-3">
                  Tier
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Scans
                </th>
                <th scope="col" className="px-4 py-3">
                  Last scanned
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Issued
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(ticket.id)}
                    <p className="font-sans text-xs">
                      {shortId(ticket.orderId)} order · {shortId(ticket.eventId)} event
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{ticket.holderName}</p>
                  </td>
                  <td className="px-4 py-3">{ticket.tierName}</td>
                  <td className="px-4 py-3 text-right">
                    {ticket.scanCount}/{ticket.scanCountAllowed}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.lastScannedAt !== null ? formatDateTime(ticket.lastScannedAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={TICKET_STATUS_LABELS[ticket.status]}
                      tone={ticketStatusTone(ticket.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(ticket.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exportMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The CSV could not be generated. Please retry.
        </p>
      ) : null}
    </div>
  );
}
