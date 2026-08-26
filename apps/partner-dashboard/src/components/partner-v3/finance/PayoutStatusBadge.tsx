import styles from './finance.module.css';

import type { FinanceOrderStatus, FinancePayoutStatus } from '@/data/partner-data-source';


export function PayoutStatusBadge({ status }: { readonly status: FinancePayoutStatus | FinanceOrderStatus }) {
  return <span className={styles['payoutStatus']} data-status={status.toLowerCase()}>{status}</span>;
}
