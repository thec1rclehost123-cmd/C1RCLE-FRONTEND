import Link from 'next/link';

import { DoorModeIcon, EditIcon } from '@c1rcle/icons';

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
        <EventPoster
          className={styles['pageBackdropArtwork']}
          artwork={event.artwork}
          sizes="100vw"
        />
        <span />
      </div>
      <PageContainer>
        <div
          className={[styles['workspace'], studio === 'host' ? styles['workspaceHost'] : '']
            .filter(Boolean)
            .join(' ')}
        >
          <EventWorkspaceTabs tabs={tabs} baseHref={baseHref} level="primary" />
          <header className={styles['hero']} data-testid="event-workspace-event-info">
            <div className={styles['poster']}>
              <EventPoster artwork={event.artwork} sizes="(max-width: 700px) 100vw, 210px" />
            </div>
            <div className={styles['identity']}>
              <div className={styles['identityTop']}>
                <div className={styles['eventDetails']}>
                  <div className={styles['eventMetaLine']}>
                    <span>{event.venue}</span>
                    <span aria-hidden="true">·</span>
                    <span>{event.dateTime}</span>
                    <span className={styles['statusBadge']}>{event.statusLabel}</span>
                  </div>
                  <h1>{event.title}</h1>
                  {event.contextLabel ? <p>{event.contextLabel}</p> : null}
                </div>
                {studio !== 'promoter' ? (
                  <div className={styles['actions']}>
                    <Link href={`${baseHref}/edit`}>
                      <EditIcon size={14} aria-hidden="true" /> Edit
                    </Link>
                    <Link className={styles['primaryAction']} href={`${baseHref}/door`}>
                      <DoorModeIcon size={14} aria-hidden="true" /> Door Mode
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
          <EventWorkspaceTabs tabs={tabs} baseHref={baseHref} level="secondary" />
          <div className={styles['workspaceContent']}>{children}</div>
        </div>
      </PageContainer>
    </div>
  );
}
