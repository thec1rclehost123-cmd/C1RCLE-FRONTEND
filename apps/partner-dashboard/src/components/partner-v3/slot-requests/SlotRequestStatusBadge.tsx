import styles from './slot-requests.module.css';

import type { SlotRequestStatus } from '@/data/partner-data-source';

const labels: Record<SlotRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export function SlotRequestStatusBadge({ status }: { readonly status: SlotRequestStatus }) {
  const statusClass = { pending: styles['statusPending'], approved: styles['statusApproved'], rejected: styles['statusRejected'], cancelled: styles['statusCancelled'] }[status];
  return <span className={[styles['statusBadge'], statusClass].join(' ')}><i aria-hidden="true" />{labels[status]}</span>;
}