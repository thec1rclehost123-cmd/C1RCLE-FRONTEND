import styles from './slot-requests.module.css';

import type { SlotRequestStatus } from '@/data/partner-data-source';

const cards: readonly { readonly status: SlotRequestStatus; readonly label: string }[] = [
  { status: 'pending', label: 'Pending' },
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
];

export function SlotRequestSummary({ counts }: { readonly counts: Readonly<Record<SlotRequestStatus, number>> }) {
  const toneClass = { pending: styles['summaryPending'], approved: styles['summaryApproved'], rejected: styles['summaryRejected'] };
  return <section className={styles['summaryGrid']} aria-label="Slot request summary">{cards.map((card) => <article className={[styles['summaryCard'], toneClass[card.status]].join(' ')} key={card.status}><span>{card.label}</span><strong>{counts[card.status]}</strong><small>{card.status === 'pending' ? 'Needs your review' : card.status === 'approved' ? 'Accepted requests' : 'Not accepted'}</small></article>)}</section>;
}
