import Link from 'next/link';

import { ForwardIcon } from '@c1rcle/icons';

import { EventPoster } from './EventPoster';
import styles from './events.module.css';
import { EventStatusBadge } from './EventStatusBadge';

import type { PartnerEventRecord } from '@/data/partner-data-source';

export function EventCard({
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
  return (
    <article className={styles['eventCard']}>
      <div className={styles['cardPoster']}>
        <EventPoster artwork={event.artwork} sizes="(max-width: 700px) 100vw, 260px" />
        <div className={styles['posterShade']} aria-hidden="true" />
        <div className={styles['cardStatus']}>
          <EventStatusBadge status={event.status} />
        </div>
        {canEdit ? (
          <Link className={styles['editEvent']} href={editHref}>
            Edit event
          </Link>
        ) : null}
        <Link className={styles['namePlate']} href={href}>
          <strong>{event.name}</strong>
          <span>{event.venue}</span>
        </Link>
      </div>
      <Link className={styles['cardDetails']} href={href}>
        <span className={styles['dateBlock']}>
          <strong>{event.dayLabel}</strong>
          <small>{event.monthLabel}</small>
        </span>
        <span className={styles['eventMeta']}>
          <strong>{event.timeLabel.toLowerCase()}</strong>
          {event.host !== 'Host details unavailable' ? (
            <span>
              <i>{event.hostInitials}</i>
              {event.host}
            </span>
          ) : null}
        </span>
        <span className={styles['priceBlock']}>
          <small>From</small>
          <strong>{event.priceLabel}</strong>
        </span>
      </Link>
      <div className={styles['exploreWrap']}>
        <Link className={styles['exploreButton']} href={href}>
          Explore event <ForwardIcon size={14} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
