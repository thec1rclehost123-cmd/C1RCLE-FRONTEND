import Link from 'next/link';

import { EventPoster } from './EventPoster';
import styles from './events.module.css';
import { EventStatusBadge } from './EventStatusBadge';

import type { PartnerEventRecord } from '@/data/partner-data-source';

export function EventListRow({
  event,
  href,
  editHref,
  canEdit = true,
}: {
  readonly event: PartnerEventRecord;
  readonly href: string;
  readonly editHref: string;
  readonly canEdit?: boolean;
}) {
  const sold = event.sold;
  const actionLabel = canEdit && event.status === 'Draft' ? 'Continue' : 'View';
  const actionHref = canEdit && event.status === 'Draft' ? editHref : href;

  return (
    <div className={styles['eventListRow']}>
      <Link className={styles['eventListIdentity']} href={href}>
        <EventPoster artwork={event.artwork} className={styles['listPoster']} sizes="52px" />
        <span>
          <strong>{event.name}</strong>
          <small>{event.tag}</small>
        </span>
      </Link>
      <div className={styles['eventWhen']}>
        <strong>
          {event.venue} · {event.dateLabel}
        </strong>
        <span>{event.timeLabel}</span>
      </div>
      <div className={styles['ticketMetric']}>
        <strong>
          {sold === null
            ? 'Sales unavailable'
            : `${event.salesCountComplete === false ? '≥ ' : ''}${sold.toLocaleString('en-IN')} ${sold === 1 ? 'ticket' : 'tickets'} issued`}
        </strong>
        <small>
          {event.capacity === null
            ? 'Room capacity not configured'
            : `Room capacity: ${event.capacity.toLocaleString('en-IN')}`}
          {event.salesCountComplete === false ? ' · Sales count is a lower bound' : ''}
        </small>
      </div>
      <EventStatusBadge status={event.status} />
      <Link className={styles['rowAction']} href={actionHref}>
        {actionLabel}
      </Link>
    </div>
  );
}
