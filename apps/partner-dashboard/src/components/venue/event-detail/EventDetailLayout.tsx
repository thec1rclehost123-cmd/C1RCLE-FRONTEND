'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { CalendarIcon, LocationIcon } from '@c1rcle/icons';

import { EventDetailActions } from './EventDetailActions';
import styles from './EventDetailLayout.module.css';
import { EventDetailTabs } from './EventDetailTabs';

import type { ReactNode } from 'react';

export interface SharedEventDetailHeaderModel {
  readonly id: string;
  readonly name: string;
  readonly venue: string;
  readonly dateTimeLabel: string;
  readonly posterSrc: string;
  readonly posterAlt: string;
  readonly statusLabel?: string;
  readonly statusTone?: 'success' | 'warning' | 'neutral';
  readonly roleLabel?: string;
}

export function EventDetailLayout({
  event,
  tabs,
  actions,
  children,
}: {
  readonly event: SharedEventDetailHeaderModel;
  readonly tabs?: readonly { readonly label: string; readonly href: string }[];
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles['eventDetail']}>
      <div className={styles['eventBackdrop']} aria-hidden="true">
        <Image src={event.posterSrc} alt="" fill sizes="100vw" priority />
      </div>
      <div className={styles['eventHero']}>
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
            {event.statusLabel || event.roleLabel ? (
              <div className={styles['badgeRow']}>
                {event.statusLabel ? (
                  <span className={styles['statusTag']} data-tone={event.statusTone ?? 'success'}>
                    {event.statusLabel}
                  </span>
                ) : null}
                {event.roleLabel ? (
                  <span className={styles['roleTag']}>{event.roleLabel}</span>
                ) : null}
              </div>
            ) : null}
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

          {actions !== undefined ? (
            <div className={styles['eventActions']}>{actions}</div>
          ) : (
            <EventDetailActions eventId={event.id} eventName={event.name} />
          )}
        </header>

        {tabs ? (
          <nav className={styles['eventTabs']} aria-label="Event details">
            {tabs.map((tab) => {
              const selected = pathname === tab.href;
              return (
                <Link key={tab.label} href={tab.href} aria-current={selected ? 'page' : undefined}>
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        ) : (
          <EventDetailTabs eventId={event.id} />
        )}
      </div>

      <div className={styles['eventBody']}>{children}</div>
    </div>
  );
}
