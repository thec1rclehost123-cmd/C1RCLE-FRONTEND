'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button, EmptyState, ErrorState, LoadingState, TextField } from '@c1rcle/ui';

import { PageHeader } from '@/components/admin/page-header';
import { StatusFilter } from '@/components/admin/status-filter';
import {
  approveOnboardingApplication,
  listOnboardingApplications,
  ONBOARDING_STATUSES,
  rejectOnboardingApplication,
  requestOnboardingChanges,
  statusFilterOptions,
} from '@/lib/admin/admin-api';
import { formatDateTime, onboardingStatusTone, ONBOARDING_STATUS_LABELS, shortId, StatusBadge } from '@/lib/admin/format';

import type { OnboardingStatus } from '@/lib/admin/contract-types';

type Filter = OnboardingStatus;

interface Reviewing {
  readonly applicationId: string;
  readonly mode: 'approve' | 'reject' | 'changes';
}

const IN_REVIEWABLE: readonly OnboardingStatus[] = ['submitted', 'changes_requested'];

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
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Onboarding"
          description="Applicant submissions queued for KYC review. Approving a venue provisions its organization; a rejection or changes request returns it to the applicant."
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
        <EmptyState title="Nothing in this queue" description="No applications match this status." />
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
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data.items.map((application) => {
                const isReviewing = reviewing?.applicationId === application.id;
                const reviewable = IN_REVIEWABLE.includes(application.status);
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
                      <StatusBadge label={application.status} tone={onboardingStatusTone(application.status)} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {application.submittedAt === null ? '—' : formatDateTime(application.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isReviewing ? (
                        <div className="flex flex-col items-end gap-2">
                          <TextField
                            label="Note"
                            value={note}
                            onChange={(event) => { setNote(event.target.value); }}
                            placeholder={reviewing.mode === 'changes' ? 'What should the applicant fix?' : 'Optional note'}
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
    </div>
  );
}