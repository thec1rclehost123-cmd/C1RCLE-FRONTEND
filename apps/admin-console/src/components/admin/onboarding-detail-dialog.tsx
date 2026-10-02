'use client';

import { ExternalLinkIcon } from '@c1rcle/icons';
import { Button } from '@c1rcle/ui';

import { Modal } from '@/components/admin/modal';
import {
  formatDateTime,
  onboardingStatusTone,
  ONBOARDING_STATUS_LABELS,
  StatusBadge,
} from '@/lib/admin/format';

import type { OnboardingDocumentStatus } from '@/lib/admin/contract-types';
import type { OnboardingRequestDto } from '@c1rcle/contracts';
import type { ReactNode } from 'react';

/**
 * Shared by both the Onboarding and KYC desks — the API's list response
 * already returns the full `OnboardingRequestDto` (profile fields, review
 * trail, per-document review state), but neither desk's table/card view
 * surfaces all of it. This renders what's already in hand; no new network
 * call.
 */
export interface OnboardingDetailDialogProps {
  readonly application: OnboardingRequestDto | null;
  readonly onClose: () => void;
  readonly onViewDocument: (label: string) => void;
  readonly viewDocumentPending?: boolean;
}

const DOCUMENT_STATUS_TONE: Record<
  OnboardingDocumentStatus,
  'warning' | 'success' | 'destructive'
> = {
  pending: 'warning',
  verified: 'success',
  rejected: 'destructive',
};

function Field({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

function orDash(value: string | number | null | undefined): ReactNode {
  if (value === null || value === undefined || value === '') return '—';
  return value;
}

export function OnboardingDetailDialog({
  application,
  onClose,
  onViewDocument,
  viewDocumentPending = false,
}: OnboardingDetailDialogProps) {
  if (application === null) return null;
  const { profile } = application;

  return (
    <Modal
      open
      onClose={onClose}
      title={profile.legalName}
      description={`${application.requestedType} · ${application.plan} application`}
    >
      <div className="flex flex-col gap-6">
        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Application</h3>
            <StatusBadge
              label={ONBOARDING_STATUS_LABELS[application.status]}
              tone={onboardingStatusTone(application.status)}
            />
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field label="Contact person" value={orDash(profile.contactPerson)} />
            <Field label="Phone" value={orDash(profile.phone)} />
            <Field label="City" value={orDash(profile.city)} />
            <Field label="Area" value={orDash(profile.area)} />
            <Field label="Website" value={orDash(profile.website)} />
            <Field label="Instagram" value={orDash(profile.instagram)} />
            <Field label="Entity type" value={orDash(profile.entityType)} />
            <Field label="Business type" value={orDash(profile.businessType)} />
            <Field label="Registration number" value={orDash(profile.registrationNumber)} />
            <Field label="Capacity" value={profile.capacity ?? '—'} />
          </dl>
          {profile.bio === undefined || profile.bio === '' ? null : (
            <div className="mt-3">
              <Field label="Bio" value={<p className="whitespace-pre-wrap">{profile.bio}</p>} />
            </div>
          )}
        </section>

        <section className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Review trail</h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field
              label="Submitted"
              value={
                application.submittedAt === null ? '—' : formatDateTime(application.submittedAt)
              }
            />
            <Field label="Reviewed by" value={application.reviewedBy ?? '—'} />
            <Field
              label="Reviewed at"
              value={application.reviewedAt === null ? '—' : formatDateTime(application.reviewedAt)}
            />
            <Field label="Provisioned org" value={application.provisionedOrganizationId ?? '—'} />
          </dl>
          {application.reviewNote === null || application.reviewNote === '' ? null : (
            <div className="mt-3">
              <Field
                label="Review note"
                value={<p className="whitespace-pre-wrap">{application.reviewNote}</p>}
              />
            </div>
          )}
        </section>

        <section className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Documents</h3>
          {application.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">None uploaded.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {application.documents.map((document) => (
                <li
                  key={document.label}
                  className="flex flex-col gap-2 rounded-md border border-border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium capitalize">
                      {document.label.replaceAll('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={document.status}
                        tone={DOCUMENT_STATUS_TONE[document.status]}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={viewDocumentPending}
                        onClick={() => {
                          onViewDocument(document.label);
                        }}
                      >
                        <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
                        View
                      </Button>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
                    <Field label="Uploaded" value={formatDateTime(document.uploadedAt)} />
                    <Field
                      label="Reviewed"
                      value={
                        document.reviewedAt === null ? '—' : formatDateTime(document.reviewedAt)
                      }
                    />
                    <Field label="Reviewed by" value={orDash(document.reviewedBy)} />
                  </dl>
                  {document.status === 'rejected' && document.rejectionReason !== null ? (
                    <p className="text-xs text-destructive">{document.rejectionReason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {application.missingDocuments.length === 0 ? null : (
            <p className="mt-2 text-xs text-muted-foreground">
              Still missing: {application.missingDocuments.join(', ')}
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
