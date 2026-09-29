'use client';

import { Button } from '@c1rcle/ui';

import {
  formatDateTime,
  onboardingStatusTone,
  ONBOARDING_STATUS_LABELS,
  shortId,
  StatusBadge,
} from '@/lib/admin/format';

import type { OnboardingDocumentStatus } from '@/lib/admin/contract-types';
import type { OnboardingRequestDto } from '@c1rcle/contracts';

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

function Field({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function OnboardingApplicationDetail({
  application,
  onOpenDocument,
  onClose,
}: {
  readonly application: OnboardingRequestDto;
  readonly onOpenDocument: (applicationId: string, label: string) => void;
  readonly onClose: () => void;
}) {
  const profile = application.profile;

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">{profile.legalName}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {shortId(application.id)} · {shortId(application.userId)} · {application.requestedType} ·{' '}
            {application.plan}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge
            label={ONBOARDING_STATUS_LABELS[application.status]}
            tone={onboardingStatusTone(application.status)}
          />
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="space-y-6 px-4 py-4">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Status" value={ONBOARDING_STATUS_LABELS[application.status]} />
          <Field label="Requested type" value={application.requestedType} />
          <Field label="Plan" value={application.plan} />
          <Field label="Submitted" value={application.submittedAt === null ? '—' : formatDateTime(application.submittedAt)} />
          <Field label="Reviewed by" value={application.reviewedBy === null ? '—' : shortId(application.reviewedBy)} />
          <Field label="Reviewed at" value={application.reviewedAt === null ? '—' : formatDateTime(application.reviewedAt)} />
          <Field label="Review note" value={application.reviewNote ?? '—'} />
          <Field label="Provisioned org" value={application.provisionedOrganizationId === null ? '—' : shortId(application.provisionedOrganizationId)} />
          <Field label="Missing documents" value={application.missingDocuments.length === 0 ? 'None' : application.missingDocuments.join(', ')} />
          <Field label="Version" value={String(application.version)} />
          <Field label="Created" value={formatDateTime(application.createdAt)} />
          <Field label="Updated" value={formatDateTime(application.updatedAt)} />
        </dl>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Applicant profile</p>
          <dl className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Legal name" value={profile.legalName} />
            <Field label="Contact person" value={profile.contactPerson} />
            <Field label="Phone" value={profile.phone} />
            <Field label="City" value={profile.city} />
            {profile.area === undefined || profile.area === '' ? null : <Field label="Area" value={profile.area} />}
            {profile.website === undefined || profile.website === '' ? null : <Field label="Website" value={profile.website} />}
            {profile.capacity === undefined || profile.capacity === null ? null : <Field label="Capacity" value={String(profile.capacity)} />}
            {profile.instagram === undefined || profile.instagram === '' ? null : <Field label="Instagram" value={profile.instagram} />}
            {profile.bio === undefined || profile.bio === '' ? null : <Field label="Bio" value={profile.bio} />}
            {profile.businessType === undefined || profile.businessType === '' ? null : <Field label="Business type" value={profile.businessType} />}
            {profile.registrationNumber === undefined || profile.registrationNumber === '' ? null : <Field label="Registration number" value={profile.registrationNumber} />}
            {profile.entityType === undefined || profile.entityType === '' ? null : <Field label="Entity type" value={profile.entityType} />}
          </dl>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Documents</p>
          {application.documents.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None uploaded</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {application.documents.map((document) => (
                <li key={document.label} className="rounded-md border border-border p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{document.label}</p>
                      <p className="text-xs text-muted-foreground">
                        uploaded {formatDateTime(document.uploadedAt)}
                        {document.reviewedAt === null ? '' : ` · reviewed ${formatDateTime(document.reviewedAt)}`}
                        {document.reviewedBy === null ? '' : ` by ${shortId(document.reviewedBy)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        label={DOCUMENT_STATUS_LABEL[document.status]}
                        tone={DOCUMENT_STATUS_TONE[document.status]}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onOpenDocument(application.id, document.label);
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                  {document.status === 'rejected' && document.rejectionReason !== null ? (
                    <p className="mt-1 text-xs text-destructive">{document.rejectionReason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}