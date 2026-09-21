'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import {
  getOnboardingDocumentReadUrl,
  listOnboardingApplications,
  rejectOnboardingDocument,
  verifyOnboardingDocument,
} from '@/lib/admin/admin-api';
import { formatDateTime, onboardingStatusTone, ONBOARDING_STATUS_LABELS, shortId, StatusBadge } from '@/lib/admin/format';

import type { OnboardingDocumentStatus } from '@/lib/admin/contract-types';

/**
 * KYC is document verification — "is this ID legitimate" — not the
 * application decision. This desk only verifies/rejects individual
 * uploaded documents; it has no approve/reject/request-changes actions of
 * its own. Approving or rejecting the *application* happens on the
 * Onboarding desk, which is blocked from approving until every required
 * document here is verified (the KYC gate).
 */

interface Rejecting {
  readonly applicationId: string;
  readonly label: string;
}

const DOCUMENT_STATUS_TONE: Record<OnboardingDocumentStatus, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  verified: 'success',
  rejected: 'destructive',
};

const DOCUMENT_STATUS_LABEL: Record<OnboardingDocumentStatus, string> = {
  pending: 'Needs review',
  verified: 'Verified',
  rejected: 'Rejected',
};

export default function KycReviewDesk() {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState<Rejecting | null>(null);
  const [reason, setReason] = useState('');

  const submitted = useQuery({
    queryKey: ['admin', 'onboarding', 'submitted'],
    queryFn: () => listOnboardingApplications('submitted'),
  });
  const changesRequested = useQuery({
    queryKey: ['admin', 'onboarding', 'changes_requested'],
    queryFn: () => listOnboardingApplications('changes_requested'),
  });

  const applications = [...(submitted.data?.items ?? []), ...(changesRequested.data?.items ?? [])];
  const isPending = submitted.isPending || changesRequested.isPending;
  const isError = submitted.isError || changesRequested.isError;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'onboarding'] });
  };

  const verifyMutation = useMutation({
    mutationFn: ({ applicationId, label }: { applicationId: string; label: string }) =>
      verifyOnboardingDocument(applicationId, label),
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: () => {
      if (rejecting === null) {
        throw new Error('No document selected');
      }
      return rejectOnboardingDocument(rejecting.applicationId, rejecting.label, reason.trim());
    },
    onSuccess: () => {
      setRejecting(null);
      setReason('');
      invalidate();
    },
  });

  const viewDocumentMutation = useMutation({
    mutationFn: ({ applicationId, label }: { applicationId: string; label: string }) =>
      getOnboardingDocumentReadUrl(applicationId, label),
    onSuccess: (grant) => {
      window.open(grant.readUrl, '_blank', 'noopener,noreferrer');
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="KYC review"
        description="Verify or reject each uploaded document — not the application itself. An applicant is approved or rejected on the Onboarding desk, which requires every required document verified here first."
      />

      {isPending ? (
        <LoadingState label="Loading applications…" />
      ) : isError ? (
        <ErrorState
          description="The queue could not be loaded. Please retry."
          onRetry={() => {
            void submitted.refetch();
            void changesRequested.refetch();
          }}
        />
      ) : applications.length === 0 ? (
        <EmptyState title="Nothing to review" description="No applications are waiting on a decision." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {applications.map((application) => (
            <div
              key={application.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{application.profile.legalName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {shortId(application.userId)} · {application.profile.city}
                  </p>
                </div>
                <StatusBadge
                  label={ONBOARDING_STATUS_LABELS[application.status]}
                  tone={onboardingStatusTone(application.status)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {application.requestedType} · {application.plan} · submitted{' '}
                {application.submittedAt === null ? '—' : formatDateTime(application.submittedAt)}
              </p>

              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Documents
                </p>
                {application.documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None uploaded</p>
                ) : (
                  application.documents.map((document) => {
                    const isRejecting =
                      rejecting?.applicationId === application.id && rejecting.label === document.label;
                    return (
                      <div
                        key={document.label}
                        className="flex flex-col gap-2 rounded-md border border-border p-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={viewDocumentMutation.isPending}
                            onClick={() => {
                              viewDocumentMutation.mutate({
                                applicationId: application.id,
                                label: document.label,
                              });
                            }}
                          >
                            {document.label}
                          </Button>
                          <StatusBadge
                            label={DOCUMENT_STATUS_LABEL[document.status]}
                            tone={DOCUMENT_STATUS_TONE[document.status]}
                          />
                        </div>
                        {document.status === 'rejected' && document.rejectionReason !== null ? (
                          <p className="text-xs text-muted-foreground">{document.rejectionReason}</p>
                        ) : null}
                        {isRejecting ? (
                          <div className="flex flex-col gap-2">
                            <TextField
                              label="Rejection reason"
                              value={reason}
                              onChange={(event) => {
                                setReason(event.target.value);
                              }}
                              placeholder="Why is this document rejected?"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejecting(null);
                                  setReason('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={rejectMutation.isPending || reason.trim() === ''}
                                onClick={() => {
                                  rejectMutation.mutate();
                                }}
                              >
                                Confirm rejection
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejecting({ applicationId: application.id, label: document.label });
                                setReason('');
                              }}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={document.status === 'verified' || verifyMutation.isPending}
                              onClick={() => {
                                verifyMutation.mutate({
                                  applicationId: application.id,
                                  label: document.label,
                                });
                              }}
                            >
                              Verify
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {verifyMutation.isError || rejectMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The document could not be updated. It is safe to retry.
        </p>
      ) : null}
      {viewDocumentMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The document could not be opened. It is safe to retry.
        </p>
      ) : null}
    </div>
  );
}
