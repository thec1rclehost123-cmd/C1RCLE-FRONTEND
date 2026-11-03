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
      <div className={styles['cardPoster']} aria-hidden="true">
        <EventPoster artwork={event.artwork} sizes="(max-width: 700px) 100vw, 260px" />
        <div className={styles['posterShade']} aria-hidden="true" />
      </div>
      <div className={styles['eventCardContent']}>
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
        <div className={styles['cardDetails']}>
          <span className={styles['dateTimeBlock']}>
            <strong>
              {event.dayLabel} {event.monthLabel}
            </strong>
            <span aria-hidden="true">·</span>
            <time>{event.timeLabel}</time>
          </span>
          <span className={styles['priceBlock']}>
            <small>From</small>
            <strong>{event.priceLabel}</strong>
          </span>
        </div>
        <div className={styles['exploreWrap']}>
          <Link className={styles['exploreButton']} href={href}>
            Explore event <ForwardIcon size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
