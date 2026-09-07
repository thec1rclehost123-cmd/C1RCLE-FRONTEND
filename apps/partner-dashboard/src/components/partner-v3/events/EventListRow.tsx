import Link from 'next/link';

import { EventPoster } from './EventPoster';
import styles from './events.module.css';
import { EventStatusBadge } from './EventStatusBadge';

import type { PartnerEventRecord } from '@/data/partner-data-source';

export function EventListRow({ event, href, editHref }: { readonly event: PartnerEventRecord; readonly href: string; readonly editHref: string }) {
  const soldPercent = Math.round((event.sold / event.capacity) * 100);
  const actionLabel = event.status === 'Draft' ? 'Continue' : 'View';
  const actionHref = event.status === 'Draft' ? editHref : href;

  return (
    <div className={styles['eventListRow']}>
      <Link className={styles['eventListIdentity']} href={href}>
        <EventPoster artwork={event.artwork} className={styles['listPoster']} sizes="52px" />
        <span><strong>{event.name}</strong><small>{event.tag}</small></span>
      </Link>
      <div className={styles['eventWhen']}><strong>{event.venue} · {event.dateLabel}</strong><span>{event.timeLabel}</span></div>
      <div className={styles['ticketMetric']}><strong>{event.sold.toLocaleString('en-IN')} / {event.capacity.toLocaleString('en-IN')}</strong><progress value={soldPercent} max={100} aria-label={`${String(soldPercent)}% of tickets sold`} /></div>
      <EventStatusBadge status={event.status} />
      <Link className={styles['rowAction']} href={actionHref}>{actionLabel}</Link>
    </div>
  );
}
