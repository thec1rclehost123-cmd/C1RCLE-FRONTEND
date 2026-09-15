'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import {
  approveOnboardingApplication,
  getOnboardingDocumentReadUrl,
  listOnboardingApplications,
  rejectOnboardingApplication,
  requestOnboardingChanges,
} from '@/lib/admin/admin-api';
import { formatDateTime, onboardingStatusTone, ONBOARDING_STATUS_LABELS, shortId, StatusBadge } from '@/lib/admin/format';

/**
 * Doc-heavy filtered view of the onboarding queue — same data and actions
 * as `/onboarding`, but always scoped to the applications an admin needs
 * to act on right now (`submitted` + `changes_requested`), laid out one
 * applicant per card so the uploaded documents are the first thing visible
 * rather than a column squeezed into a wide table row.
 */

interface Reviewing {
  readonly applicationId: string;
  readonly mode: 'approve' | 'reject' | 'changes';
}

export default function KycReviewDesk() {
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState<Reviewing | null>(null);
  const [note, setNote] = useState('');

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
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const reviewNote = () => (note.trim() === '' ? undefined : note.trim());

  const approveMutation = useMutation({
    mutationFn: (applicationId: string) => approveOnboardingApplication(applicationId, reviewNote()),
    onSuccess: () => {
      setReviewing(null);
      setNote('');
      invalidate();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (applicationId: string) => rejectOnboardingApplication(applicationId, reviewNote()),
    onSuccess: () => {
      setReviewing(null);
      setNote('');
      invalidate();
    },
  });

  const changesMutation = useMutation({
    mutationFn: (applicationId: string) => requestOnboardingChanges(applicationId, reviewNote()),
    onSuccess: () => {
      setReviewing(null);
      setNote('');
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

  const anyPending = approveMutation.isPending || rejectMutation.isPending || changesMutation.isPending;

  const confirmReview = () => {
    if (reviewing === null || anyPending) {
      return;
    }
    switch (reviewing.mode) {
      case 'approve':
        approveMutation.mutate(reviewing.applicationId);
        break;
      case 'reject':
        rejectMutation.mutate(reviewing.applicationId);
        break;
      case 'changes':
        changesMutation.mutate(reviewing.applicationId);
        break;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="KYC review"
        description="Applications needing a decision right now — submitted and changes-requested. Documents up front; see the full history on the Onboarding desk."
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
          {applications.map((application) => {
            const isReviewing = reviewing?.applicationId === application.id;
            return (
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

                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Documents
                  </p>
                  {application.documents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">None uploaded</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {application.documents.map((document) => (
                        <Button
                          key={document.label}
                          size="sm"
                          variant="outline"
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
                      ))}
                    </div>
                  )}
                </div>

                {isReviewing ? (
                  <div className="flex flex-col gap-2">
                    <TextField
                      label="Note"
                      value={note}
                      onChange={(event) => {
                        setNote(event.target.value);
                      }}
                      placeholder={
                        reviewing.mode === 'changes' ? 'What should the applicant fix?' : 'Optional note'
                      }
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReviewing(null);
                          setNote('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" variant="primary" disabled={anyPending} onClick={confirmReview}>
                        Confirm
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setReviewing({ applicationId: application.id, mode: 'approve' });
                        setNote('');
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReviewing({ applicationId: application.id, mode: 'changes' });
                        setNote('');
                      }}
                    >
                      Request changes
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setReviewing({ applicationId: application.id, mode: 'reject' });
                        setNote('');
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {approveMutation.isError || rejectMutation.isError || changesMutation.isError ? (
        <p role="alert" className="text-sm text-destructive">
          The review could not be saved. It is safe to retry.
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
