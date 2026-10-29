'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import {
  exportPromotersCsv,
  deactivatePromoterReferralLink,
  listAudit,
  listPromoterAssignments,
  listPromoterReferralLinks,
  listPromoterRiskFlags,
  reinstatePromoter,
  suspendPromoter,
} from '@/lib/admin/admin-api';
import {
  AUDIT_ACTION_LABELS,
  auditActionTone,
  formatDateTime,
  formatEpochMs,
  formatPaise,
  promoterAssignmentStatusTone,
  PROMOTER_ASSIGNMENT_STATUS_LABELS,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

interface PromoterAction {
  readonly promoterId: string;
  readonly action: 'suspend' | 'reinstate';
}

export default function PromotersDesk() {
  const queryClient = useQueryClient();
  const [promoterAction, setPromoterAction] = useState<PromoterAction | null>(null);
  const [reason, setReason] = useState('');
  const [auditTargetId, setAuditTargetId] = useState<string | null>(null);
  const [linkAction, setLinkAction] = useState<{ linkId: string; reason: string } | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'promoters'],
    queryFn: () => listPromoterAssignments(100),
  });

  const audit = useQuery({
    queryKey: ['admin', 'promoters', 'audit', auditTargetId],
    queryFn: () => listAudit(50, auditTargetId ?? undefined),
    enabled: auditTargetId !== null,
  });

  const referralLinks = useQuery({
    queryKey: ['admin', 'promoters', 'referral-links', auditTargetId],
    queryFn: () => listPromoterReferralLinks(auditTargetId ?? '', 50),
    enabled: auditTargetId !== null,
  });

  const riskFlags = useQuery({
    queryKey: ['admin', 'promoters', 'risk-flags', auditTargetId],
    queryFn: () => listPromoterRiskFlags(auditTargetId ?? ''),
    enabled: auditTargetId !== null,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'promoters'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const finishAction = () => {
    setPromoterAction(null);
    setReason('');
    invalidate();
  };

  const suspendMutation = useMutation({
    mutationFn: (input: { promoterId: string; reason: string }) =>
      suspendPromoter(input.promoterId, input.reason),
    onSuccess: () => {
      finishAction();
    },
  });

  const reinstateMutation = useMutation({
    mutationFn: (input: { promoterId: string; reason: string }) =>
      reinstatePromoter(input.promoterId, input.reason),
    onSuccess: finishAction,
  });

  const deactivateLinkMutation = useMutation({
    mutationFn: (input: { linkId: string; reason: string }) =>
      deactivatePromoterReferralLink(input.linkId, input.reason),
    onSuccess: () => {
      setLinkAction(null);
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'promoters', 'referral-links', auditTargetId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'promoters', 'audit', auditTargetId],
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => exportPromotersCsv(),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Promoters"
          description="Platform-wide promoter assignments, across every event. V2 has no standalone promoter entity — a promoter is an organization member with a versioned commission assignment per event. Suspending a promoter bulk-transitions all of their assignments — a Tier-2 command, idempotent (a repeat suspend is a no-op)."
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

      {list.isPending ? (
        <LoadingState label="Loading promoter assignments…" />
      ) : list.isError ? (
        <ErrorState
          description="Promoter assignments could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState title="No promoter assignments" description="Nothing has been assigned yet." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Promoter
                </th>
                <th scope="col" className="px-4 py-3">
                  Event
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Rate
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Flat fee
                </th>
                <th scope="col" className="px-4 py-3">
                  Frozen campaign terms
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Assigned
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(assignment.promoterId)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {shortId(assignment.eventId)}
                  </td>
                  <td className="px-4 py-3 text-right">{assignment.ratePercent}%</td>
                  <td className="px-4 py-3 text-right">
                    {assignment.flatPaise > 0 ? formatPaise(assignment.flatPaise) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>Terms v{assignment.termsVersion}</p>
                    <p>
                      {assignment.eligibleTierIds === null
                        ? 'All eligible tiers'
                        : `${String(assignment.eligibleTierIds.length)} eligible tier(s)`}
                    </p>
                    <p>
                      {assignment.startsAt === null
                        ? 'No start limit'
                        : formatDateTime(assignment.startsAt)}
                      {' — '}
                      {assignment.expiresAt === null
                        ? 'No expiry'
                        : formatDateTime(assignment.expiresAt)}
                    </p>
                    {assignment.acceptedAt ? (
                      <p>Accepted {formatDateTime(assignment.acceptedAt)}</p>
                    ) : null}
                    {assignment.revocationReason ? (
                      <p>Revocation reason: {assignment.revocationReason}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={PROMOTER_ASSIGNMENT_STATUS_LABELS[assignment.status]}
                      tone={promoterAssignmentStatusTone(assignment.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(assignment.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {['active', 'suspended'].includes(assignment.status) ? (
                      <div className="flex justify-end">
                        {promoterAction?.promoterId === assignment.promoterId ? (
                          <div className="flex flex-col items-end gap-2">
                            <label className="grid gap-1 text-left text-xs">
                              {promoterAction.action === 'suspend'
                                ? 'Reason for suspension'
                                : 'Reason for reinstatement'}
                              <input
                                required
                                minLength={3}
                                maxLength={500}
                                value={reason}
                                onChange={(event) => {
                                  setReason(event.target.value);
                                }}
                                className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                              />
                            </label>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={suspendMutation.isPending || reinstateMutation.isPending}
                                onClick={() => {
                                  setPromoterAction(null);
                                  setReason('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  promoterAction.action === 'suspend' ? 'destructive' : 'outline'
                                }
                                disabled={
                                  reason.trim().length < 3 ||
                                  suspendMutation.isPending ||
                                  reinstateMutation.isPending
                                }
                                onClick={() => {
                                  const input = {
                                    promoterId: assignment.promoterId,
                                    reason: reason.trim(),
                                  };
                                  if (promoterAction.action === 'suspend')
                                    suspendMutation.mutate(input);
                                  else reinstateMutation.mutate(input);
                                }}
                                aria-busy={suspendMutation.isPending || reinstateMutation.isPending}
                              >
                                {suspendMutation.isPending
                                  ? 'Suspending…'
                                  : reinstateMutation.isPending
                                    ? 'Reinstating…'
                                    : `Confirm ${promoterAction.action}`}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant={assignment.status === 'active' ? 'ghost' : 'outline'}
                            onClick={() => {
                              setReason('');
                              setPromoterAction({
                                promoterId: assignment.promoterId,
                                action: assignment.status === 'active' ? 'suspend' : 'reinstate',
                              });
                            }}
                          >
                            {assignment.status === 'active' ? 'Suspend' : 'Reinstate'}
                          </Button>
                        )}
                      </div>
                    ) : null}
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        aria-label={`View audit history for ${shortId(assignment.promoterId)}`}
                        onClick={() => {
                          setAuditTargetId(assignment.promoterId);
                        }}
                      >
                        View history
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {auditTargetId !== null ? (
        <section
          aria-labelledby="promoter-audit-heading"
          className="flex flex-col gap-3 rounded-lg border border-border p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="promoter-audit-heading" className="font-semibold">
                Promoter audit history
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                Target {shortId(auditTargetId)} · latest 50 records
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setAuditTargetId(null);
              }}
            >
              Close history
            </Button>
          </div>

          {audit.isPending ? (
            <LoadingState label="Loading promoter audit history…" />
          ) : audit.isError ? (
            <ErrorState
              description="Promoter audit history could not be loaded. Please retry."
              onRetry={() => void audit.refetch()}
            />
          ) : audit.data.items.length === 0 ? (
            <EmptyState
              title="No audit records"
              description="No privileged actions were recorded for this promoter."
            />
          ) : (
            <ol className="divide-y divide-border rounded-md border border-border">
              {audit.data.items.map((record) => (
                <li key={record.id} className="flex flex-col gap-2 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={AUDIT_ACTION_LABELS[record.action] ?? record.action}
                      tone={auditActionTone(record.action)}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      Admin {shortId(record.adminId)} · {record.adminRole ?? 'role unavailable'}
                    </span>
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={new Date(record.occurredAt).toISOString()}
                    >
                      {formatEpochMs(record.occurredAt)}
                    </time>
                  </div>
                  <p className="text-muted-foreground">{record.reason ?? 'No reason recorded'}</p>
                  {record.before !== null || record.after !== null ? (
                    <details>
                      <summary className="cursor-pointer text-xs font-medium">
                        Before and after snapshots
                      </summary>
                      <pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">
                        {JSON.stringify({ before: record.before, after: record.after }, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </li>
              ))}
            </ol>
          )}

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div>
              <h3 className="font-medium">Risk flags</h3>
              <p className="text-xs text-muted-foreground">
                Active provider disputes on orders with stored Promoter attribution. These flags are
                evidence for review and do not change commission balances.
                {riskFlags.data?.complete === false
                  ? ' The scan reached its 1,000-payment limit.'
                  : ''}
              </p>
            </div>
            {riskFlags.isPending ? (
              <LoadingState label="Loading Promoter risk flags…" />
            ) : riskFlags.isError ? (
              <ErrorState
                description="Promoter risk flags could not be loaded. Please retry."
                onRetry={() => void riskFlags.refetch()}
              />
            ) : riskFlags.data.flags.length === 0 ? (
              <EmptyState
                title="No active risk flags"
                description="No open attributed-order disputes were found in the scanned provider records."
              />
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {riskFlags.data.flags.map((flag) => (
                  <li
                    key={`${flag.paymentId}:${flag.disputeId}`}
                    className="flex flex-col gap-1 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={flag.status.replaceAll('_', ' ')} tone="warning" />
                      <span>{formatPaise(flag.amountPaise)}</span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      Booking {flag.bookingReference ?? shortId(flag.orderId)} · Event{' '}
                      {shortId(flag.eventId)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      Dispute {flag.disputeId}
                    </p>
                    {flag.providerOccurredAt ? (
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={flag.providerOccurredAt}
                      >
                        {formatDateTime(flag.providerOccurredAt)}
                      </time>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div>
              <h3 className="font-medium">Referral link status and activity</h3>
              <p className="text-xs text-muted-foreground">
                Latest 50 links. Clicks and conversions are bounded campaign counters, not financial
                or attribution records.
                {referralLinks.data?.pageInfo.hasNextPage
                  ? ' More links exist beyond this page.'
                  : ''}
              </p>
            </div>
            {referralLinks.isPending ? (
              <LoadingState label="Loading promoter referral links…" />
            ) : referralLinks.isError ? (
              <ErrorState
                description="Promoter referral links could not be loaded. Please retry."
                onRetry={() => void referralLinks.refetch()}
              />
            ) : referralLinks.data.items.length === 0 ? (
              <EmptyState title="No referral links" description="This promoter has no links." />
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full divide-y divide-border text-xs">
                  <thead className="bg-muted/50 text-left uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        Code
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Event
                      </th>
                      <th scope="col" className="px-3 py-2">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-2 text-right">
                        Clicks
                      </th>
                      <th scope="col" className="px-3 py-2 text-right">
                        Conversions
                      </th>
                      <th scope="col" className="px-3 py-2 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {referralLinks.data.items.map((link) => (
                      <tr key={link.id}>
                        <td className="px-3 py-2 font-mono">{link.code}</td>
                        <td className="px-3 py-2">{link.eventTitle || shortId(link.eventId)}</td>
                        <td className="px-3 py-2">{link.isActive ? 'Active' : 'Inactive'}</td>
                        <td className="px-3 py-2 text-right">{link.clicks}</td>
                        <td className="px-3 py-2 text-right">{link.conversions}</td>
                        <td className="px-3 py-2 text-right">
                          {link.isActive ? (
                            linkAction?.linkId === link.id ? (
                              <div className="flex min-w-48 flex-col items-end gap-2">
                                <label className="grid gap-1 text-left">
                                  <span>Reason for deactivation</span>
                                  <input
                                    required
                                    minLength={3}
                                    maxLength={500}
                                    value={linkAction.reason}
                                    onChange={(event) => {
                                      setLinkAction({
                                        linkId: link.id,
                                        reason: event.target.value,
                                      });
                                    }}
                                    className="rounded-md border border-input bg-background px-2 py-1"
                                  />
                                </label>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setLinkAction(null);
                                    }}
                                    disabled={deactivateLinkMutation.isPending}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={
                                      linkAction.reason.trim().length < 3 ||
                                      deactivateLinkMutation.isPending
                                    }
                                    onClick={() => {
                                      deactivateLinkMutation.mutate({
                                        linkId: link.id,
                                        reason: linkAction.reason.trim(),
                                      });
                                    }}
                                  >
                                    {deactivateLinkMutation.isPending ? 'Deactivating…' : 'Confirm'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setLinkAction({ linkId: link.id, reason: '' });
                                }}
                              >
                                Deactivate
                              </Button>
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {suspendMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The promoter could not be suspended. It is safe to retry — the request is
          idempotency-keyed.
        </p>
      ) : null}
      {reinstateMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The promoter could not be reinstated. It is safe to retry — the request is
          idempotency-keyed.
        </p>
      ) : null}
      {deactivateLinkMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The referral link could not be deactivated. Existing order attribution remains unchanged.
        </p>
      ) : null}
      {exportMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The CSV could not be generated. Please retry.
        </p>
      ) : null}
    </div>
  );
}
