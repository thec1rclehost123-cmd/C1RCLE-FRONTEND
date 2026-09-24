import Link from 'next/link';

import {
  CalendarIcon,
  DoorModeIcon,
  EditIcon,
  TicketIcon,
  TimeIcon,
  TrendUpIcon,
  VisibleIcon,
} from '@c1rcle/icons';

import { EventPoster } from '@/components/partner-v3/events/EventPoster';
import { EventStatusBadge } from '@/components/partner-v3/events/EventStatusBadge';

import styles from './event-detail.module.css';
import { EventMetric } from './EventMetric';

import type { PartnerEventDetailData } from '@/data/partner-data-source';

export function EventDetailHeader({
  data,
  editHref,
  doorHref,
  accent = 'orange',
}: {
  readonly data: PartnerEventDetailData;
  readonly editHref: string;
  readonly doorHref: string;
  readonly accent?: 'orange' | 'lavender';
}) {
  const metricIcons = [
    <TicketIcon key="tickets" size={14} aria-hidden="true" />,
    <VisibleIcon key="visits" size={14} aria-hidden="true" />,
    <TrendUpIcon key="conversion" size={14} aria-hidden="true" />,
  ];

  return (
    <section
      className={[styles['detailHero'], accent === 'lavender' ? styles['detailHeroLavender'] : '']
        .filter(Boolean)
        .join(' ')}
      aria-labelledby="event-detail-title"
    >
      <div className={styles['detailBackdrop']} aria-hidden="true">
        <EventPoster
          className={styles['detailBackdropArtwork']}
          artwork={data.event.artwork}
          sizes="100vw"
        />
        <span />
      </div>
      <div className={styles['detailPoster']}>
        <EventPoster
          className={styles['detailPosterArtwork']}
          artwork={data.event.artwork}
          sizes="240px"
        />
      </div>
      <div className={styles['detailIdentity']}>
        <div className={styles['detailIdentityTop']}>
          <div>
            <div className={styles['detailVenueLine']}>{data.venueLine}</div>
            <h1 id="event-detail-title">{data.event.name}</h1>
            <div className={styles['detailEventMeta']}>
              <span>
                <CalendarIcon size={14} aria-hidden="true" />
                {data.event.dateLabel}
              </span>
              <span>
                <TimeIcon size={14} aria-hidden="true" />
                {data.event.timeLabel}
              </span>
              <EventStatusBadge status={data.event.status} />
            </div>
          </div>
          <div className={styles['detailActions']}>
            <Link className={styles['detailActionSecondary']} href={editHref}>
              <EditIcon size={14} aria-hidden="true" />
              Edit
            </Link>
            <Link className={styles['detailActionPrimary']} href={doorHref}>
              <DoorModeIcon size={15} aria-hidden="true" />
              Door Mode
            </Link>
          </div>
        </div>
        <div className={styles['detailMetrics']}>
          {data.metrics.map((metric, index) => (
            <EventMetric key={metric.label} {...metric} icon={metricIcons[index]} />
          ))}
        </div>
      </div>
    </section>
  );
}
