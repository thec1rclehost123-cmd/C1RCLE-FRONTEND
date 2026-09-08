import styles from './slot-requests.module.css';

import type { SlotRequestStatus } from '@/data/partner-data-source';

const labels: Record<SlotRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export function SlotRequestStatusBadge({ status }: { readonly status: SlotRequestStatus }) {
  const statusClass = {
    pending: styles['statusPending'],
    approved: styles['statusApproved'],
    rejected: styles['statusRejected'],
  }[status];
  return (
    <span className={[styles['statusBadge'], statusClass].join(' ')}>
      <i aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
