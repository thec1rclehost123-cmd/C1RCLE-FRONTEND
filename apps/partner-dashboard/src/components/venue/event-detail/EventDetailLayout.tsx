import Image from 'next/image';

import { CalendarIcon, LocationIcon } from '@c1rcle/icons';

import { EventDetailActions } from './EventDetailActions';
import styles from './EventDetailLayout.module.css';
import { EventDetailTabs } from './EventDetailTabs';

import type { VenueEventDetailHeaderModel } from '../event-detail-model';
import type { ReactNode } from 'react';

export function EventDetailLayout({
  event,
  children,
}: {
  readonly event: VenueEventDetailHeaderModel;
  readonly children: ReactNode;
}) {
  return (
    <div className={styles['eventDetail']}>
      <header className={styles['eventHeader']}>
        <Image
          src={event.posterSrc}
          alt={event.posterAlt}
          width={158}
          height={148}
          sizes="158px"
          priority
        />
        <div className={styles['eventIdentity']}>
          <h1>{event.name}</h1>
          <p>
            <LocationIcon size={19} aria-hidden="true" />
            {event.venue}
          </p>
          <p>
            <CalendarIcon size={19} aria-hidden="true" />
            {event.dateTimeLabel}
          </p>
        </div>
        <EventDetailActions eventId={event.id} eventName={event.name} />
      </header>

      <EventDetailTabs eventId={event.id} />

      <div className={styles['eventBody']}>{children}</div>
    </div>
  );
}
