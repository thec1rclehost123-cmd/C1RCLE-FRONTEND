import type {
  AdminRefundRequestStatus,
  AdminRole,
  AdminAction,
  AdminPayoutStatus,
  ProposalStatus,
  OnboardingStatus,
  EventStatus,
  HostStatus,
  VenueStatus,
} from '@/lib/admin/contract-types';

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatEpochMs(value: number): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super: 'Super admin',
  admin: 'Admin',
  ops: 'Operations',
  finance: 'Finance',
  support: 'Support',
};

export const ADMIN_ACTION_LABELS: Record<AdminAction, string> = {
  ONBOARDING_APPROVE: 'Approve onboarding',
  VENUE_SUSPEND: 'Suspend venue',
  VENUE_REINSTATE: 'Reinstate venue',
  ORGANIZATION_SUSPEND: 'Suspend organization',
  ORGANIZATION_REINSTATE: 'Reinstate organization',
  FINANCIAL_REFUND: 'Refund',
  PAYOUT_BATCH_RUN: 'Run payout batch',
  DISPUTE_RESOLVE: 'Resolve dispute',
  PAYOUT_FREEZE: 'Freeze payout',
  PAYOUT_RELEASE: 'Release payout',
  ADMIN_PROVISION: 'Provision admin',
  COMMISSION_ADJUST: 'Adjust commission',
};

/**
 * Labels for every action that can appear on an audit row. Keyed by string
 * (not `AdminAction`) because the CSV export writes backend-internal actions
 * like `ADMIN_EXPORT` that are not part of the wire `AdminAction` enum.
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ...ADMIN_ACTION_LABELS,
  ADMIN_EXPORT: 'Export audit CSV',
};

export const PAYOUT_STATUS_LABELS: Record<AdminPayoutStatus, string> = {
  requested: 'Requested',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  frozen: 'Frozen',
};

export const VENUE_STATUS_LABELS: Record<VenueStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  review: 'Under review',
  scheduled: 'Scheduled',
  published: 'Published',
  sales_paused: 'Sales paused',
  started: 'Started',
  ended: 'Ended',
  archived: 'Archived',
  cancelled: 'Cancelled',
};

export const HOST_STATUS_LABELS: Record<HostStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  archived: 'Archived',
};

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const REFUND_STATUS_LABELS: Record<AdminRefundRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  settled: 'Settled',
  failed: 'Failed',
};

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  changes_requested: 'Changes requested',
  approved: 'Approved',
  rejected: 'Rejected',
};

type Tone = 'default' | 'success' | 'warning' | 'destructive' | 'muted';

const TONE_CLASSES: Record<Tone, string> = {
  default: 'bg-muted text-foreground',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  muted: 'bg-muted text-muted-foreground',
};

export function StatusBadge({
  label,
  tone = 'default',
}: {
  readonly label: string;
  readonly tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}

export function proposalStatusTone(status: ProposalStatus): Tone {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'cancelled':
      return 'muted';
  }
}

export function refundStatusTone(status: AdminRefundRequestStatus): Tone {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'settled':
      return 'success';
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'failed':
      return 'destructive';
  }
}

export function onboardingStatusTone(status: OnboardingStatus): Tone {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'destructive';
    case 'draft':
    case 'submitted':
    case 'changes_requested':
      return 'warning';
  }
}

export function payoutStatusTone(status: AdminPayoutStatus): Tone {
  switch (status) {
    case 'paid':
      return 'success';
    case 'failed':
      return 'destructive';
    case 'frozen':
      return 'warning';
    case 'requested':
    case 'processing':
      return 'default';
  }
}

export function venueStatusTone(status: VenueStatus): Tone {
  switch (status) {
    case 'active':
      return 'success';
    case 'suspended':
      return 'destructive';
  }
}

export function eventStatusTone(status: EventStatus): Tone {
  switch (status) {
    case 'published':
    case 'started':
      return 'success';
    case 'scheduled':
      return 'default';
    case 'draft':
    case 'ended':
    case 'archived':
      return 'muted';
    case 'review':
    case 'sales_paused':
      return 'warning';
    case 'cancelled':
      return 'destructive';
  }
}

export function hostStatusTone(status: HostStatus): Tone {
  switch (status) {
    case 'active':
      return 'success';
    case 'suspended':
      return 'destructive';
    case 'archived':
      return 'muted';
  }
}

const AUDIT_ACTION_TONES: Record<string, Tone> = {
  ONBOARDING_APPROVE: 'success',
  VENUE_SUSPEND: 'destructive',
  FINANCIAL_REFUND: 'default',
  PAYOUT_BATCH_RUN: 'default',
  PAYOUT_FREEZE: 'warning',
  PAYOUT_RELEASE: 'success',
  ADMIN_PROVISION: 'default',
  COMMISSION_ADJUST: 'default',
};

/** Tones an audit action. Unknown (backend-internal) actions stay muted. */
export function auditActionTone(action: string): Tone {
  return AUDIT_ACTION_TONES[action] ?? 'muted';
}

export function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 12)}…` : id;
}
