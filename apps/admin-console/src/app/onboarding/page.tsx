'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  approveOnboardingApplication,
  getOnboardingDocumentReadUrl,
  listOnboardingApplications,
  ONBOARDING_STATUSES,
  rejectOnboardingApplication,
  requestOnboardingChanges,
  statusFilterOptions,
} from '@/lib/admin/admin-api';
import {
  formatDateTime,
  onboardingStatusTone,
  ONBOARDING_STATUS_LABELS,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

import type { OnboardingStatus } from '@/lib/admin/contract-types';
import type { OnboardingRequestDto } from '@c1rcle/contracts';

type Filter = OnboardingStatus;

interface Reviewing {
  readonly applicationId: string;
  readonly mode: 'approve' | 'reject' | 'changes';
}

const IN_REVIEWABLE: readonly OnboardingStatus[] = ['submitted', 'changes_requested'];

const REQUIRED_DOCUMENT_LABELS = ['id_front', 'id_back', 'selfie'];
const REQUIRED_DOCUMENT_LABELS_BUSINESS = [
  'registration_certificate',
  'sig_id_front',
  'sig_id_back',
  'sig_selfie',
];

/**
 * Mirrors the backend's KYC gate (`allRequiredDocumentsVerified` in
 * `packages/core/src/domain/models/onboarding.ts`) so the Approve button
 * can be disabled client-side with a clear reason, rather than just
 * bouncing off a 400 after the admin clicks it.
 */
function allRequiredDocumentsVerified(application: OnboardingRequestDto): boolean {
  const required =
    application.profile.entityType === 'business'
      ? REQUIRED_DOCUMENT_LABELS_BUSINESS
      : REQUIRED_DOCUMENT_LABELS;
  return required.every((label) =>
    application.documents.some(
      (document) => document.label === label && document.status === 'verified',
    ),
  );
}

export default function OnboardingDesk() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('submitted');
  const [reviewing, setReviewing] = useState<Reviewing | null>(null);
  const [note, setNote] = useState('');

  const list = useQuery({
    queryKey: ['admin', 'onboarding', filter],
    queryFn: () => listOnboardingApplications(filter),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'onboarding'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  };

  const reviewNote = () => (note.trim() === '' ? undefined : note.trim());

  const approveMutation = useMutation({
    mutationFn: (applicationId: string) =>
      approveOnboardingApplication(applicationId, reviewNote()),
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

  const anyPending =
    approveMutation.isPending || rejectMutation.isPending || changesMutation.isPending;

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
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Onboarding"
          description="The application decision — approve, reject, or request changes. Approving provisions the organization; it's blocked until every required document is verified on the KYC desk."
        />
        <StatusFilter
          id="onboarding-status"
          value={filter}
          onChange={setFilter}
          options={statusFilterOptions(ONBOARDING_STATUS_LABELS, ONBOARDING_STATUSES)}
        />
      </div>

      {list.isPending ? (
        <LoadingState label="Loading applications…" />
      ) : list.isError ? (
        <ErrorState
          description="Applications could not be loaded. Please retry."
          onRetry={() => void list.refetch()}
        />
      ) : list.data.items.length === 0 ? (
        <EmptyState
          title="Nothing in this queue"
          description="No applications match this status."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Applicant
                </th>
                <th scope="col" className="px-4 py-3">
                  Type / plan
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Submitted
                </th>
                <th scope="col" className="px-4 py-3">
                  Documents
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((application) => {
                const isReviewing = reviewing?.applicationId === application.id;
                const reviewable = IN_REVIEWABLE.includes(application.status);
                const docsVerified = allRequiredDocumentsVerified(application);
                return (
                  <tr key={application.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{application.profile.legalName}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {shortId(application.userId)} · {application.profile.city}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {application.requestedType} · {application.plan}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={application.status}
                        tone={onboardingStatusTone(application.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {application.submittedAt === null
                        ? '—'
                        : formatDateTime(application.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {application.documents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">None uploaded</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {application.documents.map((document) => (
                            <Button
                              key={document.label}
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
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isReviewing ? (
                        <div className="flex flex-col items-end gap-2">
                          <TextField
                            label="Note"
                            value={note}
                            onChange={(event) => {
                              setNote(event.target.value);
                            }}
                            placeholder={
                              reviewing.mode === 'changes'
                                ? 'What should the applicant fix?'
                                : 'Optional note'
                            }
                            className="w-72"
                          />
                          <div className="flex gap-2">
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
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={anyPending}
                              onClick={confirmReview}
                            >
                              Confirm
                            </Button>
                          </div>
                        </div>
                      ) : reviewable ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={!docsVerified}
                              title={
                                docsVerified
                                  ? undefined
                                  : 'All required documents must be verified on the KYC desk first'
                              }
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
                          {docsVerified ? null : (
                            <p className="text-xs text-muted-foreground">Needs KYC verification</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-right text-xs text-muted-foreground">
                          {application.provisionedOrganizationId === null
                            ? '—'
                            : `Org ${shortId(application.provisionedOrganizationId)}`}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
