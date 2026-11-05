import Link from 'next/link';

import { EditIcon, ForwardIcon } from '@c1rcle/icons';

import { EventPoster } from '@/components/partner-v3/events/EventPoster';
import { PageContainer } from '@/components/partner-v3/PagePrimitives';

import styles from './event-workspace.module.css';
import { EventWorkspaceTabs } from './EventWorkspaceTabs';

import type { PartnerEventArtwork } from '@/data/partner-data-source';
import type { ReactNode } from 'react';

export interface EventWorkspaceMetric {
  readonly label: string;
  readonly value: string;
}

export interface EventWorkspaceTab {
  readonly label: string;
  readonly href: string;
  readonly children?: readonly { readonly label: string; readonly href: string }[];
}

export interface EventWorkspaceModel {
  readonly id: string;
  readonly title: string;
  readonly venue: string;
  readonly dateTime: string;
  readonly statusLabel: string;
  readonly contextLabel?: string;
  readonly artwork: PartnerEventArtwork;
  readonly metrics: readonly EventWorkspaceMetric[];
}

export function EventWorkspaceChrome({
  studio,
  event,
  tabs,
  children,
}: {
  readonly studio: 'venue' | 'host' | 'promoter';
  readonly event: EventWorkspaceModel;
  readonly tabs: readonly EventWorkspaceTab[];
  readonly children: ReactNode;
}) {
  const baseHref = `/partner/${studio}/events/${encodeURIComponent(event.id)}`;

  return (
    <div className={styles['workspacePage']}>
      <div className={styles['pageBackdrop']} aria-hidden="true">
        <div className={styles['pageBackdropArtwork']}>
          <EventPoster artwork={event.artwork} sizes="100vw" />
        </div>
        <span />
      </div>
      <PageContainer>
        <div
          className={[styles['workspace'], studio === 'host' ? styles['workspaceHost'] : '']
            .filter(Boolean)
            .join(' ')}
        >
          <header className={styles['hero']}>
            <div className={styles['poster']}>
              <EventPoster artwork={event.artwork} sizes="(max-width: 700px) 100vw, 210px" />
            </div>
            <div className={styles['identity']}>
              <div className={styles['identityTop']}>
                <div className={styles['eventDetails']}>
                  <span className={styles['statusBadge']}>{event.statusLabel}</span>
                  <h1>{event.title}</h1>
                  <p>{event.venue}</p>
                  <p>{event.dateTime}</p>
                  {event.contextLabel ? <p>{event.contextLabel}</p> : null}
                </div>
                {studio !== 'promoter' ? (
                  <div className={styles['actions']}>
                    <Link href={`${baseHref}/edit`}>
                      <EditIcon size={14} aria-hidden="true" /> Edit event
                    </Link>
                    <Link className={styles['primaryAction']} href={`${baseHref}/door`}>
                      Open door mode <ForwardIcon size={14} aria-hidden="true" />
                    </Link>
                  </div>
                ) : null}
              </div>
              <dl className={styles['metrics']}>
                {event.metrics.map((metric) => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </header>
          <EventWorkspaceTabs tabs={tabs} baseHref={baseHref} />
          <div className={styles['workspaceContent']}>{children}</div>
        </div>
      </PageContainer>
    </div>
  );
}
