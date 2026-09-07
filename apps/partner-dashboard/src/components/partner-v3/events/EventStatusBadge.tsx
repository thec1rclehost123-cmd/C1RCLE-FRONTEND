import styles from './events.module.css';

import type { PartnerEventStatus } from '@/data/partner-data-source';

const toneClasses: Readonly<Record<PartnerEventStatus, string>> = {
  Live: styles['statusLive'] ?? '',
  Draft: styles['statusDraft'] ?? '',
  Past: styles['statusPast'] ?? '',
  Cancelled: styles['statusCancelled'] ?? '',
};

export function EventStatusBadge({ status }: { readonly status: PartnerEventStatus }) {
  return <span className={[styles['statusBadge'], toneClasses[status]].join(' ')}><i aria-hidden="true" />{status}</span>;
}
